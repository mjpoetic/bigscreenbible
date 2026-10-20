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
