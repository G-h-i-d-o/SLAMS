import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_shared/supabaseAdmin";
import { checkRateLimit, getClientIp } from "./_shared/rateLimit";

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
  // ---- 0. Get Supabase admin client ----
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

  // ---- 1. Verify caller ----
  const authHeader =
    event.headers.authorization ?? event.headers.Authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
    // ---- Rate limit: 30 deletes per hour per IP ----
  const ip = getClientIp(event.headers as Record<string, string | undefined>);
  const rl = checkRateLimit(`delete-user:${ip}`, 30, 60 * 60 * 1000);
  if (rl) return rl;
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

  // ---- 2. Parse body ----
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

  // ---- 3. Fetch target — must exist and be deactivated ----
  const { data: target, error: targetErr } = await db
    .from("profiles")
    .select("email, full_name, role, is_active")
    .eq("id", targetId)
    .single();

  if (targetErr || !target) {
    return json(404, { error: "User not found" });
  }
  if (target.is_active) {
    return json(400, {
      error: "Deactivate the user before deleting them permanently",
    });
  }

  // ---- 4. Write the audit entry (before deletion) ----
  const { error: auditErr } = await db.rpc("log_user_action", {
    p_admin_id: userData.user.id,
    p_target_id: targetId,
    p_action: "user-deleted",
    p_old_data: null,
    p_new_data: {
      target_email: target.email,
      target_name: target.full_name,
      target_role: target.role,
    },
  });
  if (auditErr) {
    // Don't block on audit failure — but log it loudly. The delete is the
    // important operation; the audit entry can be reconstructed later.
    console.warn("[admin-delete-user] audit log failed:", auditErr.message);
  }

  // ---- 5. Call the atomic delete RPC ----
  // This handles: nulling references, deleting the profile, deleting the
  // auth row. All in one transaction. If any step fails, nothing is deleted.
  const { data: result, error: deleteErr } = await db.rpc("delete_user_cascade", {
    p_target_id: targetId,
  });

  if (deleteErr) {
    console.error("[admin-delete-user] RPC failed:", deleteErr);
    // Surface the full Postgres error so the client shows something useful
    return json(500, {
      error: `Delete failed: ${deleteErr.message}`,
      detail: deleteErr.details ?? null,
      hint: deleteErr.hint ?? null,
    });
  }

  console.log("[admin-delete-user] Success:", result);
  return json(200, { ok: true, summary: result });
}

function json(statusCode: number, payload: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  };
}