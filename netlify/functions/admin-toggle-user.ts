import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_shared/supabaseAdmin";

type Body = { user_id?: string; is_active?: boolean };

export const handler: Handler = async (event) => {
  try {
    return await handle(event);
  } catch (err) {
    console.error("[admin-toggle-user] Unhandled:", err);
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
  const isActive = !!body.is_active;

  if (!targetId) return json(400, { error: "user_id is required" });
  if (targetId === userData.user.id) {
    return json(400, { error: "You cannot change your own active status" });
  }

  // ---- Fetch the target's current state for the audit entry ----
  const { data: target } = await db
    .from("profiles")
    .select("email, full_name, role, is_active")
    .eq("id", targetId)
    .single();

  if (!target) return json(404, { error: "User not found" });

  // ---- 1. Update the profile flag ----
  const { error: profileErr } = await db
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", targetId);

  if (profileErr) return json(400, { error: profileErr.message });

  // ---- 2. Ban / unban at the auth layer ----
  const { error: banErr } = await db.auth.admin.updateUserById(targetId, {
    ban_duration: isActive ? "none" : "876000h",
  });

  if (banErr) {
    console.warn("[admin-toggle-user] ban update failed:", banErr.message);
  }

  // ---- 3. Write an explicit audit entry ----
  const action = isActive ? "user-reactivated" : "user-deactivated";
  const { error: auditErr } = await db.from("audit_log").insert({
    user_id: userData.user.id,
    user_email: caller.email ?? userData.user.email ?? null,
    table_name: "profiles",
    record_id: targetId,
    action,
    old_data: { is_active: target.is_active },
    new_data: {
      target_email: target.email,
      target_name: target.full_name,
      target_role: target.role,
      is_active: isActive,
    },
  });
  if (auditErr) console.warn("[admin-toggle-user] audit log failed:", auditErr.message);

  return json(200, { ok: true });
}

function json(statusCode: number, payload: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  };
}