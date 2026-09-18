import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_shared/supabaseAdmin";

type Body = { user_id?: string };

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

  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

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
    .select("role, is_active, email")
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

  // ---- Fetch target for safety check + audit entry ----
  const { data: target, error: targetErr } = await db
    .from("profiles")
    .select("email, full_name, role, is_active")
    .eq("id", targetId)
    .single();

  if (targetErr || !target) return json(404, { error: "User not found" });
  if (target.is_active) {
    return json(400, {
      error: "Deactivate the user before deleting them permanently",
    });
  }

  // ---- 1. Write the audit entry BEFORE deleting the user ----
  // We do this now because after deletion, the FK from audit_log.user_id
  // would set to null and we'd lose the actor's identity on that row.
  const { error: auditErr } = await db.from("audit_log").insert({
    user_id: userData.user.id,
    user_email: caller.email ?? userData.user.email ?? null,
    table_name: "profiles",
    record_id: targetId,
    action: "user-deleted",
    new_data: {
      target_email: target.email,
      target_name: target.full_name,
      target_role: target.role,
    },
  });
  if (auditErr) console.warn("[admin-delete-user] audit log failed:", auditErr.message);

  // ---- 2. Delete the auth user. FK cascade removes the profile row. ----
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