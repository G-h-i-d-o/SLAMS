import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";

type CreateUserBody = {
  email?: string;
  password?: string;
  full_name?: string;
  role?: "admin" | "user";
};

export const handler: Handler = async (event) => {
  try {
    return await handle(event);
  } catch (err) {
    console.error("[admin-create-user] Unhandled error:", err);
    return json(500, {
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
};

async function handle(event: Parameters<Handler>[0]) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  // ---- 1. Extract token ----
  const authHeader =
    event.headers.authorization ?? event.headers.Authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return json(401, { error: "Missing authorization token" });
  }

  // ---- 2. Verify the token and get the caller ----
  // NOTE: the correct method is auth.getUser(jwt), NOT admin.getUser
  const { data: userData, error: userErr } =
    await supabaseAdmin.auth.getUser(token);

  if (userErr || !userData?.user) {
    return json(401, {
      error: `Invalid or expired session: ${userErr?.message ?? "unknown"}`,
    });
  }

  // ---- 3. Confirm the caller is an active admin ----
  const { data: callerProfile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("role, is_active")
    .eq("id", userData.user.id)
    .single();

  if (profileErr || !callerProfile) {
    return json(403, { error: "Caller profile not found" });
  }
  if (callerProfile.role !== "admin" || !callerProfile.is_active) {
    return json(403, { error: "Admin access required" });
  }

  // ---- 4. Parse and validate the body ----
  let body: CreateUserBody;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const fullName = String(body.full_name ?? "").trim();
  const role: "admin" | "user" = body.role === "admin" ? "admin" : "user";

  if (!email || !email.includes("@")) {
    return json(400, { error: "A valid email is required" });
  }
  if (password.length < 8) {
    return json(400, { error: "Password must be at least 8 characters" });
  }

  // ---- 5. Create the auth user ----
  const { data: created, error: createErr } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createErr) {
    console.error("[admin-create-user] createUser failed:", createErr);
    return json(400, { error: createErr.message });
  }
  if (!created?.user) {
    return json(500, { error: "User was created but no record was returned" });
  }

  // ---- 6. Set role + full_name on the profile row ----
  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update({ role, full_name: fullName || null })
    .eq("id", created.user.id);

  if (updateErr) {
    console.error("[admin-create-user] profile update failed:", updateErr);
    // Not fatal — the user exists. Return success with a warning.
    return json(200, {
      ok: true,
      user_id: created.user.id,
      warning: `User created but profile update failed: ${updateErr.message}`,
    });
  }

  return json(200, { ok: true, user_id: created.user.id });
}

function json(statusCode: number, payload: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  };
}