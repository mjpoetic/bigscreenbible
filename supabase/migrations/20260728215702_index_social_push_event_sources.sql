create index if not exists bsb_push_events_friendship_idx
  on public.bsb_push_events (friendship_id)
  where friendship_id is not null;

create index if not exists bsb_push_events_challenge_idx
  on public.bsb_push_events (challenge_id)
  where challenge_id is not null;
