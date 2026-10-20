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
