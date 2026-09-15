-- =========================================================================
-- Seed reference data (idempotent)
-- =========================================================================

insert into public.support_organizations (external_id, name) values
  ('SO-001', 'Global Services'),
  ('SO-002', 'Engineering'),
  ('SO-003', 'Security Operations')
on conflict (external_id) do nothing;

insert into public.companies (external_id, customer_number, name) values
  ('COMP-3526', '3526', 'NAT Dept of Women, Youth and Persons with Disabilities'),
  ('COMP-4102', '4102', 'Acme Cloud Services'),
  ('COMP-3801', '3801', 'Vertex Financial'),
  ('COMP-4210', '4210', 'Helios Retail Group'),
  ('COMP-3955', '3955', 'Orbit Telecom'),
  ('COMP-3678', '3678', 'Lumen Health')
on conflict (external_id) do nothing;

insert into public.support_groups (external_id, support_organization_id, name)
select 'SGR-A1B2C', id, 'Tier 1 Service Desk'            from public.support_organizations where external_id = 'SO-001'
union all
select 'SGR-D3E4F', id, 'Tier 2 Application Support'     from public.support_organizations where external_id = 'SO-001'
union all
select 'SGR-G5H6I', id, 'Tier 3 Escalations'             from public.support_organizations where external_id = 'SO-002'
union all
select 'SGR-J7K8L', id, 'Network Operations (NOC)'       from public.support_organizations where external_id = 'SO-002'
union all
select 'SGR-M9N0P', id, 'Database Engineering'           from public.support_organizations where external_id = 'SO-002'
union all
select 'SGR-Q1R2S', id, 'Security Response'              from public.support_organizations where external_id = 'SO-003'
on conflict (external_id) do nothing;

insert into public.sites (external_id, company_id, name)
select 'SITE-X1Y2Z', id, 'Head Office'                     from public.companies where external_id = 'COMP-3526'
union all
select 'SITE-A3B4C', id, 'Branch A — Pretoria'             from public.companies where external_id = 'COMP-3526'
union all
select 'SITE-D5E6F', id, 'Branch B — Cape Town'            from public.companies where external_id = 'COMP-3526'
union all
select 'SITE-G7H8I', id, 'Data Center 1 — Sandton'         from public.companies where external_id = 'COMP-4102'
union all
select 'SITE-J9K0L', id, 'Data Center 2 — Midrand'         from public.companies where external_id = 'COMP-4102'
union all
select 'SITE-M1N2O', id, 'HQ — Rosebank'                   from public.companies where external_id = 'COMP-3801'
union all
select 'SITE-P3Q4R', id, 'Distribution Center'             from public.companies where external_id = 'COMP-4210'
union all
select 'SITE-S5T6U', id, 'Network POP'                     from public.companies where external_id = 'COMP-3955'
on conflict (external_id) do nothing;

insert into public.product_categories (external_id, company_id, tier1, tier2, tier3, product_name) values
  ('PC-V7W8X', null, 'Infrastructure', 'Compute', 'Virtual Machines', 'VM-Standard'),
  ('PC-Y9Z0A', null, 'Infrastructure', 'Compute', 'Virtual Machines', 'VM-Premium'),
  ('PC-B1C2D', null, 'Infrastructure', 'Storage', 'Object Storage',   'S3-Standard'),
  ('PC-E3F4G', null, 'Network',        'WAN',     'MPLS',             'MPLS-100Mbps'),
  ('PC-H5I6J', null, 'Network',        'LAN',     'Switches',         'Switch-Enterprise'),
  ('PC-N9O0P', null, 'Applications',   'ERP',     'Finance',          'ERP-Finance')
on conflict (external_id) do nothing;

insert into public.product_categories (external_id, company_id, tier1, tier2, tier3, product_name)
select 'PC-K7L8M', id, 'End-User', 'Desktop', 'Standard', 'Desktop-Pro'
from public.companies where external_id = 'COMP-3526'
on conflict (external_id) do nothing;

insert into public.services (external_id, category, sub_category, component) values
  ('SV-Q1R2S','LAN & Desktop Support Services','LAN & Desktop Support Services','Cabling Maintenance Quotation'),
  ('SV-T3U4V','LAN & Desktop Support Services','LAN & Desktop Support Services','Cabling Maintenance break/fix'),
  ('SV-W5X6Y','LAN & Desktop Support Services','LAN & Desktop Support Services','Time and Material Services'),
  ('SV-Z7A8B','LAN & Desktop Support Services','LAN & Desktop Support Services','Implementation Services'),
  ('SV-C9D0E','Network Switches','Network Switches','Switch Support Incidents'),
  ('SV-F1G2H','Network Switches','Network Switches','Switch Support Request'),
  ('SV-I3J4K','Network Switches','Network Switches','Hardware Maintenance Quotation'),
  ('SV-L5M6N','Network Switches','Network Switches','Hardware Maintenance Break/Fix'),
  ('SV-O7P8Q','Network Switches','Network Switches','Time And Material Services'),
  ('SV-R9S0T','Network Switches','Network Switches','Implementation Services')
on conflict (external_id) do nothing;

insert into public.business_hours (external_id, label, schedule) values
  ('BH-U1V2W','24 × 7','Mon-Sun 00:00-23:59'),
  ('BH-X3Y4Z','08h00-16h30','Mon-Fri 08:00-16:30'),
  ('BH-A5B6C','Extended 07h00-22h00','Mon-Sat 07:00-22:00')
on conflict (external_id) do nothing;

insert into public.clusters (external_id, company_id, name)
select 'CL-D7E8F', id, 'SPCHD — Social Protection Community and Human Development' from public.companies where external_id = 'COMP-3526'
union all
select 'CL-G9H0I', id, 'GDE — Gauteng Department of Education'                     from public.companies where external_id = 'COMP-3526'
union all
select 'CL-J1K2L', id, 'WC — Western Cape'                                         from public.companies where external_id = 'COMP-3526'
union all
select 'CL-M3N4O', id, 'Acme — Prod Cluster'                                       from public.companies where external_id = 'COMP-4102'
union all
select 'CL-P5Q6R', id, 'Vertex — Trading Cluster'                                  from public.companies where external_id = 'COMP-3801'
on conflict (external_id) do nothing;

insert into public.mttr_presets (name, respond_critical, resolve_critical, respond_high, resolve_high, respond_medium, resolve_medium, respond_low, resolve_low) values
  ('Default P1',     15, 240, 30, 480, 60, 1440, 120, 2880),
  ('Aggressive P1',  10, 120, 20, 240, 45,  720,  90, 1440),
  ('Relaxed',        30, 480, 60, 960, 120, 2880, 240, 5760)
on conflict (name) do nothing;
