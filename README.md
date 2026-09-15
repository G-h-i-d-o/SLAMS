# SLA Management System

Prototype → production build of the SLA Management console.
Backend: Supabase (Postgres + Auth + Storage + Edge Functions).
Frontend: React + Vite + TypeScript, deployed on Netlify.

## Local development

    cp .env.example .env
    npm install
    npm run dev

## Database migrations

    supabase login
    supabase link --project-ref $SUPABASE_PROJECT_ID
    supabase db push
    supabase db reset

## Deploy

Push to `main` → GitHub Actions runs migrations → Netlify builds and deploys.

## Phases

- **Phase 0** — Foundations: scaffold, schema, RLS, seed, CI/CD.
- Phase 1 — Auth UI + configuration pages.
- Phase 2 — Create Metrics wizard wired to Supabase.
- Phase 3 — Metrics history, export, admin delete.
- Phase 4 — ITSM sync Edge Function + pg_cron.
