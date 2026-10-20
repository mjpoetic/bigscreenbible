drop policy if exists "Recipients can answer game challenges" on public.bsb_game_challenges;
drop policy if exists "Challengers can cancel pending game challenges" on public.bsb_game_challenges;
drop policy if exists "Participants can answer or cancel game challenges" on public.bsb_game_challenges;
create policy "Participants can answer or cancel game challenges"
  on public.bsb_game_challenges
  for update
  to authenticated
  using (
    status = 'pending'
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
      (select auth.uid()) = challenger_id
      and status = 'cancelled'
      and responded_at is not null
      and started_at is null
      and completed_at is null
    )
  );
