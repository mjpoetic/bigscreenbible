-- Fix PostgreSQL repetition limits while preserving FCM token validation.
begin;
alter table public.bsb_push_subscriptions
  drop constraint if exists bsb_push_transport_check;
alter table public.bsb_push_subscriptions
  add constraint bsb_push_transport_check check (
    (transport = 'web' and p256dh is not null and auth is not null
      and apns_token is null and apns_environment is null and fcm_token is null)
    or
    (transport = 'apns' and p256dh is null and auth is null
      and apns_token is not null and apns_token ~ '^[a-f0-9]+$' and char_length(apns_token) between 32 and 512 and char_length(apns_token) % 2 = 0
      and apns_environment is not null and apns_environment in ('development', 'production')
      and fcm_token is null and endpoint = 'apns:' || apns_environment || ':' || apns_token)
    or
    (transport = 'fcm' and p256dh is null and auth is null
      and apns_token is null and apns_environment is null
      and fcm_token is not null and char_length(fcm_token) between 32 and 4092 and fcm_token ~ '^[A-Za-z0-9_:-]+$'
      and endpoint = 'fcm:' || fcm_token)
  );
commit;
