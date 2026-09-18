-- =========================================================================
-- Add Editor role
--   Admin  — full access, including user management
--   Editor — Operations + Configuration write, NO Administration
--   User   — Operations only, Configuration read-only
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Extend the role constraint
-- -------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
    check (role in ('admin','editor','user'));

-- -------------------------------------------------------------------------
-- 2. Helper: is the current user an admin OR editor?
-- -------------------------------------------------------------------------
create or replace function public.is_editor()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','editor') and is_active = true
  );
$$;

-- -------------------------------------------------------------------------
-- 3. Swap config-table write policies from is_admin() to is_editor()
-- -------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'companies','support_organizations','support_groups','sites',
    'product_categories','services','business_hours','clusters','mttr_presets',
    'support_group_companies'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format('drop policy if exists %I on public.%I', t || '_editor_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_editor()) with check (public.is_editor())',
      t || '_editor_write', t
    );
  end loop;
end $$;

-- -------------------------------------------------------------------------
-- 4. Security: prevent non-admins from changing role / active status
--    Fixes a hole where users could escalate their own role via
--    profiles_self_update.
-- -------------------------------------------------------------------------
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer as $$
begin
  if (old.role is distinct from new.role)
     or (old.is_active is distinct from new.is_active)
     or (old.id is distinct from new.id)
  then
    -- auth.uid() is NULL when called via service_role (Netlify Functions).
    -- Only authenticated callers are checked — service_role is trusted.
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only administrators can change role or active status'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();