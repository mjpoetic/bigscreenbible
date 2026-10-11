-- Social consent, reports, blocks, and moderator-only suspension.
create table public.bsb_social_consents (
 user_id uuid primary key references auth.users(id) on delete cascade,
 terms_version text not null check (terms_version = '2026-10-10'),
 accepted_at timestamptz not null default now()
);
create table public.bsb_user_blocks (
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 username_snapshot text not null default '',
 created_at timestamptz not null default now(),
 primary key (blocker_id, blocked_id), check (blocker_id <> blocked_id)
);
create index bsb_user_blocks_reverse_idx on public.bsb_user_blocks(blocked_id, blocker_id);
create table public.bsb_social_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reported_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check (reason in ('harassment','hate','sexual','impersonation','spam','other')),
 details text not null default '' check (char_length(details) <= 1000),
 profile_snapshot jsonb not null default '{}'::jsonb,
 status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 check (reporter_id <> reported_id)
);
create index bsb_social_reports_queue_idx on public.bsb_social_reports(status, created_at);
create index bsb_social_reports_reporter_idx on public.bsb_social_reports(reporter_id, created_at);
create index bsb_social_reports_reported_idx on public.bsb_social_reports(reported_id);
create table private.bsb_social_suspensions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 reason text not null,
 created_at timestamptz not null default now()
);
revoke all on private.bsb_social_suspensions from public, anon, authenticated;
grant all on private.bsb_social_suspensions to service_role;
alter table public.bsb_social_consents enable row level security;
alter table public.bsb_user_blocks enable row level security;
alter table public.bsb_social_reports enable row level security;
revoke all on public.bsb_social_consents, public.bsb_user_blocks, public.bsb_social_reports from public, anon, authenticated;
grant select on public.bsb_social_consents, public.bsb_user_blocks to authenticated;
grant insert(user_id, terms_version) on public.bsb_social_consents to authenticated;
grant insert(blocker_id, blocked_id), delete on public.bsb_user_blocks to authenticated;
grant insert(reporter_id, reported_id, reason, details) on public.bsb_social_reports to authenticated;
grant all on public.bsb_social_consents, public.bsb_user_blocks, public.bsb_social_reports to service_role;
create policy "Read own social consent" on public.bsb_social_consents for select to authenticated using (user_id = (select auth.uid()));
create policy "Accept own social terms" on public.bsb_social_consents for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Read own blocks" on public.bsb_user_blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy "Block for yourself" on public.bsb_user_blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "Unblock for yourself" on public.bsb_user_blocks for delete to authenticated using (blocker_id = (select auth.uid()));
create policy "Report for yourself" on public.bsb_social_reports for insert to authenticated with check (reporter_id = (select auth.uid()));

create function private.bsb_social_active(person_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.bsb_social_consents where user_id=person_id and terms_version='2026-10-10')
 and not exists(select 1 from private.bsb_social_suspensions where user_id=person_id);
$$;
create function private.bsb_social_pair_allowed(first_id uuid, second_id uuid) returns boolean language sql volatile security definer set search_path = '' as $$
 select private.bsb_social_active(first_id) and private.bsb_social_active(second_id)
 and not exists(select 1 from public.bsb_user_blocks where (blocker_id=first_id and blocked_id=second_id) or (blocker_id=second_id and blocked_id=first_id));
$$;
create function private.bsb_social_room_allowed(room_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select private.bsb_social_active((select auth.uid())) and not exists (
 select 1 from public.bsb_game_challenge_players player where player.challenge_id=room_id
 and player.invite_status in ('accepted','invited')
 and not private.bsb_social_pair_allowed((select auth.uid()), player.user_id));
$$;
revoke all on function private.bsb_social_active(uuid), private.bsb_social_pair_allowed(uuid,uuid), private.bsb_social_room_allowed(uuid) from public, anon;
grant execute on function private.bsb_social_active(uuid), private.bsb_social_pair_allowed(uuid,uuid), private.bsb_social_room_allowed(uuid) to authenticated;

create policy "Social safety profile visibility" on public.bsb_profiles as restrictive for select to authenticated
 using (user_id=(select auth.uid()) or private.bsb_social_pair_allowed((select auth.uid()),user_id));
create policy "Social safety requests" on public.bsb_friendships as restrictive for all to authenticated
 using (private.bsb_social_pair_allowed(requester_id,addressee_id)) with check (private.bsb_social_pair_allowed(requester_id,addressee_id));
create policy "Social safety rooms" on public.bsb_game_challenges as restrictive for all to authenticated
 using (private.bsb_social_room_allowed(id)) with check (private.bsb_social_room_allowed(id));
create policy "Social safety players" on public.bsb_game_challenge_players as restrictive for all to authenticated
 using (private.bsb_social_room_allowed(challenge_id)) with check (private.bsb_social_room_allowed(challenge_id));

create function private.bsb_validate_social_profile() returns trigger language plpgsql security definer set search_path = '' as $$
 declare normalized text;
 begin
 if not private.bsb_social_active(new.user_id) then raise exception 'Accept the Community Standards before saving your social profile, or contact support if social access is suspended.' using errcode='42501'; end if;
 normalized := lower(regexp_replace(new.username || ' ' || coalesce(new.display_name,''), '[^a-z ]', '', 'g'));
 if normalized ~ '(fuck|shit|cunt|nigger|faggot|heilhitler|killall)' then raise exception 'Choose a respectful username and display name.' using errcode='23514'; end if;
 return new;
 end;
$$;
create trigger bsb_validate_social_profile before insert or update on public.bsb_profiles for each row execute function private.bsb_validate_social_profile();

create function private.bsb_validate_social_action() returns trigger language plpgsql security definer set search_path = '' as $$
 declare target_profile public.bsb_profiles%rowtype;
 begin
 -- Serialize actions by actor for rate limiting and block/invite races.
 perform pg_advisory_xact_lock(hashtextextended(coalesce(auth.uid()::text,''),0));
 if tg_table_name='bsb_user_blocks' then
 perform pg_advisory_xact_lock(hashtextextended(least(new.blocker_id,new.blocked_id)::text || greatest(new.blocker_id,new.blocked_id)::text,1));
 if new.blocker_id is distinct from auth.uid() then raise exception 'Sign in to block this person' using errcode='42501'; end if;
 select * into target_profile from public.bsb_profiles where user_id=new.blocked_id;
 if not found then raise exception 'Profile unavailable' using errcode='42501'; end if;
 if not (target_profile.is_discoverable or private.bsb_users_are_friends(target_profile.user_id) or private.bsb_users_share_game_room(target_profile.user_id)
 or exists(select 1 from public.bsb_friendships where (requester_id=auth.uid() and addressee_id=target_profile.user_id) or (addressee_id=auth.uid() and requester_id=target_profile.user_id))
 or exists(select 1 from public.bsb_user_blocks where blocker_id=auth.uid() and blocked_id=target_profile.user_id)) then
 raise exception 'Profile unavailable' using errcode='42501'; end if;
 new.username_snapshot := target_profile.username;
 new.created_at := now();
 else
 if new.reporter_id is distinct from auth.uid() then raise exception 'Sign in to report this person' using errcode='42501'; end if;
 select * into target_profile from public.bsb_profiles where user_id=new.reported_id;
 if not found then raise exception 'Profile unavailable' using errcode='42501'; end if;
 if not (target_profile.is_discoverable or private.bsb_users_are_friends(target_profile.user_id) or private.bsb_users_share_game_room(target_profile.user_id)
 or exists(select 1 from public.bsb_friendships where (requester_id=auth.uid() and addressee_id=target_profile.user_id) or (addressee_id=auth.uid() and requester_id=target_profile.user_id))
 or exists(select 1 from public.bsb_user_blocks where blocker_id=auth.uid() and blocked_id=target_profile.user_id)) then
 raise exception 'Profile unavailable' using errcode='42501'; end if;
 if (select count(*) from public.bsb_social_reports where reporter_id=new.reporter_id and created_at>now()-interval '1 day') >= 10 then
 raise exception 'Daily report limit reached. Contact support@bigscreenbible.com for urgent help.' using errcode='23514'; end if;
 if exists(select 1 from public.bsb_social_reports where reporter_id=new.reporter_id and reported_id=new.reported_id and created_at>now()-interval '1 hour') then
 raise exception 'You already reported this person recently. Contact support if there is new urgent information.' using errcode='23514'; end if;
 new.profile_snapshot := jsonb_build_object('username',target_profile.username,'display_name',target_profile.display_name,'avatar_key',target_profile.avatar_key);
 new.status := 'open'; new.created_at := now(); new.reviewed_at := null;
 end if;
 return new;
 end;
$$;
create trigger bsb_validate_block before insert on public.bsb_user_blocks for each row execute function private.bsb_validate_social_action();
create trigger bsb_validate_report before insert on public.bsb_social_reports for each row execute function private.bsb_validate_social_action();

create function private.bsb_enforce_block() returns trigger language plpgsql security definer set search_path = '' as $$
 begin
 delete from public.bsb_friendships where (requester_id=new.blocker_id and addressee_id=new.blocked_id) or (requester_id=new.blocked_id and addressee_id=new.blocker_id);
 -- Cancel shared rooms to end both direct and group contact immediately.
 update public.bsb_game_challenges room set status='cancelled', responded_at=coalesce(responded_at,now()) where room.status in ('pending','accepted')
 and exists(select 1 from public.bsb_game_challenge_players where challenge_id=room.id and user_id=new.blocker_id)
 and exists(select 1 from public.bsb_game_challenge_players where challenge_id=room.id and user_id=new.blocked_id);
 delete from public.bsb_push_events where (actor_id=new.blocker_id and recipient_id=new.blocked_id) or (actor_id=new.blocked_id and recipient_id=new.blocker_id);
 return new;
 end;
$$;
create trigger bsb_enforce_block after insert on public.bsb_user_blocks for each row execute function private.bsb_enforce_block();
revoke all on function private.bsb_validate_social_profile(),private.bsb_validate_social_action(),private.bsb_enforce_block() from public, anon, authenticated;

create or replace function private.bsb_profile_accepts_friend_requests(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and private.bsb_social_pair_allowed((select auth.uid()), target_user_id)
    and target_user_id <> (select auth.uid())
    and exists (
      select 1
      from public.bsb_profiles as target_profile
      where target_profile.user_id = target_user_id
        and target_profile.is_discoverable
        and target_profile.allow_friend_requests
    );
$$;

create or replace function private.bsb_users_are_friends(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and private.bsb_social_pair_allowed((select auth.uid()), other_user_id)
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

create or replace function private.bsb_user_is_game_room_member(room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and private.bsb_social_room_allowed(room_id)
    and exists (
      select 1
      from public.bsb_game_challenge_players as player
      join public.bsb_game_challenges as room
        on room.id = player.challenge_id
      where player.challenge_id = room_id
        and player.user_id = (select auth.uid())
        and room.status <> 'cancelled'
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

create or replace function private.bsb_users_share_game_room(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and private.bsb_social_pair_allowed((select auth.uid()), other_user_id)
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

create function private.bsb_validate_social_game() returns trigger language plpgsql security definer set search_path = '' as $$
 declare other_id uuid;
 begin
 if tg_table_name='bsb_game_challenges' then
 if new.status <> 'cancelled' then
 perform pg_advisory_xact_lock(hashtextextended(least(new.challenger_id,new.challenged_id)::text || greatest(new.challenger_id,new.challenged_id)::text,1));
 end if;
 elsif tg_table_name='bsb_game_challenge_players' then
 for other_id in select user_id from public.bsb_game_challenge_players where challenge_id=new.challenge_id and user_id<>new.user_id order by user_id loop
 perform pg_advisory_xact_lock(hashtextextended(least(new.user_id,other_id)::text || greatest(new.user_id,other_id)::text,1));
 end loop;
 end if;
 if tg_table_name='bsb_game_challenges' then
 if new.status <> 'cancelled' and (not private.bsb_social_pair_allowed(new.challenger_id,new.challenged_id) or not private.bsb_social_room_allowed(new.id)) then
 raise exception 'Social access is unavailable for this room.' using errcode='42501'; end if;
 else
 if new.invite_status in ('accepted','invited') and (not private.bsb_social_active(new.user_id) or not private.bsb_social_room_allowed(new.challenge_id)) then
 raise exception 'Social access is unavailable for this player.' using errcode='42501'; end if;
 if exists(select 1 from public.bsb_game_challenge_players other where other.challenge_id=new.challenge_id and other.user_id<>new.user_id and other.invite_status in ('accepted','invited') and not private.bsb_social_pair_allowed(new.user_id,other.user_id)) then
 raise exception 'These players cannot share a room.' using errcode='42501'; end if;
 end if;
 return new;
 end;
$$;
create trigger bsb_validate_social_room before insert or update on public.bsb_game_challenges for each row execute function private.bsb_validate_social_game();
create trigger bsb_validate_social_player before insert or update on public.bsb_game_challenge_players for each row execute function private.bsb_validate_social_game();
revoke all on function private.bsb_validate_social_game() from public, anon, authenticated;

-- Moderator suspension also terminates existing social contact and queued pushes.
create function private.bsb_enforce_social_suspension() returns trigger language plpgsql security definer set search_path = '' as $$
 begin
 update public.bsb_game_challenges room set status='cancelled', responded_at=coalesce(responded_at,now())
 where room.status in ('pending','accepted') and exists(select 1 from public.bsb_game_challenge_players where challenge_id=room.id and user_id=new.user_id);
 delete from public.bsb_push_events where actor_id=new.user_id or recipient_id=new.user_id;
 return new;
 end;
$$;
create trigger bsb_enforce_social_suspension after insert on private.bsb_social_suspensions for each row execute function private.bsb_enforce_social_suspension();
revoke all on function private.bsb_enforce_social_suspension() from public, anon, authenticated;

-- Invoker wrappers expose only purpose-specific safety checks.
create function public.bsb_social_access_allowed() returns boolean language sql stable security invoker set search_path = '' as $$
 select private.bsb_social_active((select auth.uid()));
$$;
revoke all on function public.bsb_social_access_allowed() from public, anon;
grant execute on function public.bsb_social_access_allowed() to authenticated;
grant usage on schema private to service_role;
grant execute on function private.bsb_social_active(uuid), private.bsb_social_pair_allowed(uuid,uuid) to service_role;
create function public.bsb_social_push_allowed(actor_id uuid, recipient_id uuid) returns boolean language sql stable security invoker set search_path = '' as $$
 select private.bsb_social_pair_allowed(actor_id,recipient_id);
$$;
revoke all on function public.bsb_social_push_allowed(uuid,uuid) from public, anon, authenticated;
grant execute on function public.bsb_social_push_allowed(uuid,uuid) to service_role;

create function private.bsb_validate_social_friendship() returns trigger language plpgsql security definer set search_path = '' as $$
 begin
 perform pg_advisory_xact_lock(hashtextextended(least(new.requester_id,new.addressee_id)::text || greatest(new.requester_id,new.addressee_id)::text,1));
 if not private.bsb_social_pair_allowed(new.requester_id,new.addressee_id) then
 raise exception 'This friendship is unavailable. Review your Community Standards acceptance and blocked list.' using errcode='42501'; end if;
 return new;
 end;
$$;
create trigger bsb_validate_social_friendship before insert or update on public.bsb_friendships for each row execute function private.bsb_validate_social_friendship();
revoke all on function private.bsb_validate_social_friendship() from public, anon, authenticated;
