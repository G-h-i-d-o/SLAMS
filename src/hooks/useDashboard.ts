import { useQuery } from "@tanstack/react-query";
import { listRows } from "../lib/api";
import { supabase } from "../lib/supabase";

export type DashboardKpis = {
  active_metrics: number;
  terminated_metrics: number;
  companies_served: number;
  support_groups_involved: number;
  avg_respond_p1: number | null;
  fully_configured: number;
};

export type DashboardStatusRow = { status: string; count: number };
export type DashboardTrendRow = { month: string; label: string; count: number };
export type DashboardRecentRow = {
  id: string;
  document_id: string;
  company_name: string | null;
  support_group_name: string | null;
  status: string;
  mttr_mode: string;
  created_at: string;
  updated_at: string;
};

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: async () => {
      const rows = await listRows<DashboardKpis>("v_dashboard_kpis");
      return rows[0] ?? null;
    },
  });
}

export function useDashboardStatus() {
  return useQuery({
    queryKey: ["dashboard", "status"],
    queryFn: () => listRows<DashboardStatusRow>("v_dashboard_status"),
  });
}

export function useDashboardTrend() {
  return useQuery({
    queryKey: ["dashboard", "trend"],
    queryFn: () => listRows<DashboardTrendRow>("v_dashboard_trend"),
  });
}

export function useDashboardRecent() {
  return useQuery({
    queryKey: ["dashboard", "recent"],
    queryFn: () => listRows<DashboardRecentRow>("v_dashboard_recent"),
  });
}
export type DashboardBreachStats = {
  total_evaluations: number;
  total_breaches: number;
  breach_rate_pct: number;
};

export function useDashboardBreaches() {
  return useQuery({
    queryKey: ["dashboard", "breaches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metric_evaluations")
        .select("breached_respond, breached_resolve");
      if (error) throw error;
      const rows = data ?? [];
      const total = rows.length;
      const breaches = rows.filter(
        (r) => r.breached_respond || r.breached_resolve
      ).length;
      const pct = total > 0 ? Math.round((breaches / total) * 1000) / 10 : 0;
      return {
        total_evaluations: total,
        total_breaches: breaches,
        breach_rate_pct: pct,
      } as DashboardBreachStats;
    },
  });
}