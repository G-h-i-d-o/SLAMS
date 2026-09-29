import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Modal from "../components/ui/Modal";
import DataTable, { type Column } from "../components/ui/DataTable";
import { listRows } from "../lib/api";
import { supabase } from "../lib/supabase";
import { fmtDateTime } from "../lib/utils";

type AuditRow = {
  id: number;
  user_id: string | null;
  user_email: string | null;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  source: "trigger" | "rpc" | "manual";
  created_at: string;
};

const QUERY_KEY = ["audit_log"];
const MAX_ROWS = 1000;

/* -------------------------------------------------------------------- */
/*  Color-coded actions                                                 */
/* -------------------------------------------------------------------- */
function actionBadge(action: string) {
  const cls =
    action.includes("deleted") || action.includes("terminated") || action === "delete"
      ? "badge-danger"
      : action.includes("created") || action.includes("insert")
      ? "badge-success"
      : action.includes("deactivated")
      ? "badge-warning"
      : action.includes("reactivated")
      ? "badge-info"
      : action.includes("changed") || action === "update"
      ? "badge-info"
      : "badge-neutral";
  return <span className={`badge ${cls}`}>{action}</span>;
}

function sourceBadge(source: string) {
  if (source === "rpc") {
    return (
      <span className="badge badge-purple" title="Called via RPC from an admin action">
        RPC
      </span>
    );
  }
  if (source === "manual") {
    return <span className="badge badge-warning">Manual</span>;
  }
  return (
    <span className="badge badge-neutral" title="Automatic table trigger">
      Trigger
    </span>
  );
}

function summarize(payload: Record<string, unknown> | null): string {
  if (!payload) return "—";
  const keys = Object.keys(payload).slice(0, 3);
  if (!keys.length) return "—";
  return keys
    .map((k) => {
      const v = payload[k];
      if (v === null || v === undefined) return `${k}: —`;
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `${k}: ${s.length > 30 ? s.slice(0, 30) + "…" : s}`;
    })
    .join(" · ");
}

/* -------------------------------------------------------------------- */
/*  Page                                                                */
/* -------------------------------------------------------------------- */
export default function AuditLog() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState<AuditRow | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const rows = await listRows<AuditRow>("audit_log");
      return rows
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, MAX_ROWS);
    },
  });

  // Realtime invalidation — any new audit row refreshes this page
  useEffect(() => {
    const channelName = `audit-${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_log" },
        () => qc.invalidateQueries({ queryKey: QUERY_KEY })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const rows = data ?? [];

  const tables = useMemo(
    () => Array.from(new Set(rows.map((r) => r.table_name))).sort(),
    [rows]
  );
  const actions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows]
  );
  const users = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.user_email).filter(Boolean) as string[])
      ).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tableFilter && r.table_name !== tableFilter) return false;
      if (actionFilter && r.action !== actionFilter) return false;
      if (sourceFilter && r.source !== sourceFilter) return false;
      if (userFilter && r.user_email !== userFilter) return false;
      if (dateFrom && r.created_at.slice(0, 10) < dateFrom) return false;
      if (dateTo && r.created_at.slice(0, 10) > dateTo) return false;
      if (q) {
        const blob = [
          r.user_email ?? "",
          r.table_name,
          r.action,
          r.record_id ?? "",
          summarize(r.new_data),
          summarize(r.old_data),
        ]
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, tableFilter, actionFilter, sourceFilter, userFilter, dateFrom, dateTo]);

  function clearFilters() {
    setSearch("");
    setTableFilter("");
    setActionFilter("");
    setSourceFilter("");
    setUserFilter("");
    setDateFrom("");
    setDateTo("");
  }

  const activeFilterCount = [
    search,
    tableFilter,
    actionFilter,
    sourceFilter,
    userFilter,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  const columns: Column<AuditRow>[] = [
    {
      key: "created_at",
      label: "Time",
      render: (r) => (
        <span className="cell-sub" title={r.created_at}>
          {fmtDateTime(r.created_at)}
        </span>
      ),
    },
    {
      key: "user_email",
      label: "Actor",
      render: (r) =>
        r.user_email ? (
          <span>{r.user_email}</span>
        ) : (
          <span className="cell-sub" title="Action performed by the system or a service-role function">
            system
          </span>
        ),
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
      key: "source",
      label: "Source",
      render: (r) => sourceBadge(r.source),
    },
    {
      key: "details",
      label: "Details",
      render: (r) => (
        <span
          className="cell-sub"
          title={JSON.stringify(r.new_data ?? r.old_data ?? {})}
        >
          {summarize(r.new_data ?? r.old_data)}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Audit Log</h3>
            <p>
              Every insert, update, and delete across the system ·{" "}
              {rows.length} most recent entries
            </p>
          </div>
          <div className="right">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 9,
            alignItems: "center",
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <input
            type="text"
            placeholder="Search actor, table, action, details…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 220, padding: "7px 11px", fontSize: 12 }}
          />
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ minWidth: 170, padding: "7px 11px", fontSize: 12 }}
          >
            <option value="">All actors</option>
            {users.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            style={{ minWidth: 150, padding: "7px 11px", fontSize: 12 }}
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
            style={{ minWidth: 150, padding: "7px 11px", fontSize: 12 }}
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{ minWidth: 130, padding: "7px 11px", fontSize: 12 }}
          >
            <option value="">All sources</option>
            <option value="trigger">Trigger</option>
            <option value="rpc">RPC</option>
            <option value="manual">Manual</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: "7px 11px", fontSize: 12 }}
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: "7px 11px", fontSize: 12 }}
            title="To date"
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={clearFilters}
            disabled={!activeFilterCount}
          >
            Clear{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </button>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            {filtered.length} of {rows.length}
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
            actions={(row) => (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDetail(row)}
              >
                Details
              </button>
            )}
            emptyMessage={
              activeFilterCount
                ? "No audit entries match the current filters."
                : "No audit entries yet."
            }
          />
        )}
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Audit entry details"
        wide
        footer={
          <button className="btn btn-primary" onClick={() => setDetail(null)}>
            Close
          </button>
        }
      >
        {detail && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <DetailRow label="Time" value={fmtDateTime(detail.created_at)} />
              <DetailRow
                label="Source"
                value={detail.source === "rpc" ? "RPC (user action)" : detail.source}
              />
              <DetailRow label="Actor" value={detail.user_email ?? "system"} />
              <DetailRow
                label="Actor ID"
                value={detail.user_id ?? "—"}
                mono
              />
              <DetailRow label="Table" value={detail.table_name} mono />
              <DetailRow label="Record ID" value={detail.record_id ?? "—"} mono />
              <DetailRow label="Action" value={detail.action} />
            </div>

            <div>
              <div style={sectionLabel}>Before</div>
              <pre style={preStyle}>
                {detail.old_data
                  ? JSON.stringify(detail.old_data, null, 2)
                  : "—"}
              </pre>
            </div>

            <div>
              <div style={sectionLabel}>After</div>
              <pre style={preStyle}>
                {detail.new_data
                  ? JSON.stringify(detail.new_data, null, 2)
                  : "—"}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: ".5px",
  marginBottom: 6,
};

const preStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 12,
  fontSize: 11.5,
  color: "#475569",
  maxHeight: 260,
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontFamily: "ui-monospace, Menlo, Consolas, monospace",
};

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 8,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: mono ? "ui-monospace, Menlo, monospace" : undefined,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}