create or replace function private.bsb_users_are_friends(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and other_user_id <> (select auth.uid())
    and exists (
      select 1
      from public.bsb_friendships as friendship
      where friendship.status = 'accepted'
        and (
          (
            friendship.requester_id = (select auth.uid())
            and friendship.addressee_id = other_user_id
          )
          or (
            friendship.addressee_id = (select auth.uid())
            and friendship.requester_id = other_user_id
          )
        )
    );
$$;

revoke all on function private.bsb_users_are_friends(uuid) from public, anon;
grant execute on function private.bsb_users_are_friends(uuid) to authenticated;

create table if not exists public.bsb_game_challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references auth.users(id) on delete cascade,
  challenged_id uuid not null references auth.users(id) on delete cascade,
  game_type text not null
    check (game_type in ('trivia', 'verse-order', 'reference-rush', 'book-sprint', 'who-said-it')),
  category text not null default 'Mixed'
    check (char_length(category) between 1 and 60),
  difficulty text not null default 'All'
    check (difficulty in ('All', 'Easy', 'Medium', 'Hard')),
  round_count smallint not null default 10,
  version text not null default 'BSB'
    check (version in ('ASV', 'BBE', 'BSB', 'KJV', 'WEB')),
  timed boolean not null default false,
  seed bigint not null default (floor(random() * 2147483646) + 1)::bigint
    check (seed between 1 and 2147483647),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  responded_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (challenger_id <> challenged_id),
  check (
    (game_type = 'book-sprint' and round_count in (5, 10))
    or (game_type <> 'book-sprint' and round_count in (5, 10, 15, 20))
  ),
  check (expires_at > created_at),
  check (
    (status = 'pending' and responded_at is null and started_at is null and completed_at is null)
    or (
      status in ('accepted', 'declined', 'cancelled')
      and responded_at is not null
      and completed_at is null
    )
    or (
      status = 'completed'
      and responded_at is not null
      and started_at is not null
      and completed_at is not null
    )
  )
);

comment on table public.bsb_game_challenges is
  'Friend-to-friend game invitations and shared live challenge configuration.';

alter table public.bsb_game_challenges enable row level security;

revoke all on table public.bsb_game_challenges from anon, authenticated;
grant select on table public.bsb_game_challenges to authenticated;
grant insert (
  challenger_id,
  challenged_id,
  game_type,
  category,
  difficulty,
  round_count,
  version,
  timed
) on table public.bsb_game_challenges to authenticated;
grant update (status, responded_at) on table public.bsb_game_challenges to authenticated;
grant select, insert, update, delete on table public.bsb_game_challenges to service_role;

create unique index if not exists bsb_game_challenges_active_pair_idx
  on public.bsb_game_challenges (
    least(challenger_id, challenged_id),
    greatest(challenger_id, challenged_id)
  )
  where status in ('pending', 'accepted');

create index if not exists bsb_game_challenges_challenger_idx
  on public.bsb_game_challenges (challenger_id, created_at desc);

create index if not exists bsb_game_challenges_challenged_idx
  on public.bsb_game_challenges (challenged_id, created_at desc);

create index if not exists bsb_game_challenges_incoming_pending_idx
  on public.bsb_game_challenges (challenged_id, created_at desc)
  where status = 'pending';

create index if not exists bsb_game_challenges_live_idx
  on public.bsb_game_challenges (updated_at desc)
  where status in ('accepted', 'completed');

drop policy if exists "Participants can read game challenges" on public.bsb_game_challenges;
create policy "Participants can read game challenges"
  on public.bsb_game_challenges
  for select
  to authenticated
  using (
    (select auth.uid()) = challenger_id
    or (select auth.uid()) = challenged_id
  );

drop policy if exists "Friends can create game challenges" on public.bsb_game_challenges;
create policy "Friends can create game challenges"
  on public.bsb_game_challenges
  for insert
  to authenticated
  with check (
    (select auth.uid()) = challenger_id
    and challenger_id <> challenged_id
    and status = 'pending'
    and responded_at is null
    and started_at is null
    and completed_at is null
    and expires_at > now()
    and (select private.bsb_users_are_friends(challenged_id))
  );

drop policy if exists "Recipients can answer game challenges" on public.bsb_game_challenges;
create policy "Recipients can answer game challenges"
  on public.bsb_game_challenges
  for update
  to authenticated
  using (
    (select auth.uid()) = challenged_id
    and status = 'pending'
  )
  with check (
    (select auth.uid()) = challenged_id
    and responded_at is not null
    and started_at is null
    and completed_at is null
    and (
      (status = 'accepted' and expires_at > now())
      or status = 'declined'
    )
  );

drop policy if exists "Challengers can cancel pending game challenges" on public.bsb_game_challenges;
create policy "Challengers can cancel pending game challenges"
  on public.bsb_game_challenges
  for update
  to authenticated
  using (
    (select auth.uid()) = challenger_id
    and status = 'pending'
  )
  with check (
    (select auth.uid()) = challenger_id
    and status = 'cancelled'
    and responded_at is not null
    and started_at is null
    and completed_at is null
  );

create table if not exists public.bsb_game_challenge_players (
  challenge_id uuid not null references public.bsb_game_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0 check (score >= 0),
  progress smallint not null default 0 check (progress >= 0),
  ready boolean not null default false,
  completed_at timestamptz,
  elapsed_ms integer check (elapsed_ms is null or elapsed_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (challenge_id, user_id),
  check (completed_at is null or ready)
);

comment on table public.bsb_game_challenge_players is
  'Per-player ready state, score, progress, and completion for a live game challenge.';

alter table public.bsb_game_challenge_players enable row level security;

revoke all on table public.bsb_game_challenge_players from anon, authenticated;
grant select on table public.bsb_game_challenge_players to authenticated;
grant update (
  score,
  progress,
  ready,
  completed_at,
  elapsed_ms
) on table public.bsb_game_challenge_players to authenticated;
grant select, insert, update, delete on table public.bsb_game_challenge_players to service_role;

create index if not exists bsb_game_challenge_players_user_idx
  on public.bsb_game_challenge_players (user_id, updated_at desc);

drop policy if exists "Participants can read challenge players" on public.bsb_game_challenge_players;
create policy "Participants can read challenge players"
  on public.bsb_game_challenge_players
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bsb_game_challenges as challenge
      where challenge.id = challenge_id
        and (
          challenge.challenger_id = (select auth.uid())
          or challenge.challenged_id = (select auth.uid())
        )
    )
  );

drop policy if exists "Players can update own live challenge state" on public.bsb_game_challenge_players;
create policy "Players can update own live challenge state"
  on public.bsb_game_challenge_players
  for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.bsb_game_challenges as challenge
      where challenge.id = challenge_id
        and challenge.status = 'accepted'
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.bsb_game_challenges as challenge
      where challenge.id = challenge_id
        and challenge.status = 'accepted'
    )
  );

create or replace function private.create_bsb_game_challenge_players()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or (select auth.uid()) <> new.challenger_id then
    raise exception 'A challenge can only create rows for its authenticated challenger'
      using errcode = '42501';
  end if;

  insert into public.bsb_game_challenge_players (challenge_id, user_id)
  values
    (new.id, new.challenger_id),
    (new.id, new.challenged_id);

  return new;
end;
$$;

revoke execute on function private.create_bsb_game_challenge_players() from public, anon, authenticated;

drop trigger if exists bsb_game_challenge_create_players on public.bsb_game_challenges;
create trigger bsb_game_challenge_create_players
  after insert on public.bsb_game_challenges
  for each row
  execute function private.create_bsb_game_challenge_players();

create or replace function public.set_bsb_game_challenge_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_bsb_game_challenge_updated_at() from public, anon, authenticated;

drop trigger if exists bsb_game_challenge_set_updated_at on public.bsb_game_challenges;
create trigger bsb_game_challenge_set_updated_at
  before update on public.bsb_game_challenges
  for each row
  execute function public.set_bsb_game_challenge_updated_at();

drop trigger if exists bsb_game_challenge_player_set_updated_at on public.bsb_game_challenge_players;
create trigger bsb_game_challenge_player_set_updated_at
  before update on public.bsb_game_challenge_players
  for each row
  execute function public.set_bsb_game_challenge_updated_at();

create or replace function private.sync_bsb_game_challenge_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or (select auth.uid()) <> new.user_id then
    raise exception 'Players can only update their own challenge state'
      using errcode = '42501';
  end if;

  perform 1
  from public.bsb_game_challenges as challenge
  where challenge.id = new.challenge_id
  for update;

  if new.ready and not old.ready then
    update public.bsb_game_challenges as challenge
    set started_at = now()
    where challenge.id = new.challenge_id
      and challenge.status = 'accepted'
      and challenge.started_at is null
      and not exists (
        select 1
        from public.bsb_game_challenge_players as player
        where player.challenge_id = new.challenge_id
          and not player.ready
      );
  end if;

  if new.completed_at is not null and old.completed_at is null then
    update public.bsb_game_challenges as challenge
    set
      status = 'completed',
      completed_at = now()
    where challenge.id = new.challenge_id
      and challenge.status = 'accepted'
      and challenge.started_at is not null
      and not exists (
        select 1
        from public.bsb_game_challenge_players as player
        where player.challenge_id = new.challenge_id
          and player.completed_at is null
      );
  end if;

  return new;
end;
$$;

revoke execute on function private.sync_bsb_game_challenge_state() from public, anon, authenticated;

drop trigger if exists bsb_game_challenge_sync_state on public.bsb_game_challenge_players;
create trigger bsb_game_challenge_sync_state
  after update on public.bsb_game_challenge_players
  for each row
  execute function private.sync_bsb_game_challenge_state();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bsb_game_challenges'
  ) then
    alter publication supabase_realtime add table public.bsb_game_challenges;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bsb_game_challenge_players'
  ) then
    alter publication supabase_realtime add table public.bsb_game_challenge_players;
  end if;
end;
$$;
