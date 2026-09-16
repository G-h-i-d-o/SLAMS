-- =========================================================================
-- Add top tier: Support Group Company → Support Organization → Support Group
-- =========================================================================

create table public.support_group_companies (
  id           uuid primary key default gen_random_uuid(),
  external_id  text unique not null default public.gen_external_id('SGC'),
  name         text not null,
  is_enabled   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_sgc_updated before update on public.support_group_companies
  for each row execute function public.touch_updated_at();

create trigger trg_audit_sgc after insert or update or delete on public.support_group_companies
  for each row execute function public.audit_change();

alter table public.support_group_companies enable row level security;

create policy "sgc_read" on public.support_group_companies
  for select to authenticated using (true);

create policy "sgc_admin_write" on public.support_group_companies
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================================
-- Link Support Organizations to a Support Group Company
-- =========================================================================

-- Add nullable column first so existing rows can survive the change
alter table public.support_organizations
  add column support_group_company_id uuid
    references public.support_group_companies(id) on delete restrict;

-- Create a default parent for the existing organizations
insert into public.support_group_companies (external_id, name)
values ('SGC-DEFAULT', 'Default Support Group Company')
on conflict (external_id) do nothing;

-- Attach every existing organization to the default parent
update public.support_organizations
set support_group_company_id = (
  select id from public.support_group_companies
  where external_id = 'SGC-DEFAULT'
)
where support_group_company_id is null;

-- Now require the FK
alter table public.support_organizations
  alter column support_group_company_id set not null;

create index on public.support_organizations (support_group_company_id);