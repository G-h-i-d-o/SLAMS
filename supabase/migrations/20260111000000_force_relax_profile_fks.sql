-- =========================================================================
-- Force-relax every FK pointing at public.profiles so deleting a user works.
-- Uses dynamic SQL to find constraints by target table, not by name.
-- Idempotent — safe to run multiple times.
-- =========================================================================

do $$
declare
  rec record;
begin
  for rec in
    select
      con.conname                  as constraint_name,
      con.conrelid::regclass::text as table_name,
      att.attname                  as column_name
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid
      and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.confrelid = 'public.profiles'::regclass
      and array_length(con.conkey, 1) = 1
  loop
    execute format(
      'alter table %s alter column %I drop not null',
      rec.table_name, rec.column_name
    );
    execute format(
      'alter table %s drop constraint %I',
      rec.table_name, rec.constraint_name
    );
    execute format(
      'alter table %s add constraint %I foreign key (%I) references public.profiles(id) on delete set null',
      rec.table_name, rec.constraint_name, rec.column_name
    );
    raise notice 'Fixed FK: %.%', rec.table_name, rec.column_name;
  end loop;
end $$;