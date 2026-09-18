import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { listRows } from "../lib/api";

export type AdminUserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
};

const QUERY_KEY = ["admin", "users"];

export function useAdminUsers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listRows<AdminUserProfile>("profiles", "created_at"),
  });
}

/* -------------------------------------------------------------------- */
/*  Helper: call a Netlify Function with the current session's JWT     */
/* -------------------------------------------------------------------- */
async function callAdminFunction(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok?: boolean; warning?: string }> {
  const { data: sessionData, error: sessionErr } =
    await supabase.auth.getSession();

  if (sessionErr || !sessionData.session) {
    throw new Error("You must be signed in");
  }

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${sessionData.session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    let errMsg = `Server error (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) errMsg = parsed.error;
    } catch {
      if (text.length < 200) errMsg = text || errMsg;
      errMsg += " · Check Netlify → Functions → Logs";
    }
    throw new Error(errMsg);
  }

  let data: { ok?: boolean; warning?: string } = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server returned a non-JSON success response");
  }
  if (data.warning) console.warn("[adminFunction]", data.warning);
  return data;
}

/* -------------------------------------------------------------------- */
/*  Create user                                                        */
/* -------------------------------------------------------------------- */
export type CreateUserInput = {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "user";
};

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      callAdminFunction("/.netlify/functions/admin-create-user", {
        email: input.email,
        password: input.password,
        full_name: input.full_name,
        role: input.role,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

/* -------------------------------------------------------------------- */
/*  Update role (direct profile update — RLS allows admins)             */
/* -------------------------------------------------------------------- */
export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      role,
    }: {
      id: string;
      role: "admin" | "user";
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

/* -------------------------------------------------------------------- */
/*  Toggle active (via Netlify Function — bans/unbans at auth layer)    */
/* -------------------------------------------------------------------- */
export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      callAdminFunction("/.netlify/functions/admin-toggle-user", {
        user_id: id,
        is_active,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

/* -------------------------------------------------------------------- */
/*  Delete user permanently (only allowed if already deactivated)       */
/* -------------------------------------------------------------------- */
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      callAdminFunction("/.netlify/functions/admin-delete-user", {
        user_id: id,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}