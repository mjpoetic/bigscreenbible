-- Let participants receive the room's final UPDATE through Realtime.
-- The existing restrictive social safety policy still applies.
create function private.bsb_can_read_cancelled_room(room_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bsb_game_challenge_players
    where challenge_id = room_id
      and user_id = (select auth.uid())
      and invite_status in ('accepted', 'invited')
  );
$$;
revoke all on function private.bsb_can_read_cancelled_room(uuid) from public, anon, service_role;
grant execute on function private.bsb_can_read_cancelled_room(uuid) to authenticated;

create policy "Participants can read cancelled game rooms"
  on public.bsb_game_challenges for select to authenticated
  using (status = 'cancelled' and (select private.bsb_can_read_cancelled_room(id)));
