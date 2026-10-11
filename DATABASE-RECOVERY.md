# Manual database backup and recovery

## October 10, 2026 social-safety release

The pre-release backup is stored privately on the operator's Mac at:

`~/Documents/Big Screen Bible Backups/20261011T023850Z/`

- `database.dump`: 33,530,856-byte PostgreSQL custom archive of the production database, including schema, data, functions, policies, and triggers.
- `roles.sql`: role definitions without database-role passwords.
- `manifest.json`: export time, sizes, and SHA-256 checksums.
- `archive-list.txt`: archive inventory; `export.log`: export diagnostics.

The archive was exported around 10:39 p.m. October 10 in America/New_York. Its UTC filename begins October 11. The archive SHA-256 is `6c1a240bc8bb36d38aa896dc93e1b77c61a839cc29785ec33278b3fc1ef04194`; the role-file SHA-256 is `1c2b402c45ecc414f5fbf78f235182feeacc216d01788653fde7c692d779772b`.

Backups contain private account/study data and authentication records. Keep them outside Git, restrict access, and keep a separate protected copy for protection against loss of the Mac. The database export does not back up Storage object files, Edge Function source/configuration, provider secrets, OAuth/SMTP settings, or database-role passwords. The project is on the Free plan and has no dashboard scheduled backups.

## Recovery verification performed

An isolated PostgreSQL 17 instance restored the account and app schemas and data, including Auth accounts, profiles, friendships, games/players, push tables, study sync, and verse cache. Restore included app RLS, grants, functions, and triggers; original object ownership was mapped to the local test administrator. The social-safety migration then succeeded against that restored data without changing existing row counts.

Checksums were verified against the manifest. Managed platform schemas/extensions and semantic vector-search objects were excluded from the local restore test. This is evidence of recovery for the data and database logic affected by this release, not a tested full-platform disaster restore. Local test evidence is under `/private/tmp/bsb-restore-20261011T023850Z-v2/` and is temporary.

The production migration is recorded as `20261011024750_social_safety.sql`. Production checks confirmed its tables, RLS, restricted report access, server-only push guard, and unchanged existing account/social row counts. Native/device tests remain separate.

## If recovery is needed

1. Preserve the current database and record the incident before restoring. Do not blindly overwrite production: a restore to this snapshot would discard later changes.
2. Verify the saved archive sizes and SHA-256 hashes. Identify the affected objects and accounts; restore the minimum necessary data when possible.
3. Use PostgreSQL 17 tools and an isolated compatible Supabase environment for a full-platform restore. Ensure required managed schemas, extensions, roles, and settings are available. Follow the current [Supabase recovery guide](https://supabase.com/docs/guides/self-hosting/restore-from-platform), including its managed-object compatibility precautions. Raw archive restore into an existing managed project may encounter ownership/permission conflicts.
4. Restore first into the isolated environment. For a scoped app/account recovery, select relevant objects with a reviewed `pg_restore --list` / `--use-list` inventory, recreate needed role names, and use `--exit-on-error --single-transaction --no-owner`. Do not treat an archive inventory alone as a successful restore.
5. Compare account/table counts, constraints, grants/RLS, and application behavior. Reconcile newer data before transferring reviewed repairs into production. Recover Storage objects and external configuration separately if affected.

Blocking deliberately removes friendships and queued notifications and cancels shared active games. Undoing the schema migration alone would not reverse actions users took after release. Reverting policy behavior should preserve newly collected reports and consent records and be handled as a reviewed forward migration.
