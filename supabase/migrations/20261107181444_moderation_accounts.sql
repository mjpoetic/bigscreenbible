-- Account operations are service-only and reuse the live moderator/MFA gate.
-- Keep this audit independent of auth.users so account deletion retains the record.
create table private.bsb_account_history (
 id uuid primary key default gen_random_uuid(),
 operator_id uuid not null,
 target_id uuid not null,
 action text not null check (action in ('reset_password','delete_user')),
 note text not null check (char_length(note) between 1 and 2000),
 status text not null default 'requested' check (status in ('requested','completed','failed')),
 created_at timestamptz not null default now()
);
alter table private.bsb_account_history enable row level security;
revoke all on private.bsb_account_history from public,anon,authenticated;
grant select,insert,update on private.bsb_account_history to service_role;

create function private.bsb_moderation_accounts(operator_id uuid,payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 access_result jsonb;
 operation text := payload->>'action';
 target uuid;
 account auth.users%rowtype;
 audit_id uuid;
 result jsonb;
 query_text text := lower(btrim(left(coalesce(payload->>'search',''),100)));
 page_number integer := greatest(0,least(coalesce((payload->>'page')::integer,0),20000));
begin
 access_result := private.bsb_moderation(operator_id,payload || jsonb_build_object('action','access'));
 if coalesce((access_result->>'mfa_required')::boolean,true) then
  raise exception 'Verify your authenticator code to manage accounts' using errcode='28000';
 end if;
 if operation='accounts' then
  select coalesce(jsonb_agg(item order by created_at desc,id),'[]'::jsonb) into result from (
   select u.created_at,u.id,jsonb_build_object('id',u.id,'email',u.email,'created_at',u.created_at,
    'last_sign_in_at',u.last_sign_in_at,'email_confirmed_at',u.email_confirmed_at,
    'name',coalesce(nullif(p.display_name,''),p.username,''),
    'protected',exists(select 1 from private.bsb_social_moderators m where m.user_id=u.id),
    'providers',(select coalesce(jsonb_agg(i.provider),'[]'::jsonb) from auth.identities i where i.user_id=u.id)) item
   from auth.users u left join public.bsb_profiles p on p.user_id=u.id
   where query_text='' or position(query_text in lower(coalesce(u.email,'') || ' ' || u.id::text || ' ' || coalesce(p.username,'') || ' ' || coalesce(p.display_name,'')))>0
   order by u.created_at desc,u.id limit 26 offset page_number*25
  ) q;
  return jsonb_build_object('items',result,'page',page_number);
 end if;
 if operation='account_finish' then
  update private.bsb_account_history h set status=case when payload->>'success'='true' then 'completed' else 'failed' end
   where h.id=(payload->>'audit_id')::uuid and h.operator_id=bsb_moderation_accounts.operator_id and h.status='requested';
  if not found then raise exception 'Account action no longer pending' using errcode='40001'; end if;
  return jsonb_build_object('recorded',true);
 end if;
 if operation not in ('reset_password','delete_user') then raise exception 'Invalid action' using errcode='22023'; end if;
 target := (payload->>'user_id')::uuid;
 select * into account from auth.users where id=target for update;
 if not found then raise exception 'Account no longer exists' using errcode='P0002'; end if;
 if target=operator_id or exists(select 1 from private.bsb_social_moderators where user_id=target) then
  raise exception 'Moderator accounts require the Supabase administrator dashboard' using errcode='42501';
 end if;
 if char_length(btrim(coalesce(payload->>'note',''))) not between 1 and 2000 then raise exception 'Add an account action note' using errcode='22023'; end if;
 if coalesce(payload->>'email','') is distinct from coalesce(account.email,'') then raise exception 'Account changed. Search again before acting.' using errcode='40001'; end if;
 if operation='delete_user' and payload->>'confirmation' is distinct from 'DELETE ' || target::text then raise exception 'Deletion confirmation did not match' using errcode='22023'; end if;
 if operation='reset_password' and coalesce(account.email,'')='' then raise exception 'This account has no email address' using errcode='22023'; end if;
 if exists(select 1 from private.bsb_account_history h where h.target_id=target and h.action=operation and h.created_at>now()-interval '60 seconds') then
  raise exception 'Wait a minute before repeating this action' using errcode='40001';
 end if;
 insert into private.bsb_account_history(operator_id,target_id,action,note) values(operator_id,target,operation,btrim(payload->>'note')) returning id into audit_id;
 if operation='delete_user' then
  -- Revoke refresh sessions first. Already-issued access JWTs expire normally.
  delete from auth.sessions where user_id=target;
  delete from public.bsb_push_subscriptions where user_id=target;
 end if;
 return jsonb_build_object('audit_id',audit_id,'email',account.email,'user_id',target);
end;
$$;
revoke all on function private.bsb_moderation_accounts(uuid,jsonb) from public,anon,authenticated;
grant execute on function private.bsb_moderation_accounts(uuid,jsonb) to service_role;
create function public.bsb_moderation_accounts(operator_id uuid,payload jsonb) returns jsonb
language sql security invoker set search_path = '' as $$select private.bsb_moderation_accounts(operator_id,payload);$$;
revoke all on function public.bsb_moderation_accounts(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.bsb_moderation_accounts(uuid,jsonb) to service_role;
