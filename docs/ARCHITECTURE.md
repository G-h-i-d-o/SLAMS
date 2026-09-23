# SLA Management System — Architecture

## Overview

Multi-tenant B2B SaaS for managing Service Level Agreements.
Frontend: React + Vite + TypeScript. Backend: Supabase + Netlify Functions.

    ┌─────────────────────────────────────────────────────┐
    │                   Netlify CDN                       │
    │  ┌───────────────────┐  ┌─────────────────────────┐ │
    │  │  React SPA        │  │  Netlify Functions      │ │
    │  │  (Vite, TS)       │  │  (Node 22, TS)          │ │
    │  └──────────┬────────┘  └───────────┬─────────────┘ │
    └─────────────┼───────────────────────┼───────────────┘
                  │ supabase-js           │ service_role
                  ▼                       ▼
    ┌─────────────────────────────────────────────────────┐
    │                     Supabase                        │
    │  Postgres + RLS · Auth · Storage · Edge Functions   │
    └─────────────────────────────────────────────────────┘

## Roles

| Role    | Operations | Configuration | Administration |
|---------|:----------:|:-------------:|:--------------:|
| anon    | read-only  | —             | —              |
| user    | full       | —             | —              |
| editor  | full       | full          | —              |
| admin   | full       | full          | full           |

## Key tables

- `profiles` — extends auth.users, stores role
- `companies`, `support_group_companies`, `support_organizations`,
  `support_groups`, `sites`, `product_categories`, `services`,
  `business_hours`, `clusters`, `mttr_presets` — config reference data
- `metrics` — SLA contracts
- `metric_revisions` — audit trail of metric changes
- `metric_evaluations` — actual performance measurements
- `notifications` — in-app alerts
- `import_jobs` — Excel import audit
- `audit_log` — change log for every business table

## Deployment

1. Push to `main`
2. GitHub Actions runs `npm run typecheck` + `npm run build` + `supabase db push`
3. Netlify picks up the same push and rebuilds
4. Netlify Functions deploy automatically
5. Site live within ~2 minutes

## Monitoring

- **Sentry** — frontend + Netlify Functions errors
- **Supabase logs** — Postgres + edge function logs
- **Uptime robot** — pings `/.netlify/functions/health` every 5 min
- **Backups** — nightly pg_dump to S3, 30-day retention