-- =========================================================================
-- Metric batch tracking
--
-- 1. Add batch_id to metrics
-- 2. Relax the current-document unique index so members of the same batch
--    can share a document_id
-- 3. Update create_metric to accept batch_id
-- 4. Rebuild v_metrics_full + v_dashboard_recent to expose batch_id
-- =========================================================================

-- ---- 1. Add batch_id ------------------------------------------------
alter table public.metrics
  add column if not exists batch_id uuid;

create index if not exists metrics_batch_id_idx
  on public.metrics (batch_id) where batch_id is not null;

-- ---- 2. Relax the unique index --------------------------------------
-- Old: one active metric per document_id, period.
-- New: one active metric per document_id UNLESS it's part of a batch.
--      Batch members share the same document_id, and their uniqueness
--      is enforced by (document_id, support_group_id, service_id).
drop index if exists public.metrics_current_document;

create unique index if not exists metrics_current_document
  on public.metrics (document_id)
  where is_current and batch_id is null;

create unique index if not exists metrics_batch_member_unique
  on public.metrics (batch_id, support_group_id, service_id)
  where is_current and batch_id is not null;

-- ---- 3. Rebuild create_metric to accept batch_id --------------------
create or replace function public.create_metric(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_metric_id uuid;
  v_user_id   uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.metrics (
    document_id, company_id, customer_number, contact_company,
    support_group_id, site_id, product_category_id, service_id,
    start_date, end_date, signed_date,
    rollup_performance, tiered_type,
    bh_critical, bh_high, bh_medium, bh_low,
    mttr_mode,
    mtt_respond_critical, mtt_resolve_critical,
    mtt_respond_high, mtt_resolve_high,
    mtt_respond_medium, mtt_resolve_medium,
    mtt_respond_low, mtt_resolve_low,
    cluster_id, vendor_group, exclude_m7,
    status, is_current, created_by,
    batch_id
  )
  values (
    payload->>'document_id',
    (payload->>'company_id')::uuid,
    payload->>'customer_number',
    payload->>'contact_company',
    (payload->>'support_group_id')::uuid,
    nullif(payload->>'site_id','')::uuid,
    nullif(payload->>'product_category_id','')::uuid,
    (payload->>'service_id')::uuid,
    (payload->>'start_date')::date,
    (payload->>'end_date')::date,
    (payload->>'signed_date')::date,
    (payload->>'rollup_performance')::numeric,
    payload->>'tiered_type',
    (payload->>'bh_critical')::uuid,
    (payload->>'bh_high')::uuid,
    (payload->>'bh_medium')::uuid,
    (payload->>'bh_low')::uuid,
    payload->>'mttr_mode',
    nullif(payload->>'mtt_respond_critical','')::int,
    nullif(upper(payload->>'mtt_resolve_critical'),''),
    nullif(payload->>'mtt_respond_high','')::int,
    nullif(upper(payload->>'mtt_resolve_high'),''),
    nullif(payload->>'mtt_respond_medium','')::int,
    nullif(upper(payload->>'mtt_resolve_medium'),''),
    nullif(payload->>'mtt_respond_low','')::int,
    nullif(upper(payload->>'mtt_resolve_low'),''),
    (payload->>'cluster_id')::uuid,
    nullif(payload->>'vendor_group',''),
    coalesce((payload->>'exclude_m7')::boolean, false),
    'active',
    true,
    v_user_id,
    nullif(payload->>'batch_id','')::uuid
  )
  returning id into v_metric_id;

  insert into public.metric_revisions (
    metric_id, action, effective_from, effective_to, signed_date, performed_by
  )
  values (
    v_metric_id,
    payload->>'action',
    (payload->>'start_date')::date,
    (payload->>'end_date')::date,
    (payload->>'signed_date')::date,
    v_user_id
  );

  return v_metric_id;
end;
$$;

grant execute on function public.create_metric(jsonb) to authenticated;

-- ---- 4. Drop the view chain (dependent first), then rebuild ---------
drop view if exists public.v_dashboard_recent;
drop view if exists public.v_metrics_full;

create view public.v_metrics_full
with (security_invoker = true)
as
select
  m.id,
  m.document_id,
  m.revision_number,
  m.batch_id,
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

create view public.v_dashboard_recent
with (security_invoker = true)
as
select
  id,
  document_id,
  company_name,
  support_group_name,
  status,
  mttr_mode,
  created_at,
  updated_at
from public.v_metrics_full
order by updated_at desc
limit 10;

grant select on public.v_dashboard_recent to authenticated;