-- =========================================================================
-- Phase 7 — Metric evaluations (mock for now, CSV later) + notifications
-- =========================================================================

create table public.metric_evaluations (
  id                  uuid primary key default gen_random_uuid(),
  metric_id           uuid not null references public.metrics(id) on delete cascade,
  priority            text not null check (priority in ('critical','high','medium','low')),
  period_start        date not null,
  period_end          date not null,
  actual_respond_min  numeric(10,2),
  actual_resolve_min  numeric(10,2),
  source              text not null default 'manual'
                        check (source in ('mock','manual','csv','itsm')),
  breached_respond    boolean not null default false,
  breached_resolve    boolean not null default false,
  breach_reasons      text[] not null default '{}',
  notes               text,
  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now()
);

create index on public.metric_evaluations (metric_id);
create index on public.metric_evaluations (period_start desc);
create index on public.metric_evaluations (source);

-- =========================================================================
-- Breach computation — fires on every insert/update of an evaluation
-- =========================================================================
create or replace function public.compute_breach()
returns trigger language plpgsql as $$
declare
  m record;
  respond_target int;
  resolve_target text;
  reasons text[] := array[]::text[];
begin
  select * into m from public.metrics where id = new.metric_id;
  if not found then return new; end if;

  respond_target := case new.priority
    when 'critical' then m.mtt_respond_critical
    when 'high' then m.mtt_respond_high
    when 'medium' then m.mtt_respond_medium
    when 'low' then m.mtt_respond_low
  end;

  resolve_target := case new.priority
    when 'critical' then m.mtt_resolve_critical
    when 'high' then m.mtt_resolve_high
    when 'medium' then m.mtt_resolve_medium
    when 'low' then m.mtt_resolve_low
  end;

  new.breached_respond := respond_target is not null
    and new.actual_respond_min is not null
    and new.actual_respond_min > respond_target;

  if resolve_target is null or upper(resolve_target) = 'TD' or new.actual_resolve_min is null then
    new.breached_resolve := false;
  else
    new.breached_resolve := new.actual_resolve_min > resolve_target::numeric;
  end if;

  if new.breached_respond then
    reasons := array_append(reasons,
      'Respond ' || new.priority || ': ' || new.actual_respond_min || ' > ' || respond_target || ' min');
  end if;
  if new.breached_resolve then
    reasons := array_append(reasons,
      'Resolve ' || new.priority || ': ' || new.actual_resolve_min || ' > ' || resolve_target || ' min');
  end if;

  new.breach_reasons := reasons;
  return new;
end; $$;

create trigger trg_metric_eval_breach
  before insert or update on public.metric_evaluations
  for each row execute function public.compute_breach();

-- =========================================================================
-- Notifications table
-- =========================================================================
create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  kind           text not null check (kind in ('breach','system','info')),
  title          text not null,
  body           text,
  metric_id      uuid references public.metrics(id) on delete cascade,
  evaluation_id  uuid references public.metric_evaluations(id) on delete cascade,
  is_read        boolean not null default false,
  created_at     timestamptz not null default now()
);

create index on public.notifications (user_id, is_read, created_at desc);

-- =========================================================================
-- Fan out a notification to every admin on breach insert
-- =========================================================================
create or replace function public.fanout_breach_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user record;
  m record;
begin
  if not (new.breached_respond or new.breached_resolve) then
    return new;
  end if;

  select id, document_id into m from public.metrics where id = new.metric_id;
  if not found then return new; end if;

  for v_user in
    select id from public.profiles where role = 'admin' and is_active = true
  loop
    insert into public.notifications (user_id, kind, title, body, metric_id, evaluation_id)
    values (
      v_user.id,
      'breach',
      'SLA breach: ' || m.document_id,
      array_to_string(new.breach_reasons, ' · '),
      new.metric_id,
      new.id
    );
  end loop;

  return new;
end; $$;

create trigger trg_fanout_breach
  after insert on public.metric_evaluations
  for each row execute function public.fanout_breach_notification();

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.metric_evaluations enable row level security;
alter table public.notifications        enable row level security;

create policy "metric_evaluations_read" on public.metric_evaluations
  for select to authenticated using (true);

create policy "metric_evaluations_write" on public.metric_evaluations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "notifications_self_read" on public.notifications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "notifications_self_update" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- View: aggregate breach stats per metric (for the History page)
-- =========================================================================
create or replace view public.v_metrics_breach_summary
with (security_invoker = true)
as
select
  metric_id,
  count(*)                                        as total_evals,
  count(*) filter (where breached_respond or breached_resolve) as breaches,
  round(
    case when count(*) > 0
      then (count(*) filter (where breached_respond or breached_resolve))::numeric
           / count(*) * 100
      else 0
    end, 1
  )                                               as breach_pct,
  max(period_end)                                 as last_evaluated
from public.metric_evaluations
group by metric_id;

grant select on public.v_metrics_breach_summary to authenticated;