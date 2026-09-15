-- =========================================================================
-- Add INSERT + UPDATE policies for import_jobs so admins can track imports
-- =========================================================================

create policy "import_jobs_insert" on public.import_jobs
  for insert to authenticated
  with check (public.is_admin());

create policy "import_jobs_update" on public.import_jobs
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());