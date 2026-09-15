-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.profiles               enable row level security;
alter table public.companies              enable row level security;
alter table public.support_organizations  enable row level security;
alter table public.support_groups         enable row level security;
alter table public.sites                  enable row level security;
alter table public.product_categories     enable row level security;
alter table public.services               enable row level security;
alter table public.business_hours         enable row level security;
alter table public.clusters               enable row level security;
alter table public.mttr_presets           enable row level security;
alter table public.metrics                enable row level security;
alter table public.metric_revisions       enable row level security;
alter table public.import_jobs            enable row level security;
alter table public.audit_log              enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array[
    'companies','support_organizations','support_groups','sites',
    'product_categories','services','business_hours','clusters','mttr_presets'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (true);',
      t || '_read', t
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin());',
      t || '_admin_write', t
    );
  end loop;
end $$;

create policy "metrics_read" on public.metrics
  for select to authenticated using (true);

create policy "metrics_insert" on public.metrics
  for insert to authenticated with check (auth.uid() = created_by);

create policy "metrics_admin_write" on public.metrics
  for update using (public.is_admin());

create policy "metrics_admin_delete" on public.metrics
  for delete using (public.is_admin());

create policy "revisions_read" on public.metric_revisions
  for select to authenticated using (true);

create policy "revisions_insert" on public.metric_revisions
  for insert to authenticated with check (auth.uid() = performed_by);

create policy "import_jobs_read" on public.import_jobs
  for select to authenticated using (public.is_admin());

create policy "audit_log_read" on public.audit_log
  for select to authenticated using (public.is_admin());

create policy "audit_log_admin" on public.audit_log
  for all using (public.is_admin()) with check (public.is_admin());
