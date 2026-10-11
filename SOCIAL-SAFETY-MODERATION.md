# Social safety release and moderation

Implemented for Community Standards version `2026-10-10`.

## Release order

The migration was applied to production on **October 10, 2026 at 10:47 p.m. America/New_York** (Supabase migration version `20261011024750`). The updated website and push sender were already deployed. Database existence, RLS, private report access, and server-only push-guard permissions were verified after deployment; existing account and social-table counts were unchanged.

A manual pre-release database archive was exported and its checksums verified. Account and app recovery, followed by the migration, passed on an isolated PostgreSQL 17 instance. This was a scoped restore test: managed platform schemas/extensions and semantic vector search were excluded. See [database recovery](DATABASE-RECOVERY.md) for the backup location, scope, and recovery procedure. Physical-device and signed-in multi-account checks below remain pending.

1. Apply `supabase/migrations/20261011024750_social_safety.sql` to project `yyldnatfhzobyeqnvqjv`. It adds consent, blocks, reports, suspension enforcement, and safety checks for existing social tables and RPCs. Existing users are deliberately not marked as having accepted the new terms. They retain private Bible/study access and must accept in their social profile to resume social features.
2. Deploy the updated website and `send-push-notifications` Edge Function in the same release window. Do not deploy the sender first: it depends on `bsb_social_push_allowed`. Until the updated website loads, existing users may see social-access errors.
3. Sync the built web assets into iOS/Android, build the release shells, and test on both physical devices. The default shells load the live website, so local bundles alone do not publish this change.
4. Confirm two real test accounts can accept standards, search, send/accept requests, play a room, report, block, and unblock. Blocking must hide both profiles from each other, remove the friendship, cancel a shared room, and prevent new requests/invitations. Test a third participant in a group room: the entire shared room ends. A sent OS notification or information previously viewed cannot be recalled.
5. Run Supabase security/performance advisors after applying the migration. Check the report queue in the authenticated operator dashboard and verify the sender no longer delivers blocked/suspended social events. A notification already in delivery can still arrive. Database gameplay access ends immediately, while an already-open client detects a removed room through periodic checks (up to 30 seconds while visible). Supabase caches Presence/Broadcast authorization until reconnect or JWT refresh; do not treat a previously authorized presence channel as proof of continuing room access. The UI uses presence only for an online indicator and closes it when the room disappears. Validate that behavior on both devices.

## Review reports

Dane Hurst has committed to reviewing this queue **daily**. Review it **at least daily**, with priority for threats, exploitation, or child-safety concerns. The app queues reports; it does not send moderator alerts. Checking the queue and acting on reports is an ongoing responsibility, and must be in place before store submission.

Use the Supabase dashboard SQL editor with administrator access. Do not expose admin credentials or these actions in the public app. Reports are not readable by app users, including the reporter. The reported person is not given the reporter's identity.

```sql
select id, created_at, reporter_id, reported_id, reason, details,
       profile_snapshot, status
from public.bsb_social_reports
where status in ('open', 'reviewing')
order by created_at;
```

Review the profile snapshot and context. Avoid automatic suspension from report counts: false reports must not become a way to harass users. Reports are limited to 10 per reporter per day, and one report about the same person per hour; urgent follow-up is available at support@bigscreenbible.com.

Use the actual report/account UUIDs in these templates:

```sql
-- Mark a report as under review.
update public.bsb_social_reports
set status = 'reviewing'
where id = '<report UUID>'::uuid;

-- Suspend confirmed abuse. This hides the profile from other users,
-- disables social writes/invitations, cancels active rooms involving them,
-- and deletes queued social notifications. Private reading/study stays available.
insert into private.bsb_social_suspensions(user_id, reason)
values ('<reported account UUID>'::uuid, 'Confirmed harassment; report <report UUID>');

-- Resolve or dismiss after review; use dismissed for unsubstantiated reports.
update public.bsb_social_reports
set status = 'resolved', reviewed_at = now()
where id = '<report UUID>'::uuid;

-- Lift a suspension after review/appeal. Cancelled games remain cancelled.
delete from private.bsb_social_suspensions
where user_id = '<account UUID>'::uuid;
```

Communicate outcomes or appeals through the support channel as appropriate. The app gives suspended users the support address. Remove prohibited content if confirmed: delete the offending `bsb_profiles` row using the operator dashboard; the user can recreate a respectful profile only after their suspension is lifted. Preserve report evidence for the investigation. Account deletion cascades consent, blocks, reports associated with either account, and suspensions; there is no separate indefinite evidence-retention system.

## Limits and testing

The automated name filter catches a small set of abusive terms, not all objectionable content, languages, or evasions. Human moderation is required. Profiles have preset avatars and no public image upload/chat, but usernames, display names, requests, and game interactions are social content.

`npm run test:social-safety` runs an isolated PostgreSQL runtime with actual RLS, grants, functions, and triggers, plus client consent/escaping/control checks. Platform Auth/Realtime functions are stubbed and unrelated vector/publication setup is omitted. Run existing social/friend/game/push regressions too. These tests do not establish physical-device behavior, delivery latency, or store approval.
