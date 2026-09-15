-- =========================================================================
-- SLA Management System — Core schema
-- =========================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       citext unique not null,
  full_name   text,
  role        text not null check (role in ('admin','user')) default 'user',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

create table public.companies (
  id               uuid primary key default gen_random_uuid(),
  external_id      text unique not null,
  customer_number  text,
  name             text not null,
  is_enabled       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_companies_updated before update on public.companies
  for each row execute function public.touch_updated_at();

create table public.support_organizations (
  id          uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  name        text not null,
  is_enabled  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_support_orgs_updated before update on public.support_organizations
  for each row execute function public.touch_updated_at();

create table public.support_groups (
  id                       uuid primary key default gen_random_uuid(),
  external_id              text unique not null,
  support_organization_id  uuid not null references public.support_organizations(id) on delete restrict,
  name                     text not null,
  is_enabled               boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on public.support_groups (support_organization_id);
create trigger trg_support_groups_updated before update on public.support_groups
  for each row execute function public.touch_updated_at();

create table public.sites (
  id          uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  is_enabled  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.sites (company_id);
create trigger trg_sites_updated before update on public.sites
  for each row execute function public.touch_updated_at();

create table public.product_categories (
  id            uuid primary key default gen_random_uuid(),
  external_id   text unique not null,
  company_id    uuid references public.companies(id) on delete cascade,
  tier1         text not null,
  tier2         text,
  tier3         text,
  product_name  text not null,
  is_enabled    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.product_categories (company_id);
create trigger trg_product_categories_updated before update on public.product_categories
  for each row execute function public.touch_updated_at();

create table public.services (
  id              uuid primary key default gen_random_uuid(),
  external_id     text unique not null,
  category        text not null,
  sub_category    text,
  component       text not null,
  component_mpss  text,
  is_enabled      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_services_updated before update on public.services
  for each row execute function public.touch_updated_at();

create table public.business_hours (
  id           uuid primary key default gen_random_uuid(),
  external_id  text unique not null,
  label        text not null,
  schedule     text not null,
  is_enabled   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_business_hours_updated before update on public.business_hours
  for each row execute function public.touch_updated_at();

create table public.clusters (
  id           uuid primary key default gen_random_uuid(),
  external_id  text unique not null,
  company_id   uuid not null references public.companies(id) on delete cascade,
  name         text not null,
  is_enabled   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.clusters (company_id);
create trigger trg_clusters_updated before update on public.clusters
  for each row execute function public.touch_updated_at();

create table public.mttr_presets (
  id                uuid primary key default gen_random_uuid(),
  name              text unique not null,
  respond_critical  int not null default 0,
  resolve_critical  int not null default 0,
  respond_high      int not null default 0,
  resolve_high      int not null default 0,
  respond_medium    int not null default 0,
  resolve_medium    int not null default 0,
  respond_low       int not null default 0,
  resolve_low       int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_mttr_presets_updated before update on public.mttr_presets
  for each row execute function public.touch_updated_at();

create table public.metrics (
  id                       uuid primary key default gen_random_uuid(),
  document_id              text not null,
  revision_number          int not null default 1,

  company_id               uuid not null references public.companies(id) on delete restrict,
  customer_number          text not null,
  contact_company          text not null,
  support_group_id         uuid not null references public.support_groups(id) on delete restrict,
  site_id                  uuid references public.sites(id) on delete set null,
  product_category_id      uuid not null references public.product_categories(id) on delete restrict,
  service_id               uuid not null references public.services(id) on delete restrict,

  start_date               date not null,
  end_date                 date not null,
  signed_date              date not null,

  rollup_performance       numeric(6,2) not null,
  tiered_type              text not null check (tiered_type in ('Tiered','Configured','Non Catalogued')),

  bh_critical              uuid not null references public.business_hours(id),
  bh_high                  uuid not null references public.business_hours(id),
  bh_medium                uuid not null references public.business_hours(id),
  bh_low                   uuid not null references public.business_hours(id),

  mttr_mode                text not null check (mttr_mode in ('respond','resolve','both')),

  mtt_respond_critical     int,
  mtt_resolve_critical     text check (
                             mtt_resolve_critical is null
                             or mtt_resolve_critical ~ '^\d+(\.\d+)?$'
                             or upper(mtt_resolve_critical) = 'TD'
                           ),
  mtt_respond_high         int,
  mtt_resolve_high         text check (
                             mtt_resolve_high is null
                             or mtt_resolve_high ~ '^\d+(\.\d+)?$'
                             or upper(mtt_resolve_high) = 'TD'
                           ),
  mtt_respond_medium       int,
  mtt_resolve_medium       text check (
                             mtt_resolve_medium is null
                             or mtt_resolve_medium ~ '^\d+(\.\d+)?$'
                             or upper(mtt_resolve_medium) = 'TD'
                           ),
  mtt_respond_low          int,
  mtt_resolve_low          text check (
                             mtt_resolve_low is null
                             or mtt_resolve_low ~ '^\d+(\.\d+)?$'
                             or upper(mtt_resolve_low) = 'TD'
                           ),

  cluster_id               uuid not null references public.clusters(id) on delete restrict,
  vendor_group             text,
  exclude_m7               boolean not null default false,

  status                   text not null check (status in ('active','pending','expired','terminated')) default 'active',
  is_current               boolean not null default true,

  created_by               uuid not null references public.profiles(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index on public.metrics (company_id);
create index on public.metrics (support_group_id);
create index on public.metrics (is_current) where is_current;
create index on public.metrics (document_id);
create unique index metrics_current_document on public.metrics (document_id) where is_current;

create trigger trg_metrics_updated before update on public.metrics
  for each row execute function public.touch_updated_at();

create table public.metric_revisions (
  id              uuid primary key default gen_random_uuid(),
  metric_id       uuid not null references public.metrics(id) on delete cascade,
  action          text not null check (action in ('New','Modify','Expire','Terminate')),
  effective_from  date,
  effective_to    date,
  signed_date     date,
  changes         jsonb not null default '{}'::jsonb,
  previous_values jsonb not null default '{}'::jsonb,
  performed_by    uuid not null references public.profiles(id),
  performed_at    timestamptz not null default now()
);
create index on public.metric_revisions (metric_id);

create table public.import_jobs (
  id             uuid primary key default gen_random_uuid(),
  source         text not null,
  entity         text not null,
  status         text not null check (status in ('running','success','partial','failed')) default 'running',
  rows_total     int not null default 0,
  rows_imported  int not null default 0,
  rows_skipped   int not null default 0,
  errors         jsonb not null default '[]'::jsonb,
  started_at     timestamptz not null default now(),
  completed_at   timestamptz
);

create table public.audit_log (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id),
  user_email  citext,
  table_name  text not null,
  record_id   uuid,
  action      text not null,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);
create index on public.audit_log (created_at desc);
create index on public.audit_log (table_name);
