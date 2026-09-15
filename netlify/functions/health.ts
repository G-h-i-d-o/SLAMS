import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";

export const handler: Handler = async () => {
  const { count, error } = await supabaseAdmin
    .from("companies")
    .select("*", { count: "exact", head: true });

  return {
    statusCode: error ? 500 : 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ok: !error,
      companies: count ?? 0,
      ts: new Date().toISOString(),
    }),
  };
};
