create table if not exists public.bsb_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  endpoint text not null unique check (char_length(endpoint) between 20 and 4096),
  p256dh text not null check (char_length(p256dh) between 20 and 512),
  auth text not null check (char_length(auth) between 8 and 256),
  device_token_hash text not null unique check (char_length(device_token_hash) = 64),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  morning_time time not null default '07:00',
  evening_enabled boolean not null default true,
  evening_time time not null default '18:00',
  friend_request_notifications boolean not null default true,
  game_challenge_notifications boolean not null default true,
  challenge_accepted_notifications boolean not null default true,
  enabled boolean not null default true,
  last_opened_at timestamptz not null default now(),
  last_morning_sent_on date,
  last_evening_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bsb_push_subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists friend_request_notifications boolean not null default true,
  add column if not exists game_challenge_notifications boolean not null default true,
  add column if not exists challenge_accepted_notifications boolean not null default true;

alter table public.bsb_push_subscriptions enable row level security;

revoke all on table public.bsb_push_subscriptions from anon, authenticated;
grant select, insert, update, delete on table public.bsb_push_subscriptions to service_role;

create index if not exists bsb_push_subscriptions_enabled_idx
  on public.bsb_push_subscriptions (enabled, updated_at);

create index if not exists bsb_push_subscriptions_user_enabled_idx
  on public.bsb_push_subscriptions (user_id, updated_at)
  where enabled = true and user_id is not null;

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

create table if not exists public.bsb_push_events (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('friend_request', 'game_challenge', 'challenge_accepted')),
  friendship_id uuid references public.bsb_friendships(id) on delete cascade,
  challenge_id uuid references public.bsb_game_challenges(id) on delete cascade,
  event_key text not null unique check (char_length(event_key) between 20 and 160),
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent')),
  attempts smallint not null default 0 check (attempts between 0 and 20),
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recipient_id <> actor_id),
  check (
    (kind = 'friend_request' and friendship_id is not null and challenge_id is null)
    or (kind in ('game_challenge', 'challenge_accepted') and challenge_id is not null and friendship_id is null)
  )
);

alter table public.bsb_push_events enable row level security;

revoke all on table public.bsb_push_events from anon, authenticated;
grant select, insert, update, delete on table public.bsb_push_events to service_role;

create index if not exists bsb_push_events_delivery_idx
  on public.bsb_push_events (available_at, created_at)
  where status in ('pending', 'processing');

create index if not exists bsb_push_events_recipient_idx
  on public.bsb_push_events (recipient_id, created_at desc);

create index if not exists bsb_push_events_actor_idx
  on public.bsb_push_events (actor_id, created_at desc);

create or replace function public.set_bsb_push_event_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_bsb_push_event_updated_at() from public, anon, authenticated;

drop trigger if exists bsb_push_event_set_updated_at on public.bsb_push_events;
create trigger bsb_push_event_set_updated_at
  before update on public.bsb_push_events
  for each row
  execute function public.set_bsb_push_event_updated_at();

create or replace function private.enqueue_bsb_social_push_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'bsb_friendships' and tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.bsb_push_events (
      recipient_id,
      actor_id,
      kind,
      friendship_id,
      event_key
    )
    values (
      new.addressee_id,
      new.requester_id,
      'friend_request',
      new.id,
      'friend_request:' || new.id::text
    )
    on conflict (event_key) do nothing;
  elsif tg_table_name = 'bsb_game_challenges' and tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.bsb_push_events (
      recipient_id,
      actor_id,
      kind,
      challenge_id,
      event_key
    )
    values (
      new.challenged_id,
      new.challenger_id,
      'game_challenge',
      new.id,
      'game_challenge:' || new.id::text
    )
    on conflict (event_key) do nothing;
  elsif
    tg_table_name = 'bsb_game_challenges'
    and tg_op = 'UPDATE'
    and old.status = 'pending'
    and new.status = 'accepted'
  then
    insert into public.bsb_push_events (
      recipient_id,
      actor_id,
      kind,
      challenge_id,
      event_key
    )
    values (
      new.challenger_id,
      new.challenged_id,
      'challenge_accepted',
      new.id,
      'challenge_accepted:' || new.id::text
    )
    on conflict (event_key) do nothing;
  end if;

  return new;
end;
$$;

revoke execute on function private.enqueue_bsb_social_push_event() from public, anon, authenticated, service_role;

drop trigger if exists bsb_friendship_enqueue_push on public.bsb_friendships;
create trigger bsb_friendship_enqueue_push
  after insert on public.bsb_friendships
  for each row
  execute function private.enqueue_bsb_social_push_event();

drop trigger if exists bsb_game_challenge_enqueue_push on public.bsb_game_challenges;
create trigger bsb_game_challenge_enqueue_push
  after insert or update of status on public.bsb_game_challenges
  for each row
  execute function private.enqueue_bsb_social_push_event();
