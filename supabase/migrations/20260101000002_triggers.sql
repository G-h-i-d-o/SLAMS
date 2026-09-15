-- =========================================================================
-- Auto-create profile on signup
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- Generic audit trigger
-- =========================================================================
create or replace function public.audit_change()
returns trigger language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_email   citext;
begin
  if v_user_id is not null then
    select email into v_email from public.profiles where id = v_user_id;
  end if;

  if tg_op = 'INSERT' then
    insert into public.audit_log (user_id, user_email, table_name, record_id, action, new_data)
    values (v_user_id, v_email, tg_table_name, new.id, 'insert', to_jsonb(new));
    return new;

  elsif tg_op = 'UPDATE' then
    insert into public.audit_log (user_id, user_email, table_name, record_id, action, old_data, new_data)
    values (v_user_id, v_email, tg_table_name, new.id, 'update', to_jsonb(old), to_jsonb(new));
    return new;

  elsif tg_op = 'DELETE' then
    insert into public.audit_log (user_id, user_email, table_name, record_id, action, old_data)
    values (v_user_id, v_email, tg_table_name, old.id, 'delete', to_jsonb(old));
    return old;
  end if;

  return null;
end; $$;

do $$
declare t text;
begin
  foreach t in array array[
    'companies','support_organizations','support_groups','sites',
    'product_categories','services','business_hours','clusters',
    'mttr_presets','metrics','metric_revisions'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_change();',
      'trg_audit_' || t, t
    );
  end loop;
end $$;
