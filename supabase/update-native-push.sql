-- Add native APNs delivery without changing existing web-push subscriptions.
begin;
alter table public.bsb_push_subscriptions
  add column if not exists transport text not null default 'web',
  add column if not exists apns_token text,
  add column if not exists apns_environment text,
  alter column p256dh drop not null,
  alter column auth drop not null;
alter table public.bsb_push_subscriptions
  drop constraint if exists bsb_push_transport_check;
alter table public.bsb_push_subscriptions
  add constraint bsb_push_transport_check check (
    (transport = 'web' and p256dh is not null and auth is not null
      and apns_token is null and apns_environment is null)
    or
    (transport = 'apns' and p256dh is null and auth is null
      and apns_token is not null and apns_token ~ '^[a-f0-9]+$' and char_length(apns_token) between 32 and 512 and char_length(apns_token) % 2 = 0
      and apns_environment is not null and apns_environment in ('development', 'production')
      and endpoint = 'apns:' || apns_environment || ':' || apns_token)
  );
commit;
