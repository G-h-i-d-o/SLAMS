// Phase 4 will implement the real sync. Phase 0 ships a stub so CI/CD
// and the cron plumbing can be tested end-to-end.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const { data: job, error: jobErr } = await db
    .from("import_jobs")
    .insert({ source: "ITSM", entity: "all", status: "running" })
    .select()
    .single();

  if (jobErr) {
    return new Response(JSON.stringify({ ok: false, error: jobErr.message }), { status: 500 });
  }

  await db
    .from("import_jobs")
    .update({ status: "success", completed_at: new Date().toISOString() })
    .eq("id", job.id);

  return new Response(JSON.stringify({ ok: true, job_id: job.id }), {
    headers: { "content-type": "application/json" },
  });
});
