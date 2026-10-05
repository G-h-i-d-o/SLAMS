-- =========================================================================
-- Guarantee the metrics index state is correct, regardless of history
-- =========================================================================

-- 1. Drop BOTH possible old index names (in case a prior attempt renamed it)
drop index if exists public.metrics_current_document;
drop index if exists public.metrics_document_id_current;

-- 2. Ensure batch_id exists
alter table public.metrics
  add column if not exists batch_id uuid;

-- 3. Recreate the correct indexes
create unique index metrics_current_document
  on public.metrics (document_id)
  where is_current and batch_id is null;

create unique index if not exists metrics_batch_member_unique
  on public.metrics (batch_id, support_group_id, service_id)
  where is_current and batch_id is not null;

create index if not exists metrics_batch_id_idx
  on public.metrics (batch_id) where batch_id is not null;