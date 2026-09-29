-- =========================================================================
-- Audit log rebuild
--
-- Fixes:
--   1. Trigger failed silently when the audit insert hit an RLS policy
--      or a constraint violation — parent op would continue unlogged.
--   2. Several tables never got the trigger attached.
--   3. service_role calls had no actor context, so entries looked anonymous.
--
-- Strategy:
--   - Central log_audit() function that never fails the parent op.
--   - Generic audit_change() trigger calls log_audit() for every row.
--   - Explicit RPC for service_role operations to capture the real actor.
-- =========================================================================

-- 1. Add a source column so we can tell trigger entries from RPC entries
alter table public.audit_log
  add column if not exists source text not null default 'trigger';

alter table public.audit_log
  drop constraint if exists audit_log_source_check;

alter table public.audit_log
  add constraint audit_log_source_check
    check (source in ('trigger', 'rpc', 'manual'));

create index if not exists audit_log_source_idx
  on public.audit_log (source);

create index if not exists audit_log_created_at_idx
  on public.audit_log (created_at desc);

-- 2. Central log function — never raises, always returns cleanly
create or replace function public.log_audit(
  p_user_id    uuid,
  p_user_email text,
  p_table_name text,
  p_record_id  uuid,
  p_action     text,
  p_old_data   jsonb,
  p_new_data   jsonb,
  p_source     text default 'trigger'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audit_id uuid;
  v_email    text;
  v_user_id  uuid;
begin
  v_user_id := coalesce(p_user_id, auth.uid());

  if p_user_email is not null then
    v_email := p_user_email;
  elsif v_user_id is not null then
    begin
      select email::text into v_email
      from public.profiles
      where id = v_user_id;
    exception when others then
      v_email := null;
    end;
  end if;

  insert into public.audit_log (
    user_id, user_email, table_name, record_id, action,
    old_data, new_data, source
  ) values (
    v_user_id, v_email, p_table_name, p_record_id, p_action,
    p_old_data, p_new_data, p_source
  ) returning id into v_audit_id;

  return v_audit_id;
exception
  when others then
    -- Never fail the parent operation. Warn in Postgres log instead.
    raise warning '[log_audit] failed: % (table=%, action=%, record=%)',
      sqlerrm, p_table_name, p_action, p_record_id;
    return null;
end;
$$;

grant execute on function public.log_audit(uuid, text, text, uuid, text, jsonb, jsonb, text) to authenticated;
grant execute on function public.log_audit(uuid, text, text, uuid, text, jsonb, jsonb, text) to service_role;

-- 3. Generic trigger function
create or replace function public.audit_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id uuid;
begin
  if tg_op = 'DELETE' then
    v_record_id := (old).id;
    perform public.log_audit(
      null, null, tg_table_name, v_record_id, 'delete',
      to_jsonb(old), null, 'trigger'
    );
    return old;
  elsif tg_op = 'UPDATE' then
    v_record_id := (new).id;
    perform public.log_audit(
      null, null, tg_table_name, v_record_id, 'update',
      to_jsonb(old), to_jsonb(new), 'trigger'
    );
    return new;
  else
    v_record_id := (new).id;
    perform public.log_audit(
      null, null, tg_table_name, v_record_id, 'insert',
      null, to_jsonb(new), 'trigger'
    );
    return new;
  end if;
end;
$$;

-- 4. Attach the trigger to every business table — including the ones that
--    were missed during earlier phases.
do $$
declare
  t text;
  tables text[] := array[
    'companies',
    'support_group_companies',
    'support_organizations',
    'support_groups',
    'sites',
    'product_categories',
    'services',
    'business_hours',
    'clusters',
    'mttr_presets',
    'metrics',
    'metric_revisions',
    'metric_evaluations'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_audit_%s on public.%I', t, t);
    execute format(
      'create trigger trg_audit_%s after insert or update or delete on public.%I for each row execute function public.audit_change()',
      t, t
    );
    raise notice 'Attached audit trigger on %', t;
  end loop;
end $$;

-- 5. RPC for Netlify Functions — captures the real actor even from
--    service_role context (which has no auth.uid()).
create or replace function public.log_user_action(
  p_admin_id  uuid,
  p_target_id uuid,
  p_action    text,
  p_old_data  jsonb,
  p_new_data  jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.log_audit(
    p_admin_id,
    null,
    'profiles',
    p_target_id,
    p_action,
    p_old_data,
    p_new_data,
    'rpc'
  );
end;
$$;

grant execute on function public.log_user_action(uuid, uuid, text, jsonb, jsonb) to authenticated;
grant execute on function public.log_user_action(uuid, uuid, text, jsonb, jsonb) to service_role;

-- 6. RPC for admin role changes from the frontend
create or replace function public.admin_change_role(
  p_target_id uuid,
  p_new_role  text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_role text;
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_new_role not in ('admin','editor','user') then
    raise exception 'Invalid role';
  end if;

  if p_target_id = v_actor_id then
    raise exception 'You cannot change your own role';
  end if;

  select role into v_old_role
  from public.profiles
  where id = p_target_id;

  if not found then
    raise exception 'User not found';
  end if;

  update public.profiles
  set role = p_new_role
  where id = p_target_id;

  perform public.log_audit(
    v_actor_id,
    null,
    'profiles',
    p_target_id,
    'role-changed',
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', p_new_role),
    'rpc'
  );
end;
$$;

grant execute on function public.admin_change_role(uuid, text) to authenticated;