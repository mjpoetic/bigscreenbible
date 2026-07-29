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
  avatar_key text not null default 'initials',
  constraint bsb_profiles_avatar_key_check
    check (avatar_key in (
      'initials',
      'book',
      'sun',
      'flame',
      'bookmark',
      'quote',
      'cross',
      'heart',
      'star',
      'dove',
      'fish',
      'mountain',
      'leaf',
      'crown',
      'compass',
      'moon'
    )),
  is_discoverable boolean not null default true,
  allow_friend_requests boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bsb_profiles
  drop constraint if exists bsb_profiles_avatar_key_check;
alter table public.bsb_profiles
  add constraint bsb_profiles_avatar_key_check
  check (avatar_key in (
    'initials',
    'book',
    'sun',
    'flame',
    'bookmark',
    'quote',
    'cross',
    'heart',
    'star',
    'dove',
    'fish',
    'mountain',
    'leaf',
    'crown',
    'compass',
    'moon'
  ));

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
  max_players smallint not null default 2
    check (max_players between 2 and 10),
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
  'Friend game rooms with shared live challenge configuration for two to ten players.';

alter table public.bsb_game_challenges
  add column if not exists max_players smallint not null default 2;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bsb_game_challenges_max_players_check'
      and conrelid = 'public.bsb_game_challenges'::regclass
  ) then
    alter table public.bsb_game_challenges
      add constraint bsb_game_challenges_max_players_check
      check (max_players between 2 and 10);
  end if;
end
$$;

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
  timed,
  max_players
) on table public.bsb_game_challenges to authenticated;
grant update (status, responded_at) on table public.bsb_game_challenges to authenticated;
grant select, insert, update, delete on table public.bsb_game_challenges to service_role;

drop index if exists public.bsb_game_challenges_active_pair_idx;

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
  is_host boolean not null default false,
  invite_status text not null default 'invited'
    check (invite_status in ('invited', 'accepted', 'declined', 'left')),
  responded_at timestamptz,
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
  'Per-player room membership, invitation, ready state, score, progress, and completion.';

alter table public.bsb_game_challenge_players
  add column if not exists is_host boolean not null default false,
  add column if not exists invite_status text not null default 'invited',
  add column if not exists responded_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bsb_game_challenge_players_invite_status_check'
      and conrelid = 'public.bsb_game_challenge_players'::regclass
  ) then
    alter table public.bsb_game_challenge_players
      add constraint bsb_game_challenge_players_invite_status_check
      check (invite_status in ('invited', 'accepted', 'declined', 'left'));
  end if;
end
$$;

update public.bsb_game_challenge_players as player
set
  is_host = player.user_id = challenge.challenger_id,
  invite_status = case
    when player.user_id = challenge.challenger_id then 'accepted'
    when challenge.status = 'pending' then 'invited'
    when challenge.status = 'declined' then 'declined'
    else 'accepted'
  end,
  responded_at = case
    when player.user_id = challenge.challenger_id then coalesce(player.responded_at, challenge.created_at)
    when challenge.status <> 'pending' then coalesce(player.responded_at, challenge.responded_at)
    else player.responded_at
  end
from public.bsb_game_challenges as challenge
where challenge.id = player.challenge_id
  and (
    player.is_host is distinct from (player.user_id = challenge.challenger_id)
    or (
      player.user_id = challenge.challenger_id
      and player.invite_status <> 'accepted'
    )
    or (
      player.user_id <> challenge.challenger_id
      and challenge.status = 'pending'
      and player.invite_status = 'accepted'
      and player.responded_at is null
    )
    or (
      player.user_id <> challenge.challenger_id
      and challenge.status <> 'pending'
      and player.invite_status = 'invited'
    )
  );

alter table public.bsb_game_challenge_players enable row level security;

revoke all on table public.bsb_game_challenge_players from anon, authenticated;
grant select on table public.bsb_game_challenge_players to authenticated;
grant insert (challenge_id, user_id) on table public.bsb_game_challenge_players to authenticated;
grant update (
  invite_status,
  responded_at,
  score,
  progress,
  ready,
  completed_at,
  elapsed_ms
) on table public.bsb_game_challenge_players to authenticated;
grant select, insert, update, delete on table public.bsb_game_challenge_players to service_role;

create index if not exists bsb_game_challenge_players_user_idx
  on public.bsb_game_challenge_players (user_id, updated_at desc);

create or replace function private.bsb_user_is_game_room_member(room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.bsb_game_challenge_players as player
      join public.bsb_game_challenges as room
        on room.id = player.challenge_id
      where player.challenge_id = room_id
        and player.user_id = (select auth.uid())
        and (
          player.invite_status = 'accepted'
          or (
            player.invite_status = 'invited'
            and room.status = 'pending'
            and room.expires_at > now()
          )
        )
    );
$$;

revoke all on function private.bsb_user_is_game_room_member(uuid) from public, anon;
grant execute on function private.bsb_user_is_game_room_member(uuid) to authenticated;

create or replace function private.bsb_users_share_game_room(other_user_id uuid)
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
      from public.bsb_game_challenge_players as self_player
      join public.bsb_game_challenges as room
        on room.id = self_player.challenge_id
      join public.bsb_game_challenge_players as other_player
        on other_player.challenge_id = self_player.challenge_id
      where self_player.user_id = (select auth.uid())
        and (
          self_player.invite_status = 'accepted'
          or (
            self_player.invite_status = 'invited'
            and room.status = 'pending'
            and room.expires_at > now()
          )
        )
        and other_player.user_id = other_user_id
        and (
          other_player.invite_status = 'accepted'
          or (
            other_player.invite_status = 'invited'
            and room.status = 'pending'
            and room.expires_at > now()
          )
        )
    );
$$;

revoke all on function private.bsb_users_share_game_room(uuid) from public, anon;
grant execute on function private.bsb_users_share_game_room(uuid) to authenticated;

drop policy if exists "Participants can read game challenges" on public.bsb_game_challenges;
create policy "Room members can read game challenges"
  on public.bsb_game_challenges
  for select
  to authenticated
  using ((select private.bsb_user_is_game_room_member(id)));

drop policy if exists "Participants can answer or cancel game challenges" on public.bsb_game_challenges;
create policy "Hosts can cancel game rooms"
  on public.bsb_game_challenges
  for update
  to authenticated
  using (
    (select auth.uid()) = challenger_id
    and status in ('pending', 'accepted')
  )
  with check (
    (select auth.uid()) = challenger_id
    and status = 'cancelled'
    and responded_at is not null
    and completed_at is null
  );

drop policy if exists "Participants can read challenge players" on public.bsb_game_challenge_players;
create policy "Room members can read challenge players"
  on public.bsb_game_challenge_players
  for select
  to authenticated
  using ((select private.bsb_user_is_game_room_member(challenge_id)));

drop policy if exists "Hosts can invite room players" on public.bsb_game_challenge_players;
create policy "Hosts can invite room players"
  on public.bsb_game_challenge_players
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.bsb_game_challenges as room
      where room.id = challenge_id
        and room.challenger_id = (select auth.uid())
        and room.status = 'pending'
        and room.expires_at > now()
    )
    and (
      user_id = (select auth.uid())
      or (select private.bsb_users_are_friends(user_id))
    )
  );

drop policy if exists "Players can update own live challenge state" on public.bsb_game_challenge_players;
create policy "Players can update own room state"
  on public.bsb_game_challenge_players
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

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
    or (select private.bsb_users_share_game_room(bsb_profiles.user_id))
  );

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

revoke execute on function private.validate_bsb_game_room_player_change() from public, anon, authenticated;

drop trigger if exists bsb_game_room_validate_player on public.bsb_game_challenge_players;
create trigger bsb_game_room_validate_player
  before insert or update on public.bsb_game_challenge_players
  for each row
  execute function private.validate_bsb_game_room_player_change();

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

  insert into public.bsb_game_challenge_players (
    challenge_id,
    user_id,
    is_host,
    invite_status,
    responded_at
  )
  values
    (new.id, new.challenger_id, true, 'accepted', now()),
    (new.id, new.challenged_id, false, 'invited', null);

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

  if new.completed_at is null or old.completed_at is not null then
    return new;
  end if;

  perform 1
  from public.bsb_game_challenges as challenge
  where challenge.id = new.challenge_id
  for update;

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
        and player.invite_status = 'accepted'
        and player.completed_at is null
    );

  return new;
end;
$$;

revoke execute on function private.sync_bsb_game_challenge_state() from public, anon, authenticated;

drop trigger if exists bsb_game_challenge_sync_state on public.bsb_game_challenge_players;
create trigger bsb_game_challenge_sync_state
  after update on public.bsb_game_challenge_players
  for each row
  execute function private.sync_bsb_game_challenge_state();

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
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before starting a game room'
      using errcode = '42501';
  end if;

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
        and not player.ready
    )
  into accepted_count, unready_count
  from public.bsb_game_challenge_players as player
  where player.challenge_id = room_id;

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

  update public.bsb_game_challenges as challenge
  set
    status = 'accepted',
    responded_at = now(),
    started_at = now()
  where challenge.id = room_id;

  return room_id;
end;
$$;

revoke all on function public.start_bsb_game_room(uuid) from public, anon, service_role;
grant execute on function public.start_bsb_game_room(uuid) to authenticated;

create or replace function public.create_bsb_game_room(
  invitee_ids uuid[],
  room_game_type text,
  room_category text,
  room_difficulty text,
  room_round_count smallint,
  room_version text,
  room_timed boolean
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

  insert into public.bsb_game_challenges (
    challenger_id,
    challenged_id,
    game_type,
    category,
    difficulty,
    round_count,
    version,
    timed,
    max_players
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
    cardinality(normalized_invitees) + 1
  )
  returning id into room_id;

  insert into public.bsb_game_challenge_players (challenge_id, user_id)
  select room_id, invitee_id
  from unnest(normalized_invitees[2:cardinality(normalized_invitees)]) as invitee_id;

  return room_id;
end;
$$;

revoke all on function public.create_bsb_game_room(uuid[], text, text, text, smallint, text, boolean)
  from public, anon, service_role;
grant execute on function public.create_bsb_game_room(uuid[], text, text, text, smallint, text, boolean)
  to authenticated;

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

create or replace function private.bsb_game_room_id_from_topic(topic text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when topic ~ '^bsb-game-room:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then split_part(topic, ':', 2)::uuid
    else null
  end;
$$;

revoke all on function private.bsb_game_room_id_from_topic(text) from public, anon;
grant execute on function private.bsb_game_room_id_from_topic(text) to authenticated;

drop policy if exists "Room members can receive game room realtime" on realtime.messages;
create policy "Room members can receive game room realtime"
  on realtime.messages
  for select
  to authenticated
  using (
    "private"
    and extension in ('presence', 'broadcast')
    and (
      select private.bsb_user_is_game_room_member(
        private.bsb_game_room_id_from_topic((select realtime.topic()))
      )
    )
  );

drop policy if exists "Room members can send game room realtime" on realtime.messages;
create policy "Room members can send game room realtime"
  on realtime.messages
  for insert
  to authenticated
  with check (
    "private"
    and extension in ('presence', 'broadcast')
    and (
      select private.bsb_user_is_game_room_member(
        private.bsb_game_room_id_from_topic((select realtime.topic()))
      )
    )
  );

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

create index if not exists bsb_push_events_friendship_idx
  on public.bsb_push_events (friendship_id)
  where friendship_id is not null;

create index if not exists bsb_push_events_challenge_idx
  on public.bsb_push_events (challenge_id)
  where challenge_id is not null;

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
declare
  room_host_id uuid;
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
  elsif
    tg_table_name = 'bsb_game_challenge_players'
    and tg_op = 'INSERT'
    and new.invite_status = 'invited'
  then
    select challenge.challenger_id
    into room_host_id
    from public.bsb_game_challenges as challenge
    where challenge.id = new.challenge_id;

    insert into public.bsb_push_events (
      recipient_id,
      actor_id,
      kind,
      challenge_id,
      event_key
    )
    values (
      new.user_id,
      room_host_id,
      'game_challenge',
      new.challenge_id,
      'game_challenge:' || new.challenge_id::text || ':' || new.user_id::text
    )
    on conflict (event_key) do nothing;
  elsif
    tg_table_name = 'bsb_game_challenge_players'
    and tg_op = 'UPDATE'
    and old.invite_status = 'invited'
    and new.invite_status = 'accepted'
  then
    select challenge.challenger_id
    into room_host_id
    from public.bsb_game_challenges as challenge
    where challenge.id = new.challenge_id;

    insert into public.bsb_push_events (
      recipient_id,
      actor_id,
      kind,
      challenge_id,
      event_key
    )
    values (
      room_host_id,
      new.user_id,
      'challenge_accepted',
      new.challenge_id,
      'challenge_accepted:' || new.challenge_id::text || ':' || new.user_id::text
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
drop trigger if exists bsb_game_room_player_enqueue_push on public.bsb_game_challenge_players;
create trigger bsb_game_room_player_enqueue_push
  after insert or update of invite_status on public.bsb_game_challenge_players
  for each row
  execute function private.enqueue_bsb_social_push_event();
