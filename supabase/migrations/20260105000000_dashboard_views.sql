-- =========================================================================
-- Dashboard views
-- =========================================================================

-- ---- KPI snapshot ---------------------------------------------------------
create or replace view public.v_dashboard_kpis
with (security_invoker = true)
as
with active as (
  select * from public.metrics where status = 'active'
),
complete_count as (
  select count(*) as n
  from active
  where
    case mttr_mode
      when 'respond' then
        mtt_respond_critical is not null and mtt_respond_high is not null
        and mtt_respond_medium is not null and mtt_respond_low is not null
      when 'resolve' then
        mtt_resolve_critical is not null and mtt_resolve_high is not null
        and mtt_resolve_medium is not null and mtt_resolve_low is not null
      when 'both' then
        mtt_respond_critical is not null and mtt_respond_high is not null
        and mtt_respond_medium is not null and mtt_respond_low is not null
        and mtt_resolve_critical is not null and mtt_resolve_high is not null
        and mtt_resolve_medium is not null and mtt_resolve_low is not null
      else false
    end
)
select
  (select count(*) from active)                                              as active_metrics,
  (select count(*) from public.metrics where status = 'terminated')          as terminated_metrics,
  (select count(distinct company_id) from active)                            as companies_served,
  (select count(distinct support_group_id) from active)                      as support_groups_involved,
  (select round(avg(mtt_respond_critical)::numeric, 1)
     from active where mtt_respond_critical is not null)                     as avg_respond_p1,
  (select n from complete_count)                                             as fully_configured;

grant select on public.v_dashboard_kpis to authenticated;

-- ---- Status distribution --------------------------------------------------
create or replace view public.v_dashboard_status
with (security_invoker = true)
as
select status, count(*)::int as count
from public.metrics
group by status;

grant select on public.v_dashboard_status to authenticated;

-- ---- 12-month trend (fill gaps with zero) --------------------------------
create or replace view public.v_dashboard_trend
with (security_invoker = true)
as
with months as (
  select date_trunc('month', now()) - (n || ' months')::interval as month_start
  from generate_series(0, 11) as n
),
counts as (
  select date_trunc('month', created_at) as month_start, count(*)::int as cnt
  from public.metrics
  where created_at >= date_trunc('month', now()) - interval '11 months'
  group by 1
)
select
  to_char(m.month_start, 'YYYY-MM')           as month,
  to_char(m.month_start, 'Mon YYYY')          as label,
  coalesce(c.cnt, 0)                          as count
from months m
left join counts c on c.month_start = m.month_start
order by m.month_start;

grant select on public.v_dashboard_trend to authenticated;

-- ---- Recent activity (last 10 metrics touched) ---------------------------
create or replace view public.v_dashboard_recent
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