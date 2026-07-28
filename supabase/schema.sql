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
