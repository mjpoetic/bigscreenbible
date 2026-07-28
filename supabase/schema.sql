create table if not exists public.bsb_user_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  bookmarks jsonb not null default '[]'::jsonb,
  notes jsonb not null default '{}'::jsonb,
  highlights jsonb not null default '{}'::jsonb,
  history jsonb not null default '[]'::jsonb,
  streak jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.bsb_user_sync enable row level security;

drop policy if exists "Users can read own sync data" on public.bsb_user_sync;
create policy "Users can read own sync data"
  on public.bsb_user_sync
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own sync data" on public.bsb_user_sync;
create policy "Users can insert own sync data"
  on public.bsb_user_sync
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own sync data" on public.bsb_user_sync;
create policy "Users can update own sync data"
  on public.bsb_user_sync
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own sync data" on public.bsb_user_sync;
create policy "Users can delete own sync data"
  on public.bsb_user_sync
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_bsb_user_sync_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_bsb_user_sync_updated_at() from public, anon, authenticated;

drop trigger if exists bsb_user_sync_set_updated_at on public.bsb_user_sync;
create trigger bsb_user_sync_set_updated_at
  before update on public.bsb_user_sync
  for each row
  execute function public.set_bsb_user_sync_updated_at();

create table if not exists public.bsb_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z][a-z0-9_]{2,19}$')
    check (username not in (
      'admin',
      'administrator',
      'bigscreenbible',
      'big_screen_bible',
      'moderator',
      'staff',
      'support',
      'system'
    )),
  display_name text
    check (
      display_name is null
      or (
        display_name = btrim(display_name)
        and char_length(display_name) between 1 and 40
      )
    ),
  avatar_key text not null default 'initials'
    check (avatar_key in ('initials', 'book', 'sun', 'flame', 'bookmark', 'quote')),
  is_discoverable boolean not null default true,
  allow_friend_requests boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.bsb_profiles is
  'Signed-in social identities. Email addresses and private study data are intentionally excluded.';

alter table public.bsb_profiles enable row level security;

revoke all on table public.bsb_profiles from anon, authenticated;
grant select, insert, update on table public.bsb_profiles to authenticated;
grant select, insert, update, delete on table public.bsb_profiles to service_role;

drop policy if exists "Users can read own profile" on public.bsb_profiles;
drop policy if exists "Signed-in users can read discoverable profiles" on public.bsb_profiles;
drop policy if exists "Users can read permitted profiles" on public.bsb_profiles;
create policy "Users can read permitted profiles"
  on public.bsb_profiles
  for select
  to authenticated
  using (((select auth.uid()) = user_id) or is_discoverable);

drop policy if exists "Users can create own profile" on public.bsb_profiles;
create policy "Users can create own profile"
  on public.bsb_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own profile" on public.bsb_profiles;
create policy "Users can update own profile"
  on public.bsb_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.set_bsb_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_bsb_profile_updated_at() from public, anon, authenticated;

drop trigger if exists bsb_profile_set_updated_at on public.bsb_profiles;
create trigger bsb_profile_set_updated_at
  before update on public.bsb_profiles
  for each row
  execute function public.set_bsb_profile_updated_at();

create index if not exists bsb_profiles_discoverable_username_pattern_idx
  on public.bsb_profiles (username text_pattern_ops)
  where is_discoverable;

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.bsb_profile_accepts_friend_requests(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and target_user_id <> (select auth.uid())
    and exists (
      select 1
      from public.bsb_profiles as target_profile
      where target_profile.user_id = target_user_id
        and target_profile.is_discoverable
        and target_profile.allow_friend_requests
    );
$$;

revoke all on function private.bsb_profile_accepts_friend_requests(uuid) from public, anon;
grant execute on function private.bsb_profile_accepts_friend_requests(uuid) to authenticated;

create table if not exists public.bsb_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  check (
    (status = 'pending' and responded_at is null)
    or (status = 'accepted' and responded_at is not null)
  )
);

comment on table public.bsb_friendships is
  'Pending friend requests and accepted friendships. Only the two participating users can read each row.';

alter table public.bsb_friendships enable row level security;

revoke all on table public.bsb_friendships from anon, authenticated;
grant select, delete on table public.bsb_friendships to authenticated;
grant insert (requester_id, addressee_id) on table public.bsb_friendships to authenticated;
grant update (status, responded_at) on table public.bsb_friendships to authenticated;
grant select, insert, update, delete on table public.bsb_friendships to service_role;

create unique index if not exists bsb_friendships_user_pair_idx
  on public.bsb_friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index if not exists bsb_friendships_requester_id_idx
  on public.bsb_friendships (requester_id);

create index if not exists bsb_friendships_addressee_id_idx
  on public.bsb_friendships (addressee_id);

create index if not exists bsb_friendships_incoming_pending_idx
  on public.bsb_friendships (addressee_id, created_at desc)
  where status = 'pending';

create index if not exists bsb_friendships_requester_accepted_idx
  on public.bsb_friendships (requester_id, updated_at desc)
  where status = 'accepted';

create index if not exists bsb_friendships_addressee_accepted_idx
  on public.bsb_friendships (addressee_id, updated_at desc)
  where status = 'accepted';

drop policy if exists "Participants can read friendships" on public.bsb_friendships;
create policy "Participants can read friendships"
  on public.bsb_friendships
  for select
  to authenticated
  using (
    (select auth.uid()) = requester_id
    or (select auth.uid()) = addressee_id
  );

drop policy if exists "Users can send permitted friend requests" on public.bsb_friendships;
create policy "Users can send permitted friend requests"
  on public.bsb_friendships
  for insert
  to authenticated
  with check (
    (select auth.uid()) = requester_id
    and requester_id <> addressee_id
    and status = 'pending'
    and responded_at is null
    and (select private.bsb_profile_accepts_friend_requests(addressee_id))
  );

drop policy if exists "Recipients can accept pending requests" on public.bsb_friendships;
create policy "Recipients can accept pending requests"
  on public.bsb_friendships
  for update
  to authenticated
  using (
    (select auth.uid()) = addressee_id
    and status = 'pending'
  )
  with check (
    (select auth.uid()) = addressee_id
    and status = 'accepted'
    and responded_at is not null
  );

drop policy if exists "Participants can remove friendships" on public.bsb_friendships;
create policy "Participants can remove friendships"
  on public.bsb_friendships
  for delete
  to authenticated
  using (
    (select auth.uid()) = requester_id
    or (select auth.uid()) = addressee_id
  );

create or replace function public.set_bsb_friendship_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_bsb_friendship_updated_at() from public, anon, authenticated;

drop trigger if exists bsb_friendship_set_updated_at on public.bsb_friendships;
create trigger bsb_friendship_set_updated_at
  before update on public.bsb_friendships
  for each row
  execute function public.set_bsb_friendship_updated_at();

drop policy if exists "Users can read permitted profiles" on public.bsb_profiles;
create policy "Users can read permitted profiles"
  on public.bsb_profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or is_discoverable
    or exists (
      select 1
      from public.bsb_friendships as relationship
      where (
        relationship.requester_id = (select auth.uid())
        and relationship.addressee_id = bsb_profiles.user_id
      ) or (
        relationship.addressee_id = (select auth.uid())
        and relationship.requester_id = bsb_profiles.user_id
      )
    )
  );

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
drop policy if exists "Challengers can cancel pending game challenges" on public.bsb_game_challenges;
drop policy if exists "Participants can answer or cancel game challenges" on public.bsb_game_challenges;
create policy "Participants can answer or cancel game challenges"
  on public.bsb_game_challenges
  for update
  to authenticated
  using (
    status in ('pending', 'accepted')
    and (
      (select auth.uid()) = challenged_id
      or (select auth.uid()) = challenger_id
    )
  )
  with check (
    (
      (select auth.uid()) = challenged_id
      and responded_at is not null
      and started_at is null
      and completed_at is null
      and (
        (status = 'accepted' and expires_at > now())
        or status = 'declined'
      )
    )
    or (
      (
        (select auth.uid()) = challenger_id
        or (select auth.uid()) = challenged_id
      )
      and status = 'cancelled'
      and responded_at is not null
      and completed_at is null
    )
  );

create or replace function private.expire_bsb_game_challenges_for_pair()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or (select auth.uid()) <> new.challenger_id then
    raise exception 'Only an authenticated challenger can expire prior invitations'
      using errcode = '42501';
  end if;

  update public.bsb_game_challenges as challenge
  set
    status = 'cancelled',
    responded_at = now()
  where challenge.status = 'pending'
    and challenge.expires_at <= now()
    and least(challenge.challenger_id, challenge.challenged_id)
      = least(new.challenger_id, new.challenged_id)
    and greatest(challenge.challenger_id, challenge.challenged_id)
      = greatest(new.challenger_id, new.challenged_id);

  return new;
end;
$$;

revoke execute on function private.expire_bsb_game_challenges_for_pair() from public, anon, authenticated;

drop trigger if exists bsb_game_challenge_expire_pair on public.bsb_game_challenges;
create trigger bsb_game_challenge_expire_pair
  before insert on public.bsb_game_challenges
  for each row
  execute function private.expire_bsb_game_challenges_for_pair();

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

create table if not exists public.bsb_verse_of_day_cache (
  cache_date date primary key,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  reference text,
  verse_text text,
  source_url text,
  published_at timestamptz,
  fetched_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.bsb_verse_of_day_cache enable row level security;

create extension if not exists vector with schema extensions;

create table if not exists public.bsb_semantic_passages (
  chunk_key text primary key check (char_length(chunk_key) between 8 and 160),
  translation text not null default 'WEB' check (translation = 'WEB'),
  book text not null check (char_length(book) between 2 and 40),
  chapter integer not null check (chapter between 1 and 150),
  start_verse integer not null check (start_verse between 1 and 176),
  end_verse integer not null check (end_verse between start_verse and 176),
  reference text not null check (char_length(reference) between 5 and 100),
  content text not null check (char_length(content) between 10 and 4000),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  corpus_version text not null check (corpus_version ~ '^[0-9a-f]{64}$'),
  embedding_model text not null default 'gte-small' check (embedding_model = 'gte-small'),
  embedding extensions.vector(384) not null,
  updated_at timestamptz not null default now(),
  unique (translation, book, chapter, start_verse, end_verse)
);

alter table public.bsb_semantic_passages enable row level security;

revoke all on table public.bsb_semantic_passages from anon, authenticated;
grant select, insert, update, delete on table public.bsb_semantic_passages to service_role;

create index if not exists bsb_semantic_passages_reference_idx
  on public.bsb_semantic_passages (book, chapter, start_verse);

create index if not exists bsb_semantic_passages_embedding_idx
  on public.bsb_semantic_passages
  using hnsw (embedding vector_ip_ops);

create or replace function public.match_bsb_semantic_passages(
  query_embedding extensions.vector(384),
  match_threshold double precision default 0.55,
  match_count integer default 12
)
returns table (
  chunk_key text,
  reference text,
  start_ref text,
  content text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    passage.chunk_key,
    passage.reference,
    passage.book || ' ' || passage.chapter || ':' || passage.start_verse as start_ref,
    passage.content,
    -(passage.embedding operator(extensions.<#>) query_embedding) as similarity
  from public.bsb_semantic_passages as passage
  where -(passage.embedding operator(extensions.<#>) query_embedding) >= greatest(match_threshold, 0.0)
  order by passage.embedding operator(extensions.<#>) query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

revoke execute on function public.match_bsb_semantic_passages(
  extensions.vector,
  double precision,
  integer
) from public, anon, authenticated;
grant execute on function public.match_bsb_semantic_passages(
  extensions.vector,
  double precision,
  integer
) to service_role;

create table if not exists public.bsb_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique check (char_length(endpoint) between 20 and 4096),
  p256dh text not null check (char_length(p256dh) between 20 and 512),
  auth text not null check (char_length(auth) between 8 and 256),
  device_token_hash text not null unique check (char_length(device_token_hash) = 64),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  morning_time time not null default '07:00',
  evening_enabled boolean not null default true,
  evening_time time not null default '18:00',
  enabled boolean not null default true,
  last_opened_at timestamptz not null default now(),
  last_morning_sent_on date,
  last_evening_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bsb_push_subscriptions enable row level security;

revoke all on table public.bsb_push_subscriptions from anon, authenticated;

create index if not exists bsb_push_subscriptions_enabled_idx
  on public.bsb_push_subscriptions (enabled, updated_at);

create or replace function public.set_bsb_push_subscription_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_bsb_push_subscription_updated_at() from public, anon, authenticated;

drop trigger if exists bsb_push_subscription_set_updated_at on public.bsb_push_subscriptions;
create trigger bsb_push_subscription_set_updated_at
  before update on public.bsb_push_subscriptions
  for each row
  execute function public.set_bsb_push_subscription_updated_at();
