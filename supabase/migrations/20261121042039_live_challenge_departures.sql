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
    if room.rematch_of is not null then
      if not exists (
        select 1 from public.bsb_game_challenge_players as player
        where player.challenge_id = room.rematch_of
          and player.user_id = new.user_id and player.invite_status = 'accepted'
      ) then
        raise exception 'Only original players can enter a rematch' using errcode = '42501';
      end if;
      new.is_host = new.user_id = room.challenger_id;
      new.invite_status = 'accepted';
      new.responded_at = now();
      new.ready = true;
      return new;
    end if;
    if room.status <> 'pending' or room.expires_at <= now() then
      raise exception 'Players can only be invited to an open room'
        using errcode = '23514';
    end if;
    if new.user_id <> room.challenger_id
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

create or replace function private.sync_bsb_game_challenge_state()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  departed boolean := old.invite_status = 'accepted' and new.invite_status = 'left';
  remaining integer;
  unfinished integer;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> new.user_id then
    raise exception 'Players can only update their own challenge state' using errcode = '42501';
  end if;
  if not departed and (new.completed_at is null or old.completed_at is not null) then
    return new;
  end if;

  perform 1 from public.bsb_game_challenges
  where id = new.challenge_id and status = 'accepted' and started_at is not null for update;
  if not found then return new; end if;

  select count(*), count(*) filter (where completed_at is null)
  into remaining, unfinished
  from public.bsb_game_challenge_players
  where challenge_id = new.challenge_id and invite_status = 'accepted';

  if remaining = 0 then
    update public.bsb_game_challenges set status = 'cancelled', responded_at = now() where id = new.challenge_id;
  elsif unfinished = 0 then
    update public.bsb_game_challenges set status = 'completed', completed_at = now() where id = new.challenge_id;
  elsif departed then
    -- Publish a room change even if the loss of membership hides the player event.
    update public.bsb_game_challenges set updated_at = now() where id = new.challenge_id;
  end if;
  return new;
end;
$$;

create function private.exit_bsb_game_room(room_id uuid, end_for_everyone boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := (select auth.uid());
  room public.bsb_game_challenges%rowtype;
  membership text;
begin
  select invite_status into membership from public.bsb_game_challenge_players
  where challenge_id = room_id and user_id = caller_id for update;
  if not found then
    raise exception 'This challenge is unavailable' using errcode = '42501';
  end if;

  select * into room from public.bsb_game_challenges where id = room_id for update;
  if not found or room.status not in ('pending', 'accepted') or membership = 'left' then return; end if;
  if membership <> 'accepted' or not private.bsb_social_room_allowed(room_id) then
    raise exception 'This challenge is unavailable' using errcode = '42501';
  end if;

  if end_for_everyone or (room.status = 'pending' and room.challenger_id = caller_id) then
    if room.challenger_id <> caller_id and (
      room.status <> 'accepted' or exists (
        select 1 from public.bsb_game_challenge_players
        where challenge_id = room_id and user_id <> caller_id and invite_status = 'accepted'
      )
    ) then
      raise exception 'Only the host or the sole remaining player can end this challenge' using errcode = '42501';
    end if;
    update public.bsb_game_challenges set status = 'cancelled', responded_at = now() where id = room_id;
  else
    update public.bsb_game_challenge_players set invite_status = 'left'
    where challenge_id = room_id and user_id = caller_id;
  end if;
end;
$$;
revoke all on function private.exit_bsb_game_room(uuid, boolean) from public, anon, service_role;
grant execute on function private.exit_bsb_game_room(uuid, boolean) to authenticated;

create function public.exit_bsb_game_room(room_id uuid, end_for_everyone boolean)
returns void language sql security invoker set search_path = '' as $$
  select private.exit_bsb_game_room(room_id, end_for_everyone);
$$;
revoke all on function public.exit_bsb_game_room(uuid, boolean) from public, anon, service_role;
grant execute on function public.exit_bsb_game_room(uuid, boolean) to authenticated;
