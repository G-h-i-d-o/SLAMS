import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listRows } from "../lib/api";
import { fmtDateTime } from "../lib/utils";
import type { Column } from "../components/ui/DataTable";
import DataTable from "../components/ui/DataTable";

type AuditRow = {
  id: number;
  user_email: string | null;
  user_id: string | null;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

export default function AuditLog() {
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

const { data, isLoading, error } = useQuery({
  queryKey: ["audit_log"],
  queryFn: async () => {
    // No orderBy param — sort client-side to avoid Supabase's strict ordering syntax
    const rows = await listRows<AuditRow>("audit_log");
    return rows
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 500);
  },
});

  const rows = data ?? [];

  const tables = useMemo(
    () => Array.from(new Set(rows.map((r) => r.table_name))).sort(),
    [rows]
  );
  const actions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!tableFilter || r.table_name === tableFilter) &&
          (!actionFilter || r.action === actionFilter)
      ),
    [rows, tableFilter, actionFilter]
  );

  const columns: Column<AuditRow>[] = [
    {
      key: "created_at",
      label: "Time",
      render: (r) => <span className="cell-sub">{fmtDateTime(r.created_at)}</span>,
    },
    {
      key: "user_email",
      label: "User",
      render: (r) => r.user_email ?? <span className="cell-sub">system</span>,
    },
    {
      key: "table_name",
      label: "Table",
      render: (r) => <span className="cell-mono">{r.table_name}</span>,
    },
    {
      key: "action",
      label: "Action",
      render: (r) => actionBadge(r.action),
    },
    {
      key: "details",
      label: "Details",
      render: (r) => {
        const payload = r.new_data ?? r.old_data ?? {};
        const summary = summarize(payload);
        return (
          <span className="cell-sub" title={JSON.stringify(payload)}>
            {summary}
          </span>
        );
      },
    },
  ];

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Audit Log</h3>
          <p>Every insert, update, and delete across the system</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 9,
          alignItems: "center",
          padding: "14px 20px",
          borderBottom: "1px solid #e6ebf2",
        }}
      >
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          style={{ padding: "7px 11px", fontSize: 12, minWidth: 160 }}
        >
          <option value="">All tables</option>
          {tables.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ padding: "7px 11px", fontSize: 12, minWidth: 140 }}
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setTableFilter(""); setActionFilter(""); }}
        >
          Clear
        </button>

        <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
          Showing {filtered.length} of {rows.length}
        </span>
      </div>

      {isLoading ? (
        <div className="empty">Loading…</div>
      ) : error ? (
        <div className="empty" style={{ color: "#b91c1c" }}>
          Error: {(error as Error).message}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => String(r.id)}
          emptyMessage="No audit entries match the current filters."
        />
      )}
    </div>
  );
}

function actionBadge(action: string) {
  const map: Record<string, string> = {
    insert: "badge-success",
    update: "badge-info",
    delete: "badge-danger",
  };
  const cls = map[action] ?? "badge-neutral";
  return <span className={`badge ${cls}`}>{action}</span>;
}

function summarize(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload).slice(0, 4);
  const parts = keys.map((k) => {
    const v = payload[k];
    const s = v === null || v === undefined ? "—" : String(v);
    return `${k}: ${s.length > 24 ? s.slice(0, 24) + "…" : s}`;
  });
  return parts.join(" · ");
}