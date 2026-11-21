create function private.update_bsb_game_room_roster(room_id uuid, player_id uuid, roster_action text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  host_id uuid := (select auth.uid());
  room public.bsb_game_challenges%rowtype;
  player_status text;
  roster_size integer;
  invitation_key text := 'game_challenge:' || room_id::text || ':' || player_id::text;
begin
  if host_id is null or player_id is null or host_id = player_id or not exists (
    select 1 from public.bsb_game_challenges where id = room_id and challenger_id = host_id
  ) then
    raise exception 'Only the host can change the room roster' using errcode = '42501';
  end if;

  -- Membership updates lock the player before the room.
  select invite_status into player_status from public.bsb_game_challenge_players
  where challenge_id = room_id and user_id = player_id for update;
  select * into room from public.bsb_game_challenges where id = room_id for update;
  if not found or room.status <> 'pending' or room.expires_at <= now() then
    raise exception 'The waiting room is closed' using errcode = '23514';
  end if;
  if not private.bsb_social_room_allowed(room_id) then
    raise exception 'Social access is unavailable for this room' using errcode = '42501';
  end if;

  if roster_action = 'remove' then
    delete from public.bsb_game_challenge_players
    where challenge_id = room_id and user_id = player_id and invite_status in ('accepted', 'invited');
    return;
  end if;

  if roster_action is distinct from 'invite' or not private.bsb_users_are_friends(player_id) then
    raise exception 'Only accepted friends can be invited' using errcode = '42501';
  end if;
  -- Read again after locking the room, in case a concurrent invite inserted the player.
  select invite_status into player_status from public.bsb_game_challenge_players
  where challenge_id = room_id and user_id = player_id;
  if player_status in ('accepted', 'invited') then
    return;
  end if;

  select count(*) into roster_size from public.bsb_game_challenge_players
  where challenge_id = room_id and invite_status in ('accepted', 'invited');
  if roster_size >= 10 then
    raise exception 'That game room is full' using errcode = '23514';
  end if;
  if roster_size >= room.max_players then
    update public.bsb_game_challenges set max_players = roster_size + 1 where id = room_id;
  end if;

  delete from public.bsb_game_challenge_players where challenge_id = room_id and user_id = player_id;
  -- The existing insert trigger enqueues the first invitation. A second invitation
  -- to the same room needs a fresh delivery key.
  if exists (select 1 from public.bsb_push_events where event_key = invitation_key) then
    insert into public.bsb_push_events (recipient_id, actor_id, kind, challenge_id, event_key)
    values (player_id, host_id, 'game_challenge', room_id, invitation_key || ':' || gen_random_uuid()::text);
  end if;
  insert into public.bsb_game_challenge_players (challenge_id, user_id) values (room_id, player_id);
end;
$$;
revoke all on function private.update_bsb_game_room_roster(uuid, uuid, text) from public, anon, service_role;
grant execute on function private.update_bsb_game_room_roster(uuid, uuid, text) to authenticated;

create function public.update_bsb_game_room_roster(room_id uuid, player_id uuid, roster_action text)
returns void language sql security invoker set search_path = '' as $$
  select private.update_bsb_game_room_roster(room_id, player_id, roster_action);
$$;
revoke all on function public.update_bsb_game_room_roster(uuid, uuid, text) from public, anon, service_role;
grant execute on function public.update_bsb_game_room_roster(uuid, uuid, text) to authenticated;
