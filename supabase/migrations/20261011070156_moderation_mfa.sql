-- Require a live, recently TOTP-verified session for private moderation data.
create or replace function private.bsb_moderation(operator_id uuid, payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 operation text := coalesce(payload->>'action','queue');
 item public.bsb_social_reports%rowtype;
 prior jsonb; later jsonb; profile jsonb;
 response jsonb; items jsonb; total integer; counts jsonb;
 filter_status text := coalesce(payload->>'status','active');
 filter_reason text := coalesce(payload->>'reason','all');
 search_text text := left(coalesce(payload->>'search',''),100);
 page_number integer := greatest(0,least(coalesce((payload->>'page')::integer,0),20000));
 note_text text := btrim(coalesce(payload->>'note',''));
 mfa_ok boolean;
begin
 if operator_id is null or not exists(select 1 from private.bsb_social_moderators where user_id=operator_id) then
  raise exception 'Moderator access required' using errcode='42501';
 end if;
 if not exists(select 1 from auth.sessions where id=(payload->>'session_id')::uuid and user_id=operator_id and (not_after is null or not_after > now())) then
  raise exception 'Sign in again before moderating' using errcode='42501';
 end if;
 -- The Edge Function supplies assurance/timestamp only from a verified JWT.
 mfa_ok := coalesce(payload->>'assurance'='aal2',false)
  and coalesce((payload->>'mfa_verified_at')::double precision,0) between extract(epoch from now())-900 and extract(epoch from now())+30
  and exists(select 1 from auth.sessions s join auth.mfa_factors f on f.id=s.factor_id
   where s.id=(payload->>'session_id')::uuid and s.user_id=operator_id and s.aal='aal2'
   and f.user_id=operator_id and f.status='verified' and f.factor_type='totp');
 if operation='access' then return jsonb_build_object('allowed',true,'mfa_required',not mfa_ok); end if;
 if not mfa_ok then raise exception 'Verify your authenticator code to continue moderating' using errcode='28000'; end if;
 if operation='queue' then
  if filter_status not in ('active','all','open','reviewing','resolved','dismissed') or filter_reason not in ('all','harassment','hate','sexual','impersonation','spam','other') then
   raise exception 'Invalid queue filter' using errcode='22023';
  end if;
  select jsonb_object_agg(status,n) into counts from (select status,count(*) n from public.bsb_social_reports group by status) q;
  select count(*) into total from public.bsb_social_reports r
   left join public.bsb_profiles p on p.user_id=r.reported_id
   where (filter_status='all' or (filter_status='active' and r.status in ('open','reviewing')) or r.status=filter_status)
   and (filter_reason='all' or r.reason=filter_reason)
   and (search_text='' or position(lower(search_text) in lower(coalesce(p.username,'') || ' ' || coalesce(p.display_name,'') || ' ' || coalesce(r.profile_snapshot->>'username',''))) > 0);
  select coalesce(jsonb_agg(row_data order by created_at,id),'[]'::jsonb) into items from (
   select r.created_at,r.id,jsonb_build_object('id',r.id,'reason',r.reason,'details',r.details,'status',r.status,'created_at',r.created_at,'updated_at',r.updated_at,
    'reported_name',coalesce(nullif(p.display_name,''),p.username,r.profile_snapshot->>'username','Removed profile'),
    'reported_username',coalesce(p.username,r.profile_snapshot->>'username',''),'suspended',s.user_id is not null) row_data
   from public.bsb_social_reports r left join public.bsb_profiles p on p.user_id=r.reported_id
   left join private.bsb_social_suspensions s on s.user_id=r.reported_id
   where (filter_status='all' or (filter_status='active' and r.status in ('open','reviewing')) or r.status=filter_status)
   and (filter_reason='all' or r.reason=filter_reason)
   and (search_text='' or position(lower(search_text) in lower(coalesce(p.username,'') || ' ' || coalesce(p.display_name,'') || ' ' || coalesce(r.profile_snapshot->>'username',''))) > 0)
   order by r.created_at,r.id limit 25 offset page_number*25
  ) q;
  return jsonb_build_object('items',items,'total',total,'counts',coalesce(counts,'{}'::jsonb),'page',page_number,'alerts',private.bsb_moderation_email_delivery(jsonb_build_object('action','status')));
 end if;
 select * into item from public.bsb_social_reports where id=(payload->>'report_id')::uuid for update;
 if not found then raise exception 'Report no longer exists' using errcode='P0002'; end if;
 if operation <> 'detail' then
  if operation not in ('review','resolve','dismiss','note','suspend','restore_access','remove_profile') then raise exception 'Invalid action' using errcode='22023'; end if;
  if char_length(note_text) not between 1 and 2000 then raise exception 'Add a note of 1–2000 characters' using errcode='22023'; end if;
  if payload->>'expected_updated_at' is null or item.updated_at is distinct from (payload->>'expected_updated_at')::timestamptz then
   raise exception 'This report changed. Reload it before acting.' using errcode='40001';
  end if;
  if operation in ('suspend','restore_access','remove_profile') and exists(select 1 from private.bsb_social_moderators where user_id=item.reported_id) then
   raise exception 'Operator accounts require review in the administrator dashboard' using errcode='42501';
  end if;
  select to_jsonb(p) into profile from public.bsb_profiles p where user_id=item.reported_id;
  prior := jsonb_build_object('status',item.status,'profile',profile,'suspension',(select to_jsonb(s) from private.bsb_social_suspensions s where user_id=item.reported_id));
  if operation='suspend' then
   insert into private.bsb_social_suspensions(user_id,reason) values(item.reported_id,note_text)
   on conflict(user_id) do update set reason=excluded.reason;
  elsif operation='restore_access' then
   delete from private.bsb_social_suspensions where user_id=item.reported_id;
  elsif operation='remove_profile' then
   delete from public.bsb_profiles where user_id=item.reported_id;
  end if;
  update public.bsb_social_reports set
   status=case operation when 'review' then 'reviewing' when 'resolve' then 'resolved' when 'dismiss' then 'dismissed' else status end,
   reviewed_at=case when operation in ('resolve','dismiss') then now() when operation='review' then null else reviewed_at end,
   updated_at=clock_timestamp()
   where id=item.id returning * into item;
  select to_jsonb(p) into profile from public.bsb_profiles p where user_id=item.reported_id;
  later := jsonb_build_object('status',item.status,'profile',profile,'suspension',(select to_jsonb(s) from private.bsb_social_suspensions s where user_id=item.reported_id));
  insert into private.bsb_moderation_history(report_id,moderator_id,action,note,before_state,after_state)
   values(item.id,operator_id,operation,note_text,prior,later);
 end if;
 return jsonb_build_object('report',to_jsonb(item),
  'profile',(select jsonb_build_object('user_id',p.user_id,'username',p.username,'display_name',p.display_name) from public.bsb_profiles p where user_id=item.reported_id),
  'reporter',(select jsonb_build_object('username',p.username,'display_name',p.display_name) from public.bsb_profiles p where user_id=item.reporter_id),
  'target_is_moderator',exists(select 1 from private.bsb_social_moderators where user_id=item.reported_id),
  'suspension',(select jsonb_build_object('reason',s.reason,'created_at',s.created_at) from private.bsb_social_suspensions s where user_id=item.reported_id),
  'history',coalesce((select jsonb_agg(jsonb_build_object('action',h.action,'note',h.note,'created_at',h.created_at,'moderator_id',h.moderator_id,'moderator_name',coalesce(nullif(p.display_name,''),p.username,h.moderator_id::text,'Deleted moderator')) order by h.created_at desc,h.id) from private.bsb_moderation_history h left join public.bsb_profiles p on p.user_id=h.moderator_id where report_id=item.id),'[]'::jsonb));
end;
$$;
