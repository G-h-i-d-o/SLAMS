import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Subscribes to realtime changes on the `metrics` table and invalidates
 * the relevant React Query caches so the dashboard + history refresh
 * automatically. Cleans up the channel on unmount.
 */
export function useRealtimeMetrics() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("metrics-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "metrics" },
        () => {
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          qc.invalidateQueries({ queryKey: ["metrics", "full"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}