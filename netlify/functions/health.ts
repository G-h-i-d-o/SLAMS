import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_shared/supabaseAdmin";
import { withSentry } from "./_shared/sentry";

export const handler: Handler = withSentry(async () => {
  const db = getSupabaseAdmin();

  const { count, error } = await db
    .from("companies")
    .select("*", { count: "exact", head: true });

  if (error) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: error.message,
        ts: new Date().toISOString(),
      }),
    };
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ok: true,
      companies: count ?? 0,
      ts: new Date().toISOString(),
    }),
  };
});