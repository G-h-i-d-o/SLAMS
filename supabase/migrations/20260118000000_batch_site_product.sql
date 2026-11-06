-- =========================================================================
-- Batch uniqueness now accounts for site + product dimensions
--
-- Old: (batch_id, support_group_id, service_id) unique
-- New: (batch_id, support_group_id, service_id, site_id, product_category_id)
--      unique — treats NULLs as equal so (NULL site, NULL product) doesn't
--      collide with itself.
-- =========================================================================

drop index if exists public.metrics_batch_member_unique;

create unique index metrics_batch_member_unique
  on public.metrics (
    batch_id,
    support_group_id,
    service_id,
    COALESCE(site_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(product_category_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where is_current and batch_id is not null;