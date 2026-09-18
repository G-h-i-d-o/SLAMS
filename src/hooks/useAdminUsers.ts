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

export type CreateUserInput = {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "user";
};

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
        mutationFn: async (input: CreateUserInput) => {
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();
      if (sessionErr || !sessionData.session) {
        throw new Error("You must be signed in to create users");
      }

      const res = await fetch("/.netlify/functions/admin-create-user", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify(input),
      });

      const text = await res.text().catch(() => "");

      if (!res.ok) {
        let errMsg = `Server error (${res.status})`;
        try {
          const parsed = JSON.parse(text);
          if (parsed?.error) errMsg = parsed.error;
        } catch {
          // Response wasn't JSON — likely a Netlify platform page
          if (text.length < 200) errMsg = text || errMsg;
          errMsg += " · Check Netlify → Functions → admin-create-user → Logs";
        }
        throw new Error(errMsg);
      }

      let data: { ok?: boolean; user_id?: string; warning?: string } = {};
      try {
        data = JSON.parse(text);
      } catch {
        // Response wasn't JSON but status was 2xx — unusual but possible
        throw new Error("Server returned a non-JSON success response");
      }

      if (!data.ok) {
        throw new Error(data.warning ?? "User was not created");
      }
      if (data.warning) {
        console.warn("[useCreateUser]", data.warning);
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

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

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}