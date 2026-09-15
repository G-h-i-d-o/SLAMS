import { useQuery } from "@tanstack/react-query";
import { listRows } from "../lib/api";

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