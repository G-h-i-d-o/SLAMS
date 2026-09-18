import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_shared/supabaseAdmin";

type Body = {
  user_id?: string;
};

export const handler: Handler = async (event) => {
  try {
    return await handle(event);
  } catch (err) {
    console.error("[admin-delete-user] Unhandled:", err);
    return json(500, { error: err instanceof Error ? err.message : "Internal error" });
  }
};

async function handle(event: Parameters<Handler>[0]) {
  let db;
  try {
    db = getSupabaseAdmin();
  } catch (e) {
    return json(500, {
      error: e instanceof Error ? e.message : "Supabase client unavailable",
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const authHeader =
    event.headers.authorization ?? event.headers.Authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return json(401, { error: "Missing token" });

  const { data: userData, error: userErr } = await db.auth.getUser(token);
  if (userErr || !userData?.user) return json(401, { error: "Invalid session" });

  const { data: caller } = await db
    .from("profiles")
    .select("role, is_active")
    .eq("id", userData.user.id)
    .single();

  if (!caller || caller.role !== "admin" || !caller.is_active) {
    return json(403, { error: "Admin access required" });
  }

  let body: Body;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const targetId = String(body.user_id ?? "");
  if (!targetId) return json(400, { error: "user_id is required" });
  if (targetId === userData.user.id) {
    return json(400, { error: "You cannot delete your own account" });
  }

  // ---- Safety: only delete users that have already been deactivated ----
  const { data: target, error: targetErr } = await db
    .from("profiles")
    .select("is_active")
    .eq("id", targetId)
    .single();

  if (targetErr || !target) return json(404, { error: "User not found" });
  if (target.is_active) {
    return json(400, {
      error: "Deactivate the user before deleting them permanently",
    });
  }

  // ---- Delete the auth user. The FK cascade removes the profile row. ----
  const { error: delErr } = await db.auth.admin.deleteUser(targetId);
  if (delErr) return json(400, { error: delErr.message });

  return json(200, { ok: true });
}

function json(statusCode: number, payload: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  };
}