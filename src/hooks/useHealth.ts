import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type HealthRow = { id: string; name: string; is_enabled: boolean };

export function useCompanies() {
  return useQuery<HealthRow[]>({
    queryKey: ["health", "companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, is_enabled")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
