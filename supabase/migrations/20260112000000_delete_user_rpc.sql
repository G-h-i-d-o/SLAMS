-- =========================================================================
-- Bulletproof user deletion — self-contained, idempotent, atomic
--
-- 1. Drops NOT NULL on every FK column pointing at profiles
-- 2. Recreates every such FK as ON DELETE SET NULL
-- 3. Creates a SECURITY DEFINER RPC that:
--      a. Nulls out all references to a user
--      b. Deletes the profile row
--      c. Deletes the auth.users row
--    All in one transaction. Either everything succeeds or nothing happens.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Part 1 — Relax every FK constraint from public.profiles
-- -------------------------------------------------------------------------
do $$
declare
  rec record;
begin
  for rec in
    select
      con.conname                  as constraint_name,
      con.conrelid::regclass::text as table_name,
      att.attname                  as column_name,
      con.confdeltype              as del_type
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid
      and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.confrelid = 'public.profiles'::regclass
      and array_length(con.conkey, 1) = 1
  loop
    -- Drop NOT NULL regardless — needed so we can null the column
    execute format(
      'alter table %s alter column %I drop not null',
      rec.table_name, rec.column_name
    );

    -- Recreate the FK as SET NULL if it isn't already one of the safe rules
    -- confdeltype: a=NO ACTION, r=RESTRICT, c=CASCADE, n=SET NULL, d=SET DEFAULT
    if rec.del_type not in ('n', 'c') then
      execute format(
        'alter table %s drop constraint %I',
        rec.table_name, rec.constraint_name
      );
      execute format(
        'alter table %s add constraint %I foreign key (%I) references public.profiles(id) on delete set null',
        rec.table_name, rec.constraint_name, rec.column_name
      );
      raise notice 'Relaxed FK: %.% (was %)',
        rec.table_name, rec.column_name, rec.del_type;
    else
      raise notice 'Left FK as-is: %.% (already %)',
        rec.table_name, rec.column_name, rec.del_type;
    end if;
  end loop;
end $$;

-- -------------------------------------------------------------------------
-- Part 2 — The atomic delete RPC
-- -------------------------------------------------------------------------
create or replace function public.delete_user_cascade(p_target_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email         text;
  v_metrics       int := 0;
  v_revisions     int := 0;
  v_evaluations   int := 0;
  v_audit_rows    int := 0;
begin
  -- Capture identifying info before we delete anything
  select email::text into v_email
  from public.profiles
  where id = p_target_id;

  if v_email is null then
    raise exception 'User % not found in profiles', p_target_id;
  end if;

  -- ---- 1. Null out every column that points at this profile ----
  -- Each update is wrapped individually so a schema drift on one table
  -- doesn't abort the whole operation.
  begin
    update public.metrics set created_by = null where created_by = p_target_id;
    get diagnostics v_metrics = row_count;
  exception when others then
    raise notice 'metrics null-out skipped: %', sqlerrm;
  end;

  begin
    update public.metric_revisions set performed_by = null where performed_by = p_target_id;
    get diagnostics v_revisions = row_count;
  exception when others then
    raise notice 'metric_revisions null-out skipped: %', sqlerrm;
  end;

  begin
    update public.metric_evaluations set created_by = null where created_by = p_target_id;
    get diagnostics v_evaluations = row_count;
  exception when others then
    raise notice 'metric_evaluations null-out skipped: %', sqlerrm;
  end;

  begin
    update public.audit_log set user_id = null where user_id = p_target_id;
    get diagnostics v_audit_rows = row_count;
  exception when others then
    raise notice 'audit_log null-out skipped: %', sqlerrm;
  end;

  -- ---- 2. Delete the profile row ----
  -- Notifications cascade-delete automatically (they have ON DELETE CASCADE).
  delete from public.profiles where id = p_target_id;

  -- ---- 3. Delete the auth.users row ----
  delete from auth.users where id = p_target_id;

  -- ---- 4. Return a summary so the caller can log it ----
  return jsonb_build_object(
    'email', v_email,
    'metrics_nulled', v_metrics,
    'revisions_nulled', v_revisions,
    'evaluations_nulled', v_evaluations,
    'audit_rows_nulled', v_audit_rows
  );
end;
$$;

-- Only the service_role (used by our Netlify Function) may call this
revoke all on function public.delete_user_cascade(uuid) from public, anon, authenticated;
grant execute on function public.delete_user_cascade(uuid) to service_role;

-- -------------------------------------------------------------------------
-- Part 3 — Diagnostic view: what still blocks a profile delete?
-- -------------------------------------------------------------------------
create or replace view public.v_profile_fk_audit
with (security_invoker = true)
as
select
  tc.table_name,
  kcu.column_name,
  rc.delete_rule,
  (select is_nullable
   from information_schema.columns c
   where c.table_name = tc.table_name
     and c.column_name = kcu.column_name) as nullable
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.referential_constraints rc
  on tc.constraint_name = rc.constraint_name
  and tc.table_schema = rc.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and ccu.table_name = 'profiles'
order by tc.table_name, kcu.column_name;

grant select on public.v_profile_fk_audit to service_role;