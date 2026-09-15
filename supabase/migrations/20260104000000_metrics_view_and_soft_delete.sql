-- =========================================================================
-- Flattened metrics view (for History page + Excel export)
-- =========================================================================

create or replace view public.v_metrics_full
with (security_invoker = true)
as
select
  m.id,
  m.document_id,
  m.revision_number,

  m.company_id,
  c.name              as company_name,
  c.external_id       as company_external_id,

  m.customer_number,
  m.contact_company,

  m.support_group_id,
  sg.name             as support_group_name,

  m.site_id,
  s.name              as site_name,

  m.product_category_id,
  p.tier1             as product_tier1,
  p.tier2             as product_tier2,
  p.tier3             as product_tier3,
  p.product_name,

  m.service_id,
  sv.category         as service_category,
  sv.sub_category     as service_sub_category,
  sv.component        as service_component,
  sv.component_mpss   as service_component_mpss,

  m.start_date,
  m.end_date,
  m.signed_date,

  m.rollup_performance,
  m.tiered_type,

  m.bh_critical,
  bh1.label           as bh_critical_label,
  m.bh_high,
  bh2.label           as bh_high_label,
  m.bh_medium,
  bh3.label           as bh_medium_label,
  m.bh_low,
  bh4.label           as bh_low_label,

  m.mttr_mode,
  m.mtt_respond_critical,
  m.mtt_resolve_critical,
  m.mtt_respond_high,
  m.mtt_resolve_high,
  m.mtt_respond_medium,
  m.mtt_resolve_medium,
  m.mtt_respond_low,
  m.mtt_resolve_low,

  m.cluster_id,
  cl.name             as cluster_name,

  m.vendor_group,
  m.exclude_m7,
  m.status,
  m.is_current,

  m.created_by,
  m.created_at,
  m.updated_at,

  r.action            as revision_action,
  r.effective_from,
  r.effective_to

from public.metrics m
  left join public.companies           c    on c.id  = m.company_id
  left join public.support_groups      sg   on sg.id = m.support_group_id
  left join public.sites               s    on s.id  = m.site_id
  left join public.product_categories  p    on p.id  = m.product_category_id
  left join public.services            sv   on sv.id = m.service_id
  left join public.business_hours      bh1  on bh1.id = m.bh_critical
  left join public.business_hours      bh2  on bh2.id = m.bh_high
  left join public.business_hours      bh3  on bh3.id = m.bh_medium
  left join public.business_hours      bh4  on bh4.id = m.bh_low
  left join public.clusters            cl   on cl.id = m.cluster_id
  left join lateral (
    select action, effective_from, effective_to
    from public.metric_revisions
    where metric_id = m.id
    order by performed_at desc
    limit 1
  ) r on true;

grant select on public.v_metrics_full to authenticated;

-- =========================================================================
-- Soft delete: set status='terminated', is_current=false, log a revision
-- =========================================================================

create or replace function public.soft_delete_metric(p_metric_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin() then
    raise exception 'Only administrators can delete metrics';
  end if;

  update public.metrics
  set status = 'terminated',
      is_current = false,
      updated_at = now()
  where id = p_metric_id and status <> 'terminated';

  if not found then
    raise exception 'Metric not found or already terminated';
  end if;

  insert into public.metric_revisions (metric_id, action, performed_by)
  values (p_metric_id, 'Terminate', v_user_id);
end;
$$;

grant execute on function public.soft_delete_metric(uuid) to authenticated;