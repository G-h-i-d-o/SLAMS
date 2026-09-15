import { supabase } from "../supabase";
import type { ValidatedRow } from "./validate";

export type CommitResult = {
  imported: number;
  skipped: number;
  jobId: string | null;
};

export async function commitImport(
  table: string,
  rows: ValidatedRow[],
  fileName: string
): Promise<CommitResult> {
  const valid = rows.filter((r) => r.errors.length === 0);
  const skipped = rows.length - valid.length;

  // Create a running import job
  const { data: job } = await supabase
    .from("import_jobs")
    .insert({
      source: "manual-upload",
      entity: table,
      status: "running",
      rows_total: rows.length,
    })
    .select()
    .single();

  const jobId = job?.id ?? null;
  const finish = async (status: "success" | "partial" | "failed", imported: number, errors: unknown[] = []) => {
    if (!jobId) return;
    await supabase
      .from("import_jobs")
      .update({
        status,
        rows_imported: imported,
        rows_skipped: skipped,
        errors,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  };

  if (!valid.length) {
    await finish("failed", 0, [{ message: "No valid rows to import" }]);
    return { imported: 0, skipped, jobId };
  }

  // Payload — external_id intentionally omitted so Postgres generates it.
  const payload = valid.map((r) => r.resolved);

  const { error } = await supabase.from(table).insert(payload);
  if (error) {
    await finish("failed", 0, [{ message: error.message, file: fileName }]);
    throw error;
  }

  await finish(skipped === 0 ? "success" : "partial", valid.length);
  return { imported: valid.length, skipped, jobId };
}