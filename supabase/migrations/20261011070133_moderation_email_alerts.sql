-- Private delivery state. Recipient configuration is applied separately by an administrator.
create table private.bsb_moderation_email_settings (
 singleton boolean primary key default true check(singleton),
 recipient text, enabled boolean not null default false,
 last_success timestamptz, last_failure timestamptz, last_error text
);
insert into private.bsb_moderation_email_settings(singleton) values(true);
create table private.bsb_moderation_email_batches (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('new','daily','test')),
 reminder_day date, recipient text not null, report_count integer not null, backlog_count integer not null,
 created_at timestamptz not null default now(), available_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','processing','sent','failed')),
 attempts integer not null default 0, lease_id uuid, lease_until timestamptz,
 provider_id text, last_error text
);
create unique index bsb_moderation_email_daily_idx on private.bsb_moderation_email_batches(reminder_day) where kind='daily';
create index bsb_moderation_email_pending_idx on private.bsb_moderation_email_batches(status,available_at);
create table private.bsb_moderation_email_events (
 id uuid primary key default gen_random_uuid(), report_id uuid unique references public.bsb_social_reports(id) on delete cascade,
 batch_id uuid references private.bsb_moderation_email_batches(id), created_at timestamptz not null default now()
);
create index bsb_moderation_email_events_batch_idx on private.bsb_moderation_email_events(batch_id);
alter table private.bsb_moderation_email_settings enable row level security;
alter table private.bsb_moderation_email_batches enable row level security;
alter table private.bsb_moderation_email_events enable row level security;
revoke all on private.bsb_moderation_email_settings,private.bsb_moderation_email_batches,private.bsb_moderation_email_events from public,anon,authenticated;
grant all on private.bsb_moderation_email_settings,private.bsb_moderation_email_batches,private.bsb_moderation_email_events to service_role;
create function private.bsb_enqueue_moderation_email() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into private.bsb_moderation_email_events(report_id) values(new.id); return new; end;
$$;
revoke all on function private.bsb_enqueue_moderation_email() from public,anon,authenticated,service_role;
create trigger bsb_report_email_after_insert after insert on public.bsb_social_reports for each row execute function private.bsb_enqueue_moderation_email();
-- Include the existing backlog once; do not modify any report.
insert into private.bsb_moderation_email_events(report_id) select id from public.bsb_social_reports where status in ('open','reviewing');
create function private.bsb_moderation_email_delivery(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 settings private.bsb_moderation_email_settings%rowtype;
 batch private.bsb_moderation_email_batches%rowtype;
 event_ids uuid[]; backlog integer; operation text:=payload->>'action'; local_day date:=(now() at time zone 'America/New_York')::date;
begin
 select * into settings from private.bsb_moderation_email_settings where singleton for update;
 if operation='status' then
  return jsonb_build_object('enabled',settings.enabled,'recipient',settings.recipient,'last_success',settings.last_success,'last_failure',settings.last_failure,'last_error',settings.last_error,
   'failed',(select count(*) from private.bsb_moderation_email_batches where status='failed'),
   'pending',(select count(*) from private.bsb_moderation_email_events e left join private.bsb_moderation_email_batches b on b.id=e.batch_id where b.status is null or b.status in ('pending','processing')));
 end if;
 if operation='claim' then
  if not settings.enabled or settings.recipient is null then return null; end if;
  update private.bsb_moderation_email_batches set status='failed',last_error='Delivery needs administrator review'
   where status in ('pending','processing') and (attempts>=6 or created_at < now()-interval '20 hours') and (lease_until is null or lease_until<now());
  -- A live lease prevents two scheduler invocations from sending concurrently.
  if exists(select 1 from private.bsb_moderation_email_batches where status='processing' and lease_until>now()) then return null; end if;
  select * into batch from private.bsb_moderation_email_batches where status in ('pending','processing') and available_at<=now() and (lease_until is null or lease_until<now()) order by created_at,id limit 1 for update;
  if not found then
   select count(*) into backlog from public.bsb_social_reports where status in ('open','reviewing');
   select array_agg(id) into event_ids from (select id from private.bsb_moderation_email_events where batch_id is null order by created_at,id limit 500) e;
   if coalesce(array_length(event_ids,1),0)>0 then
    insert into private.bsb_moderation_email_batches(kind,recipient,report_count,backlog_count) values('new',settings.recipient,array_length(event_ids,1),backlog) returning * into batch;
    update private.bsb_moderation_email_events set batch_id=batch.id where id=any(event_ids);
   elsif backlog>0 and extract(hour from now() at time zone 'America/New_York')>=9 and not exists(select 1 from private.bsb_moderation_email_batches where kind='daily' and reminder_day=local_day) then
    insert into private.bsb_moderation_email_batches(kind,reminder_day,recipient,report_count,backlog_count) values('daily',local_day,settings.recipient,0,backlog) returning * into batch;
   else return null;
   end if;
  end if;
  update private.bsb_moderation_email_batches set status='processing',attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '2 minutes' where id=batch.id returning * into batch;
  return jsonb_build_object('id',batch.id,'lease_id',batch.lease_id,'kind',batch.kind,'recipient',batch.recipient,'report_count',batch.report_count,'backlog_count',batch.backlog_count);
 elsif operation='finish' then
  select * into batch from private.bsb_moderation_email_batches where id=(payload->>'id')::uuid and lease_id=(payload->>'lease_id')::uuid and status='processing' for update;
  if not found then raise exception 'Delivery lease changed' using errcode='40001'; end if;
  if payload->>'result'='accepted' then
   update private.bsb_moderation_email_batches set status='sent',provider_id=left(payload->>'provider_id',100),lease_until=null,last_error=null where id=batch.id;
   update private.bsb_moderation_email_settings set last_success=now(),last_error=null where singleton;
  elsif payload->>'result'='failed' then
   update private.bsb_moderation_email_batches set status=case when attempts>=6 then 'failed' else 'pending' end,
    available_at=now()+make_interval(mins=>least(60,power(2,attempts)::integer)),lease_until=null,last_error=left(payload->>'error',100) where id=batch.id;
   update private.bsb_moderation_email_settings set last_failure=now(),last_error=left(payload->>'error',100) where singleton;
  else raise exception 'Invalid delivery result' using errcode='22023'; end if;
  return jsonb_build_object('recorded',true);
 else raise exception 'Invalid delivery action' using errcode='22023'; end if;
end;
$$;
revoke all on function private.bsb_moderation_email_delivery(jsonb) from public,anon,authenticated;
grant execute on function private.bsb_moderation_email_delivery(jsonb) to service_role;
create function public.bsb_moderation_email_delivery(payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.bsb_moderation_email_delivery(payload);$$;
revoke all on function public.bsb_moderation_email_delivery(jsonb) from public,anon,authenticated;
grant execute on function public.bsb_moderation_email_delivery(jsonb) to service_role;
-- Reuse the existing protected scheduler credentials without exposing them or changing push delivery.
do $$
declare existing_command text;
begin
 select command into existing_command from cron.job where jobname='bsb-send-daily-push';
 if existing_command is null or position('send-push-notifications' in existing_command)=0 or position('x-push-cron-secret' in existing_command)=0 then
  raise exception 'Protected scheduler configuration missing';
 end if;
 perform cron.schedule('bsb-moderation-alerts','*/5 * * * *',replace(existing_command,'send-push-notifications','moderation-alerts'));
end;
$$;
