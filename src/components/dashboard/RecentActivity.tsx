import { useNavigate } from "react-router-dom";
import type { DashboardRecentRow } from "../../hooks/useDashboard";
import { fmtDateTime } from "../../lib/utils";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "badge-success",
    pending: "badge-warning",
    expired: "badge-neutral",
    terminated: "badge-danger",
  };
  return <span className={`badge ${map[status] ?? "badge-neutral"}`}>{status}</span>;
}

export default function RecentActivity({ rows }: { rows: DashboardRecentRow[] }) {
  const navigate = useNavigate();

  if (!rows.length) {
    return (
      <div className="empty" style={{ padding: 30 }}>
        No metrics created yet.
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Document ID</th>
            <th>Company</th>
            <th>Support Group</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => navigate(`/history?highlight=${r.id}`)}
              style={{ cursor: "pointer" }}
            >
              <td className="cell-mono">{r.document_id}</td>
              <td className="cell-strong">{r.company_name ?? "—"}</td>
              <td className="cell-sub">{r.support_group_name ?? "—"}</td>
              <td>{statusBadge(r.status)}</td>
              <td className="cell-sub">{fmtDateTime(r.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}