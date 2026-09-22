import { supabase } from "../supabase";
import type { ValidatedRow } from "./validate";

export type CommitResult = {
  imported: number;
  skipped: number;
  jobId: string | null;
};

function isDuplicateError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("duplicate key") ||
    m.includes("unique constraint") ||
    m.includes("unique index")
  );
}

export async function commitImport(
  table: string,
  rows: ValidatedRow[],
  fileName: string
): Promise<CommitResult> {
  const valid = rows.filter((r) => r.errors.length === 0);
  const skippedFromValidation = rows.length - valid.length;

  // Create a running import job
  const { data: job, error: jobCreateErr } = await supabase
    .from("import_jobs")
    .insert({
      source: "manual-upload",
      entity: table,
      status: "running",
      rows_total: rows.length,
    })
    .select()
    .single();

  if (jobCreateErr) {
    console.error(
      "[commitImport] Failed to create import job:",
      jobCreateErr.message
    );
  }

  const jobId = job?.id ?? null;

  const finish = async (
    status: "success" | "partial" | "failed",
    imported: number,
    errors: unknown[] = []
  ) => {
    if (!jobId) return;
    const { error: finishErr } = await supabase
      .from("import_jobs")
      .update({
        status,
        rows_imported: imported,
        rows_skipped: rows.length - imported,
        errors,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    if (finishErr) {
      console.error(
        "[commitImport] Failed to finalize import job:",
        finishErr.message
      );
    }
  };

  if (!valid.length) {
    await finish("failed", 0, [{ message: "No valid rows to import" }]);
    return { imported: 0, skipped: skippedFromValidation, jobId };
  }

  const payload = valid.map((r) => r.resolved);

  // ---- First try: fast batch insert ----
  const { error: batchErr } = await supabase.from(table).insert(payload);

  if (!batchErr) {
    await finish(
      skippedFromValidation === 0 ? "success" : "partial",
      valid.length
    );
    return {
      imported: valid.length,
      skipped: skippedFromValidation,
      jobId,
    };
  }

  // ---- If the batch failed for anything other than a duplicate, bail ----
  if (!isDuplicateError(batchErr.message)) {
    await finish("failed", 0, [
      { message: batchErr.message, file: fileName },
    ]);
    throw new Error(batchErr.message);
  }

  // ---- Duplicate detected: fall back to per-row so we keep everything else ----
  let imported = 0;
  let duplicateSkipped = 0;
  const rowErrors: unknown[] = [];

  for (let i = 0; i < payload.length; i++) {
    const { error: rowErr } = await supabase.from(table).insert(payload[i]);

    if (rowErr) {
      if (isDuplicateError(rowErr.message)) {
        duplicateSkipped++;
        rowErrors.push({ row: i + 1, reason: "duplicate" });
      } else {
        rowErrors.push({ row: i + 1, error: rowErr.message });
      }
    } else {
      imported++;
    }
  }

  const totalSkipped = skippedFromValidation + duplicateSkipped;
  const status: "success" | "partial" | "failed" =
    imported === 0 ? "failed" : totalSkipped === 0 ? "success" : "partial";

  await finish(status, imported, rowErrors);

  return { imported, skipped: totalSkipped, jobId };
}