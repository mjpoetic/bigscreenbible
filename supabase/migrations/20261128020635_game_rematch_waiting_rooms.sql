-- Rematch guests must respond before the host can start the shared countdown.
create or replace function private.validate_bsb_game_room_player_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room public.bsb_game_challenges%rowtype;
  active_player_count integer;
begin
  if tg_op = 'INSERT' then
    select *
    into room
    from public.bsb_game_challenges as challenge
    where challenge.id = new.challenge_id
    for update;
  elsif old.invite_status is distinct from new.invite_status
    or old.ready is distinct from new.ready
  then
    select *
    into room
    from public.bsb_game_challenges as challenge
    where challenge.id = new.challenge_id
    for update;
  else
    select *
    into room
    from public.bsb_game_challenges as challenge
    where challenge.id = new.challenge_id;
  end if;

  if not found then
    raise exception 'That game room does not exist'
      using errcode = '23503';
  end if;

  if tg_op = 'INSERT' then
    if (select auth.uid()) is null or (select auth.uid()) <> room.challenger_id then
      raise exception 'Only the room host can invite players'
        using errcode = '42501';
    end if;
    if room.status <> 'pending' or room.expires_at <= now() then
      raise exception 'Players can only be invited to an open room'
        using errcode = '23514';
    end if;
    if room.rematch_of is not null then
      if not exists (
        select 1 from public.bsb_game_challenge_players as player
        where player.challenge_id = room.rematch_of
          and player.user_id = new.user_id and player.invite_status = 'accepted'
      ) then
        raise exception 'Only original players can enter a rematch' using errcode = '42501';
      end if;
    elsif new.user_id <> room.challenger_id
      and not (select private.bsb_users_are_friends(new.user_id))
    then
      raise exception 'Only accepted friends can be invited'
        using errcode = '42501';
    end if;

    select count(*)
    into active_player_count
    from public.bsb_game_challenge_players as player
    where player.challenge_id = new.challenge_id
      and player.invite_status in ('invited', 'accepted');

    if active_player_count >= room.max_players then
      raise exception 'That game room is full'
        using errcode = '23514';
    end if;

    new.is_host = new.user_id = room.challenger_id;
    new.invite_status = case when new.is_host then 'accepted' else 'invited' end;
    new.responded_at = case when new.is_host then now() else null end;
    new.ready = false;
    new.score = 0;
    new.progress = 0;
    new.completed_at = null;
    new.elapsed_ms = null;
    return new;
  end if;

  if old.challenge_id <> new.challenge_id
    or old.user_id <> new.user_id
    or old.is_host <> new.is_host
  then
    raise exception 'Room player identity cannot be changed'
      using errcode = '23514';
  end if;
  if (select auth.uid()) is null or (select auth.uid()) <> new.user_id then
    raise exception 'Players can only update their own room state'
      using errcode = '42501';
  end if;

  if room.status in ('pending', 'accepted')
    and old.invite_status = 'accepted'
    and new.invite_status = 'left'
    and (room.status = 'accepted' or not old.is_host)
  then
    -- A departure changes membership only. Keep submitted results immutable.
    new := old;
    new.invite_status := 'left';
    new.responded_at := now();
    new.ready := old.completed_at is not null;
    return new;
  end if;

  if old.invite_status <> new.invite_status then
    if room.status <> 'pending' or room.expires_at <= now() then
      raise exception 'Room membership is locked after the game starts'
        using errcode = '23514';
    end if;
    if not (
      old.invite_status = 'invited' and new.invite_status in ('accepted', 'declined')
    ) then
      raise exception 'That room invitation transition is not allowed'
        using errcode = '23514';
    end if;
    new.responded_at = now();
    if new.invite_status <> 'accepted' then
      new.ready = false;
    end if;
  end if;

  if new.ready and new.invite_status <> 'accepted' then
    raise exception 'Only accepted room players can be ready'
      using errcode = '23514';
  end if;

  if room.status = 'pending' then
    if new.score <> old.score
      or new.progress <> old.progress
      or new.completed_at is distinct from old.completed_at
      or new.puzzle_state is distinct from old.puzzle_state
      or new.elapsed_ms is distinct from old.elapsed_ms
    then
      raise exception 'Scores cannot change before the room starts'
        using errcode = '23514';
    end if;
  elsif room.status = 'accepted' then
    if new.invite_status <> 'accepted' then
      raise exception 'Room membership is locked after the game starts'
        using errcode = '23514';
    end if;
  else
    raise exception 'That game room is no longer active'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.rematch_bsb_game_room(source_room_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := (select auth.uid());
  source_room public.bsb_game_challenges%rowtype;
  existing_room public.bsb_game_challenges%rowtype;
  rematch_id uuid;
  opponent_ids uuid[];
begin
  if caller_id is null or not private.bsb_user_is_game_room_member(source_room_id) then
    raise exception 'This challenge is unavailable' using errcode = '42501';
  end if;

  -- Serialize requests from players on the same results screen.
  select * into source_room from public.bsb_game_challenges
  where id = source_room_id and status = 'completed' for update;
  if not found then
    raise exception 'Everyone must finish before starting a rematch' using errcode = '23514';
  end if;

  select * into existing_room from public.bsb_game_challenges where rematch_of = source_room_id for update;
  if found then
    if existing_room.status = 'cancelled'
      or (existing_room.status = 'pending' and existing_room.expires_at <= now()) then
      update public.bsb_game_challenges set rematch_of = null where id = existing_room.id;
    else
      if not private.bsb_user_is_game_room_member(existing_room.id) then
        raise exception 'This rematch is unavailable' using errcode = '42501';
      end if;
      return existing_room.id;
    end if;
  end if;

  select array_agg(user_id order by user_id) into opponent_ids
  from public.bsb_game_challenge_players
  where challenge_id = source_room_id and invite_status = 'accepted' and user_id <> caller_id;
  if coalesce(cardinality(opponent_ids), 0) = 0 then
    raise exception 'A rematch needs at least two players' using errcode = '23514';
  end if;

  insert into public.bsb_game_challenges (
    challenger_id, challenged_id, game_type, category, difficulty, round_count,
    version, timed, max_players, seed, puzzle, status, rematch_of
  ) values (
    caller_id, opponent_ids[1], source_room.game_type, source_room.category,
    source_room.difficulty, source_room.round_count, source_room.version, source_room.timed,
    cardinality(opponent_ids) + 1, source_room.seed, source_room.puzzle,
    'pending', source_room.id
  ) returning id into rematch_id;

  -- The room insert trigger adds the host and first opponent.
  insert into public.bsb_game_challenge_players (challenge_id, user_id)
  select rematch_id, opponent_id from unnest(opponent_ids[2:]) as opponent_id;

  return rematch_id;
end;
$$;

create or replace function public.start_bsb_game_room(room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  room public.bsb_game_challenges%rowtype;
  accepted_count integer;
  unready_count integer;
  invited_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before starting a game room'
      using errcode = '42501';
  end if;

  -- Lock the host membership before the room, matching ready updates.
  perform 1 from public.bsb_game_challenge_players
  where challenge_id = room_id and user_id = (select auth.uid()) and is_host
  for update;

  select *
  into room
  from public.bsb_game_challenges as challenge
  where challenge.id = room_id
  for update;

  if not found then
    raise exception 'That game room does not exist'
      using errcode = 'P0002';
  end if;
  if room.challenger_id <> (select auth.uid()) then
    raise exception 'Only the room host can start the game'
      using errcode = '42501';
  end if;
  if room.status <> 'pending' or room.expires_at <= now() then
    raise exception 'That game room is no longer open'
      using errcode = '23514';
  end if;

  select
    count(*) filter (where player.invite_status = 'accepted'),
    count(*) filter (
      where player.invite_status = 'accepted'
        and not player.is_host
        and not player.ready
    ),
    count(*) filter (where player.invite_status = 'invited')
  into accepted_count, unready_count, invited_count
  from public.bsb_game_challenge_players as player
  where player.challenge_id = room_id;

  if room.rematch_of is not null and invited_count > 0 then
    raise exception 'Wait for everyone to respond to the rematch'
      using errcode = '23514';
  end if;
  if accepted_count < 2 then
    raise exception 'At least two players must join before the game starts'
      using errcode = '23514';
  end if;
  if accepted_count > room.max_players then
    raise exception 'That game room has too many players'
      using errcode = '23514';
  end if;
  if unready_count > 0 then
    raise exception 'Every joined player must be ready'
      using errcode = '23514';
  end if;

  update public.bsb_game_challenge_players set ready = true
  where challenge_id = room_id and user_id = (select auth.uid()) and not ready;

  update public.bsb_game_challenges as challenge
  set
    status = 'accepted',
    responded_at = now(),
    started_at = now()
  where challenge.id = room_id;

  return room_id;
end;
$$;
