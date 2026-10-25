-- Identical generated puzzles and resumable player state for the three puzzle games.
alter table public.bsb_game_challenges
  drop constraint bsb_game_challenges_game_type_check;
alter table public.bsb_game_challenges
  add constraint bsb_game_challenges_game_type_check
  check (game_type in ('trivia', 'verse-order', 'reference-rush', 'book-sprint', 'who-said-it', 'word-search', 'crossword', 'hidden-word'));
alter table public.bsb_game_challenges
  add column puzzle jsonb check (puzzle is null or (jsonb_typeof(puzzle) = 'object' and octet_length(puzzle::text) <= 200000));
alter table public.bsb_game_challenge_players
  add column puzzle_state jsonb check (puzzle_state is null or (jsonb_typeof(puzzle_state) = 'object' and octet_length(puzzle_state::text) <= 200000));
grant update (puzzle_state) on public.bsb_game_challenge_players to authenticated;

create or replace function private.create_bsb_puzzle_room(
  invitee_ids uuid[],
  room_game_type text,
  room_category text,
  room_difficulty text,
  room_round_count smallint,
  room_version text,
  room_timed boolean,
  room_puzzle jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  host_id uuid := (select auth.uid());
  normalized_invitees uuid[];
  room_id uuid;
begin
  if host_id is null then
    raise exception 'Sign in before creating a game room'
      using errcode = '42501';
  end if;

  select array_agg(invitee_id order by invitee_id)
  into normalized_invitees
  from (
    select distinct invitee_id
    from unnest(coalesce(invitee_ids, array[]::uuid[])) as invitee_id
    where invitee_id is not null
      and invitee_id <> host_id
  ) as unique_invitees;

  if coalesce(cardinality(normalized_invitees), 0) < 1 then
    raise exception 'Invite at least one friend'
      using errcode = '23514';
  end if;
  if cardinality(normalized_invitees) > 9 then
    raise exception 'Game rooms support up to ten players'
      using errcode = '23514';
  end if;
  if exists (
    select 1
    from unnest(normalized_invitees) as invitee_id
    where not (select private.bsb_users_are_friends(invitee_id))
  ) then
    raise exception 'Only accepted friends can be invited'
      using errcode = '42501';
  end if;

  if room_game_type not in ('word-search', 'crossword', 'hidden-word')
    or room_puzzle is null or jsonb_typeof(room_puzzle) <> 'object'
    or room_puzzle->>'type' is distinct from room_game_type
    or octet_length(room_puzzle::text) > 200000
  then
    raise exception 'Invalid shared puzzle' using errcode = '23514';
  end if;

  insert into public.bsb_game_challenges (
    challenger_id,
    challenged_id,
    game_type,
    category,
    difficulty,
    round_count,
    version,
    timed,
    max_players,
    puzzle
  )
  values (
    host_id,
    normalized_invitees[1],
    room_game_type,
    room_category,
    room_difficulty,
    room_round_count,
    room_version,
    room_timed,
    cardinality(normalized_invitees) + 1,
    room_puzzle
  )
  returning id into room_id;

  insert into public.bsb_game_challenge_players (challenge_id, user_id)
  select room_id, invitee_id
  from unnest(normalized_invitees[2:cardinality(normalized_invitees)]) as invitee_id;

  return room_id;
end;
$$;

revoke all on function private.create_bsb_puzzle_room(uuid[], text, text, text, smallint, text, boolean, jsonb)
  from public, anon, service_role;
grant execute on function private.create_bsb_puzzle_room(uuid[], text, text, text, smallint, text, boolean, jsonb)
  to authenticated;

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

  if old.invite_status <> new.invite_status then
    if room.status <> 'pending' or room.expires_at <= now() then
      raise exception 'Room membership is locked after the game starts'
        using errcode = '23514';
    end if;
    if not (
      (old.invite_status = 'invited' and new.invite_status in ('accepted', 'declined'))
      or (old.invite_status = 'accepted' and not old.is_host and new.invite_status = 'left')
    ) then
      raise exception 'That room invitation transition is not allowed'
        using errcode = '23514';
    end if;
    new.responded_at = now();
    new.ready = false;
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


create or replace function private.keep_bsb_room_puzzle_immutable()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.puzzle is distinct from old.puzzle then
    raise exception 'Shared puzzles cannot be changed' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.keep_bsb_room_puzzle_immutable() from public, anon, authenticated;
create trigger bsb_room_puzzle_immutable before update on public.bsb_game_challenges
for each row execute function private.keep_bsb_room_puzzle_immutable();

-- Keep privileged room creation outside the exposed API schema.
create or replace function public.create_bsb_puzzle_room(
  invitee_ids uuid[], room_game_type text, room_category text,
  room_difficulty text, room_round_count smallint, room_version text,
  room_timed boolean, room_puzzle jsonb
) returns uuid language sql security invoker set search_path = '' as $$
  select private.create_bsb_puzzle_room(invitee_ids, room_game_type, room_category,
    room_difficulty, room_round_count, room_version, room_timed, room_puzzle);
$$;
revoke all on function public.create_bsb_puzzle_room(uuid[], text, text, text, smallint, text, boolean, jsonb)
  from public, anon, service_role;
grant execute on function public.create_bsb_puzzle_room(uuid[], text, text, text, smallint, text, boolean, jsonb)
  to authenticated;
