# Runbook

## Health checks

| What        | Command                                                    | Expected  |
|-------------|------------------------------------------------------------|-----------|
| Frontend    | `curl -I https://<site>.netlify.app/`                       | 200       |
| API health  | `curl https://<site>.netlify.app/.netlify/functions/health` | `{"ok":true}` |
| Postgres    | Supabase dashboard → Database → healthy                     | green     |
| Auth        | Supabase dashboard → Auth → healthy                         | green     |

## Common incidents

### Blank page

1. Check Sentry for a recent error in the frontend project.
2. If Sentry is empty, the ErrorBoundary now catches render crashes —
   user should see a styled card, not a blank screen.
3. If the whole app is blank (not just a page), it's a stale deploy or
   a crash above the boundary. Roll back on Netlify.

### API returns 500

1. Netlify → Functions → `<function name>` → Logs.
2. Common causes:
   - Missing env var (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
   - RLS policy blocking the service_role call (shouldn't happen)
3. Fix env var scope, redeploy.

### RLS policy violation reported

1. Reproduce with the same role.
2. Run `supabase/tests/rls_tests.sql` in the SQL Editor.
3. If it fails, check recent migrations for typos in the policy.

### Migrations fail in CI

1. GitHub Actions → failed run → read the SQL error.
2. Never edit an applied migration — create a new one.
3. If the migration is destructive, split it.

## Restore procedure

1. Identify the latest backup: `aws s3 ls s3://<bucket>/backups/`
2. Download: `aws s3 cp s3://<bucket>/backups/<file> /tmp/`
3. Provision a fresh Supabase project.
4. `./scripts/restore.sh /tmp/<file>`
5. Verify row counts.
6. Swap `VITE_SUPABASE_URL` in Netlify, redeploy.

**Target: restore completes within 1 hour.**

## Secret rotation

| Secret | Frequency | Procedure |
|---|---|---|
| SUPABASE_SERVICE_ROLE_KEY | 90 days | Supabase → Settings → API → Reset → update Netlify env |
| SUPABASE_ACCESS_TOKEN | 90 days | Supabase → Account → Access Tokens → revoke → new → update GitHub |
| SENTRY_DSN | rarely | Sentry → Settings → Projects → Client Keys |