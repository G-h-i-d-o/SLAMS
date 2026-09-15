import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listRows } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { MetricFull } from "../types/metrics";

export function useMetricsFull() {
  return useQuery({
    queryKey: ["metrics", "full"],
    queryFn: () => listRows<MetricFull>("v_metrics_full"),
  });
}

export function useSoftDeleteMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (metricId: string) => {
      const { error } = await supabase.rpc("soft_delete_metric", {
        p_metric_id: metricId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metrics", "full"] });
      qc.invalidateQueries({ queryKey: ["audit_log"] });
    },
  });
}