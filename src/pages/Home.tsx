import { useNavigate } from "react-router-dom";
import KpiCard from "../components/dashboard/KpiCard";
import StatusDonut from "../components/dashboard/StatusDonut";
import TrendChart from "../components/dashboard/TrendChart";
import RecentActivity from "../components/dashboard/RecentActivity";
import { useAuth } from "../contexts/AuthContext";
import {
  useDashboardKpis,
  useDashboardRecent,
  useDashboardStatus,
  useDashboardTrend,
} from "../hooks/useDashboard";
import { useRealtimeMetrics } from "../hooks/useRealtimeMetrics";

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useRealtimeMetrics();

  const kpisQ = useDashboardKpis();
  const statusQ = useDashboardStatus();
  const trendQ = useDashboardTrend();
  const recentQ = useDashboardRecent();

  const kpis = kpisQ.data;
  const status = statusQ.data ?? [];
  const trend = trendQ.data ?? [];
  const recent = recentQ.data ?? [];

  const completePct =
    kpis && kpis.active_metrics > 0
      ? Math.round((kpis.fully_configured / kpis.active_metrics) * 100)
      : 0;

  const greetingName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <>
      {/* Hero */}
      <div className="home-hero" style={{ marginBottom: 20 }}>
        <h1>Welcome back, {greetingName}.</h1>
        <p>
          Live view of every SLA metric in the system. Changes from other users appear here
          automatically.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid g-4 mb-16">
        <KpiCard
          label="Active Metrics"
          value={kpis?.active_metrics ?? "—"}
          sub={kpis ? `${kpis.terminated_metrics} terminated` : ""}
          iconBg="#eef2ff"
          iconColor="#4f46e5"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
          onClick={() => navigate("/history?status=active")}
        />

        <KpiCard
          label="Companies Served"
          value={kpis?.companies_served ?? "—"}
          sub={kpis ? `${kpis.support_groups_involved} support groups` : ""}
          iconBg="#eff6ff"
          iconColor="#3b82f6"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
              <path d="M15 21V9h4a2 2 0 0 1 2 2v10" />
              <path d="M9 7h2M9 11h2M9 15h2" />
            </svg>
          }
        />

        <KpiCard
          label="Avg Respond P1"
          value={
            kpis?.avg_respond_p1 != null ? (
              <>
                {kpis.avg_respond_p1}
                <small style={{ fontSize: 14, color: "var(--faint)", fontWeight: 700 }}> min</small>
              </>
            ) : (
              "—"
            )
          }
          sub="Across active metrics"
          iconBg="#ecfdf5"
          iconColor="#10b981"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <KpiCard
          label="MTTR Completeness"
          value={
            <>
              {completePct}
              <small style={{ fontSize: 14, color: "var(--faint)", fontWeight: 700 }}>%</small>
            </>
          }
          sub={
            kpis
              ? `${kpis.fully_configured} of ${kpis.active_metrics} fully configured`
              : ""
          }
          iconBg="#f5f3ff"
          iconColor="#8b5cf6"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div
        className="grid mb-16"
        style={{ gridTemplateColumns: "1.4fr 1fr" }}
      >
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Metrics Created — Last 12 Months</h3>
              <p>Monthly creation volume</p>
            </div>
            <div className="right">
              <span className="badge badge-info">
                {trend.reduce((s, r) => s + r.count, 0)} total
              </span>
            </div>
          </div>
          <div className="card-body" style={{ padding: "12px 10px 6px" }}>
            {trendQ.isLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                Loading…
              </div>
            ) : (
              <TrendChart rows={trend} />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Status Distribution</h3>
          </div>
          <div className="card-body">
            {statusQ.isLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                Loading…
              </div>
            ) : (
              <StatusDonut rows={status} />
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Recent Activity</h3>
            <p>Latest metrics by last update time</p>
          </div>
          <div className="right">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate("/history")}
            >
              View all
            </button>
          </div>
        </div>
        {recentQ.isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Loading…
          </div>
        ) : (
          <RecentActivity rows={recent} />
        )}
      </div>
    </>
  );
}