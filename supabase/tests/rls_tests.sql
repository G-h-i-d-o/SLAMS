-- =========================================================================
-- RLS Test Suite
--
-- Run in Supabase SQL Editor (paste the whole thing and click Run).
-- Every test prints PASS via RAISE NOTICE, or raises an EXCEPTION on FAIL.
-- The final ROLLBACK undoes all setup — nothing is left behind.
-- =========================================================================

begin;

-- ---- Setup: create test users -------------------------------------------
do $$
declare
  v_admin_id  uuid := '00000000-0000-0000-0000-0000000000a1';
  v_editor_id uuid := '00000000-0000-0000-0000-0000000000e1';
  v_user_id   uuid := '00000000-0000-0000-0000-0000000000b1';
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    (v_admin_id,  'rls-admin@test.local',  'x', now(), now(), now()),
    (v_editor_id, 'rls-editor@test.local', 'x', now(), now(), now()),
    (v_user_id,   'rls-user@test.local',   'x', now(), now(), now())
  on conflict (id) do nothing;

  update public.profiles set role = 'admin',  is_active = true where id = v_admin_id;
  update public.profiles set role = 'editor', is_active = true where id = v_editor_id;
  update public.profiles set role = 'user',   is_active = true where id = v_user_id;
end $$;

-- ---- Test 1: anon can read companies ------------------------------------
do $$
declare v_count int;
begin
  set local role anon;
  set local request.jwt.claims = '{"role":"anon"}';
  select count(*) into v_count from public.companies;
  reset role;
  raise notice 'PASS 1: anon can read companies (% rows)', v_count;
end $$;

-- ---- Test 2: anon cannot insert into companies --------------------------
do $$
begin
  set local role anon;
  set local request.jwt.claims = '{"role":"anon"}';
  begin
    insert into public.companies (external_id, name) values ('RLS-ANON-TEST', 'Anon');
    raise exception 'FAIL 2: anon was allowed to insert';
  exception
    when insufficient_privilege then
      raise notice 'PASS 2: anon cannot insert into companies';
    when others then
      if sqlerrm like '%row-level security%' then
        raise notice 'PASS 2: anon cannot insert into companies (RLS)';
      else
        raise;
      end if;
  end;
  reset role;
end $$;

-- ---- Test 3: user can read companies ------------------------------------
do $$
declare v_count int;
begin
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
  select count(*) into v_count from public.companies;
  reset role;
  raise notice 'PASS 3: user can read companies (% rows)', v_count;
end $$;

-- ---- Test 4: user cannot insert into companies --------------------------
do $$
begin
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
  begin
    insert into public.companies (external_id, name) values ('RLS-USER-TEST', 'User');
    raise exception 'FAIL 4: user was allowed to insert into companies';
  exception
    when insufficient_privilege then
      raise notice 'PASS 4: user cannot insert into companies';
    when others then
      if sqlerrm like '%row-level security%' then
        raise notice 'PASS 4: user cannot insert into companies (RLS)';
      else
        raise;
      end if;
  end;
  reset role;
end $$;

-- ---- Test 5: editor CAN insert into companies ---------------------------
do $$
declare v_id uuid;
begin
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
  insert into public.companies (external_id, name) values ('RLS-EDITOR-OK', 'Editor Try')
  returning id into v_id;
  reset role;
  if v_id is null then raise exception 'FAIL 5: editor insert returned no id'; end if;
  raise notice 'PASS 5: editor can insert into companies';
end $$;

-- ---- Test 6: editor cannot manage users ---------------------------------
do $$
begin
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
  begin
    insert into public.profiles (id, email, role)
    values ('00000000-0000-0000-0000-0000000000f9', 'fake@test.local', 'user');
    raise exception 'FAIL 6: editor was allowed to insert into profiles';
  exception
    when insufficient_privilege then
      raise notice 'PASS 6: editor cannot insert into profiles';
    when others then
      if sqlerrm like '%row-level security%' then
        raise notice 'PASS 6: editor cannot insert into profiles (RLS)';
      else
        raise;
      end if;
  end;
  reset role;
end $$;

-- ---- Test 7: admin CAN insert into companies ----------------------------
do $$
declare v_id uuid;
begin
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
  insert into public.companies (external_id, name) values ('RLS-ADMIN-OK', 'Admin Try')
  returning id into v_id;
  reset role;
  if v_id is null then raise exception 'FAIL 7: admin insert returned no id'; end if;
  raise notice 'PASS 7: admin can insert into companies';
end $$;

-- ---- Test 8: user cannot read audit_log ---------------------------------
do $$
declare v_count int;
begin
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
  select count(*) into v_count from public.audit_log;
  reset role;
  if v_count <> 0 then
    raise exception 'FAIL 8: user saw % audit_log rows', v_count;
  end if;
  raise notice 'PASS 8: user cannot read audit_log';
end $$;

-- ---- Test 9: notifications are per-user ---------------------------------
do $$
declare
  v_admin_id uuid := '00000000-0000-0000-0000-0000000000a1';
  v_user_id  uuid := '00000000-0000-0000-0000-0000000000b1';
  v_visible  int;
begin
  insert into public.notifications (user_id, kind, title)
  values
    (v_admin_id, 'info', 'Admin notification'),
    (v_user_id,  'info', 'User notification');

  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
  select count(*) into v_visible from public.notifications;
  reset role;

  if v_visible <> 1 then
    raise exception 'FAIL 9: user saw % notifications, expected 1', v_visible;
  end if;
  raise notice 'PASS 9: user sees only their own notifications';
end $$;

-- ---- Test 10: user cannot change role via profiles update ---------------
do $$
begin
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
  begin
    update public.profiles
    set role = 'admin'
    where id = '00000000-0000-0000-0000-0000000000b1';
    raise exception 'FAIL 10: user was allowed to escalate role';
  exception
    when others then
      if sqlerrm like '%Only administrators%' or sqlerrm like '%row-level security%' then
        raise notice 'PASS 10: role escalation blocked';
      else
        raise;
      end if;
  end;
  reset role;
end $$;

rollback;