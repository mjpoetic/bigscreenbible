# Social safety release and moderation

Implemented for Community Standards version `2026-10-10`.

## Release order

The migration was applied to production on **October 10, 2026 at 10:47 p.m. America/New_York** (Supabase migration version `20261011024750`). The updated website and push sender were already deployed. Database existence, RLS, private report access, and server-only push-guard permissions were verified after deployment; existing account and social-table counts were unchanged.

A manual pre-release database archive was exported and its checksums verified. Account and app recovery, followed by the migration, passed on an isolated PostgreSQL 17 instance. This was a scoped restore test: managed platform schemas/extensions and semantic vector search were excluded. See [database recovery](DATABASE-RECOVERY.md) for the backup location, scope, and recovery procedure. Dane confirmed that the other social safeguards are working on October 11, 2026. This is user confirmation; it does not establish store approval or replace release-build checks.

1. Apply `supabase/migrations/20261011024750_social_safety.sql` to project `yyldnatfhzobyeqnvqjv`. It adds consent, blocks, reports, suspension enforcement, and safety checks for existing social tables and RPCs. Existing users are deliberately not marked as having accepted the new terms. They retain private Bible/study access and must accept in their social profile to resume social features.
2. Deploy the updated website and `send-push-notifications` Edge Function in the same release window. Do not deploy the sender first: it depends on `bsb_social_push_allowed`. Until the updated website loads, existing users may see social-access errors.
3. Sync the built web assets into iOS/Android, build the release shells, and test on both physical devices. The default shells load the live website, so local bundles alone do not publish this change.
4. Confirm two real test accounts can accept standards, search, send/accept requests, play a room, report, block, and unblock. Blocking must hide both profiles from each other, remove the friendship, cancel a shared room, and prevent new requests/invitations. Test a third participant in a group room: the entire shared room ends. A sent OS notification or information previously viewed cannot be recalled.
5. Run Supabase security/performance advisors after applying the migration. Check the report queue in the authenticated operator dashboard and verify the sender no longer delivers blocked/suspended social events. A notification already in delivery can still arrive. Database gameplay access ends immediately, while an already-open client detects a removed room through periodic checks (up to 30 seconds while visible). Supabase caches Presence/Broadcast authorization until reconnect or JWT refresh; do not treat a previously authorized presence channel as proof of continuing room access. The UI uses presence only for an online indicator and closes it when the room disappears. Validate that behavior on both devices.

## Review reports

Dane Hurst has committed to reviewing this queue **daily**. Review it **at least daily**, with priority for threats, exploitation, or child-safety concerns. The app queues reports; it does not send moderator alerts. Checking the queue and acting on reports is an ongoing responsibility, and must be in place before store submission.

Open `/moderation/` on the Big Screen Bible website after signing in through the main app in the same browser and on the same hostname. Click Refresh if needed. Moderator access is granted separately to the four existing, confirmed app accounts authorized by Dane; changing a profile or email cannot grant access.

The queue supports status/reason filters, profile search, and 25-report pages. Select a report to see its profile snapshot and written details. Investigate before acting: a report is an allegation, not proof. Use Start review, Resolve report, Dismiss report, or Save note. Every action requires a note and records the moderator, time, and before/after state. Concurrent changes require reloading the report.

Confirmed abuse can be handled with Suspend social access and Remove profile. Suspension hides the profile, disables social writes/invitations, cancels active rooms and deletes queued social notifications. Private reading/study remains available. Restore social access lifts the restriction; cancelled games and removed friendships are not restored. Profile removal does not delete the account. Moderator accounts require administrator review for account restrictions.

The queue refreshes every minute while visible. It sends no email or background alerts. Review it daily. Reports are limited to 10 per reporter per day and one report about the same person per hour; urgent follow-up is available at support@bigscreenbible.com.

Authorization is checked by the `moderation` Edge Function using a verified user token, a live Auth session, and `private.bsb_social_moderators`. Reports and audit data remain unavailable to ordinary app accounts. Only the server can invoke moderation RPCs. To revoke moderator privileges immediately, an administrator removes that account's row from the private allowlist. Do not put service credentials in the browser.

Communicate outcomes or appeals through the support channel as appropriate. The app gives suspended users the support address. Remove prohibited content if confirmed: delete the offending `bsb_profiles` row using the operator dashboard; the user can recreate a respectful profile only after their suspension is lifted. Preserve report evidence for the investigation. Account deletion cascades consent, blocks, reports associated with either account, and suspensions; there is no separate indefinite evidence-retention system.

## Limits and testing

The automated name filter catches a small set of abusive terms, not all objectionable content, languages, or evasions. Human moderation is required. Profiles have preset avatars and no public image upload/chat, but usernames, display names, requests, and game interactions are social content.

`npm run test:social-safety` runs an isolated PostgreSQL runtime with actual RLS, grants, functions, and triggers, plus client consent/escaping/control checks. Platform Auth/Realtime functions are stubbed and unrelated vector/publication setup is omitted. Run existing social/friend/game/push regressions too. These tests do not establish physical-device behavior, delivery latency, or store approval.

`npm run test:moderation` checks real PostgreSQL permissions, session/allowlist enforcement, conflict handling, audit evidence, restrictions, and access revocation, plus Edge Function identity and request validation.

Moderator database migration `20261011062241` and the authenticated `moderation` Edge Function were deployed October 11, 2026. All four requested, confirmed app accounts were added to the private allowlist. No existing report was resolved and no production account was restricted during deployment.
