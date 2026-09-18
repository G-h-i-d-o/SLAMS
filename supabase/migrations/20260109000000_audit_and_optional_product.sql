-- =========================================================================
-- 1. Audit log: safe user deletion + trigger on profiles
-- 2. Product is now optional on metrics
-- =========================================================================

-- ---- 1.1 Fix the FK so deleting a profile doesn't break old audit rows ----
alter table public.audit_log
  drop constraint if exists audit_log_user_id_fkey;

alter table public.audit_log
  add constraint audit_log_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete set null;

-- ---- 1.2 Audit trigger on profiles -------------------------------------
-- Fires on INSERT / UPDATE / DELETE of any profile row.
-- Role changes made from the app therefore end up in the audit log
-- automatically. Operations made via service_role from a Netlify
-- Function have no auth context, so their actor is logged explicitly
-- by the function itself (see admin-toggle-user / admin-delete-user).
drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.audit_change();

-- ---- 2. Product becomes optional ---------------------------------------
alter table public.metrics
  alter column product_category_id drop not null;

-- ---- 3. Update create_metric to accept NULL product --------------------
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
    status, is_current, created_by
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
    v_user_id
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