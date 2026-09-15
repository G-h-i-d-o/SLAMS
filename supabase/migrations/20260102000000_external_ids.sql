-- =========================================================================
-- Auto-generated external IDs
-- =========================================================================

create or replace function public.gen_external_id(prefix text)
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  suffix   text := '';
  i        int;
begin
  for i in 1..5 loop
    suffix := suffix || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
  end loop;
  return prefix || '-' || suffix;
end;
$$;

alter table public.companies            alter column external_id set default public.gen_external_id('COMP');
alter table public.support_organizations alter column external_id set default public.gen_external_id('SO');
alter table public.support_groups       alter column external_id set default public.gen_external_id('SGR');
alter table public.sites                alter column external_id set default public.gen_external_id('SITE');
alter table public.product_categories   alter column external_id set default public.gen_external_id('PC');
alter table public.services             alter column external_id set default public.gen_external_id('SV');
alter table public.business_hours       alter column external_id set default public.gen_external_id('BH');
alter table public.clusters             alter column external_id set default public.gen_external_id('CL');