-- =========================================================================
-- Seed mock evaluations — 6 months of synthetic data per active metric
-- Idempotent: skips if any evaluations already exist.
-- =========================================================================

do $$
declare
  m record;
  i int;
  v_period date;
  v_priority text;
  v_respond numeric;
  v_resolve numeric;
  priorities text[] := array['critical','high','medium','low'];
begin
  if (select count(*) from public.metrics where status = 'active') = 0 then
    return;
  end if;
  if (select count(*) from public.metric_evaluations) > 0 then
    return;
  end if;

  for m in select id from public.metrics where status = 'active' loop
    for i in 0..5 loop
      v_period := (date_trunc('month', now()) - (i || ' months')::interval)::date;
      v_priority := priorities[floor(random() * 4 + 1)::int];
      -- Actuals roughly in the target range so ~30-40% breach
      v_respond := round((random() * 50 + 5)::numeric, 1);
      v_resolve := round((random() * 700 + 90)::numeric, 1);

      insert into public.metric_evaluations
        (metric_id, priority, period_start, period_end,
         actual_respond_min, actual_resolve_min, source)
      values
        (m.id, v_priority, v_period,
         (v_period + interval '1 month - 1 day')::date,
         v_respond, v_resolve, 'mock');
    end loop;
  end loop;
end $$;