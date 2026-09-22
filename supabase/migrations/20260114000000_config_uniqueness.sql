-- =========================================================================
-- Prevent duplicate configuration entries
--
-- Each unique index is created inside its own exception handler. If a
-- table already contains duplicates, that index is skipped with a NOTICE
-- and the migration continues — no rollback, no data loss.
-- =========================================================================

do $$
declare
  idx record;
begin
  for idx in
    select * from (values
      ('companies_name_unique',
       'create unique index if not exists companies_name_unique on public.companies (lower(trim(name)))'),

      ('support_group_companies_name_unique',
       'create unique index if not exists support_group_companies_name_unique on public.support_group_companies (lower(trim(name)))'),

      ('support_organizations_unique',
       'create unique index if not exists support_organizations_unique on public.support_organizations (support_group_company_id, lower(trim(name)))'),

      ('support_groups_unique',
       'create unique index if not exists support_groups_unique on public.support_groups (support_organization_id, lower(trim(name)))'),

      ('sites_unique',
       'create unique index if not exists sites_unique on public.sites (company_id, lower(trim(name)))'),

      ('product_categories_unique',
       'create unique index if not exists product_categories_unique on public.product_categories (coalesce(company_id, ''00000000-0000-0000-0000-000000000000''::uuid), lower(trim(tier1)), lower(trim(coalesce(tier2, ''''))), lower(trim(coalesce(tier3, ''''))), lower(trim(product_name)))'),

      ('services_unique',
       'create unique index if not exists services_unique on public.services (lower(trim(category)), lower(trim(coalesce(sub_category, ''''))), lower(trim(component)))'),

      ('business_hours_label_unique',
       'create unique index if not exists business_hours_label_unique on public.business_hours (lower(trim(label)))'),

      ('clusters_unique',
       'create unique index if not exists clusters_unique on public.clusters (company_id, lower(trim(name)))'),

      ('mttr_presets_name_unique',
       'create unique index if not exists mttr_presets_name_unique on public.mttr_presets (lower(trim(name)))')
    ) as t(name, stmt)
  loop
    begin
      execute idx.stmt;
      raise notice 'CREATED: %', idx.name;
    exception when others then
      raise notice 'SKIPPED: % — %', idx.name, sqlerrm;
    end;
  end loop;
end $$;