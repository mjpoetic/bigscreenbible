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
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bsb_user_sync_set_updated_at on public.bsb_user_sync;
create trigger bsb_user_sync_set_updated_at
  before update on public.bsb_user_sync
  for each row
  execute function public.set_bsb_user_sync_updated_at();

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
