import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Modal from "../components/ui/Modal";
import DataTable, { type Column } from "../components/ui/DataTable";
import { listRows } from "../lib/api";
import { fmtDateTime } from "../lib/utils";

type ImportJob = {
  id: string;
  source: string;
  entity: string;
  status: "running" | "success" | "partial" | "failed";
  rows_total: number;
  rows_imported: number;
  rows_skipped: number;
  errors: unknown;
  started_at: string;
  completed_at: string | null;
};

export default function ImportHistory() {
  const [entityFilter, setEntityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [detail, setDetail] = useState<ImportJob | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["import_jobs"],
    queryFn: () => listRows<ImportJob>("import_jobs"),
  });

  const rows = useMemo(
    () =>
      (data ?? []).slice().sort(
        (a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      ),
    [data]
  );

  const entities = useMemo(
    () => Array.from(new Set(rows.map((r) => r.entity))).sort(),
    [rows]
  );
  const sources = useMemo(
    () => Array.from(new Set(rows.map((r) => r.source))).sort(),
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!entityFilter || r.entity === entityFilter) &&
          (!statusFilter || r.status === statusFilter) &&
          (!sourceFilter || r.source === sourceFilter)
      ),
    [rows, entityFilter, statusFilter, sourceFilter]
  );

  const columns: Column<ImportJob>[] = [
    {
      key: "started_at",
      label: "Started",
      render: (r) => <span className="cell-sub">{fmtDateTime(r.started_at)}</span>,
    },
    {
      key: "entity",
      label: "Entity",
      render: (r) => <span className="cell-mono">{r.entity}</span>,
    },
    {
      key: "source",
      label: "Source",
      render: (r) => <span className="cell-sub">{r.source}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => statusBadge(r.status),
    },
    {
      key: "rows_total",
      label: "Total",
      align: "right",
      render: (r) => <span className="cell-strong">{r.rows_total}</span>,
    },
    {
      key: "rows_imported",
      label: "Imported",
      align: "right",
      render: (r) => (
        <span style={{ color: r.rows_imported ? "#10b981" : undefined, fontWeight: 700 }}>
          {r.rows_imported}
        </span>
      ),
    },
    {
      key: "rows_skipped",
      label: "Skipped",
      align: "right",
      render: (r) => (
        <span style={{ color: r.rows_skipped ? "#ef4444" : undefined, fontWeight: 700 }}>
          {r.rows_skipped}
        </span>
      ),
    },
    {
      key: "completed_at",
      label: "Finished",
      render: (r) => (
        <span className="cell-sub">{r.completed_at ? fmtDateTime(r.completed_at) : "—"}</span>
      ),
    },
  ];

  const actions = (row: ImportJob) => (
    <button className="btn btn-ghost btn-sm" onClick={() => setDetail(row)}>
      Details
    </button>
  );

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Import History</h3>
            <p>Every manual upload and ITSM sync</p>
          </div>
        </div>

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
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={{ minWidth: 160, padding: "7px 11px", fontSize: 12 }}
          >
            <option value="">All entities</option>
            {entities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: 140, padding: "7px 11px", fontSize: 12 }}
          >
            <option value="">All statuses</option>
            <option value="running">Running</option>
            <option value="success">Success</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{ minWidth: 160, padding: "7px 11px", fontSize: 12 }}
          >
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setEntityFilter("");
              setStatusFilter("");
              setSourceFilter("");
            }}
          >
            Clear
          </button>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
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
            rowKey={(r) => r.id}
            actions={actions}
            emptyMessage="No import jobs yet. Run an import from a configuration page."
          />
        )}
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Import job details"
        footer={
          <button className="btn btn-primary" onClick={() => setDetail(null)}>
            Close
          </button>
        }
      >
        {detail && (
          <div style={{ display: "grid", gap: 12 }}>
            <Row label="ID" value={detail.id} mono />
            <Row label="Source" value={detail.source} />
            <Row label="Entity" value={detail.entity} mono />
            <Row label="Status" value={detail.status} />
            <Row label="Started" value={fmtDateTime(detail.started_at)} />
            <Row
              label="Finished"
              value={detail.completed_at ? fmtDateTime(detail.completed_at) : "—"}
            />
            <Row
              label="Rows (total / imported / skipped)"
              value={`${detail.rows_total} / ${detail.rows_imported} / ${detail.rows_skipped}`}
            />
            {!!detail.errors && hasErrors(detail.errors) && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                    marginBottom: 6,
                  }}
                >
                  Errors
                </div>
                <pre
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 11.5,
                    color: "#b91c1c",
                    maxHeight: 260,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(detail.errors, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Row({
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

function hasErrors(errors: unknown): boolean {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  if (typeof errors === "object") return Object.keys(errors as object).length > 0;
  return String(errors).trim().length > 0;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    running: "badge-info",
    success: "badge-success",
    partial: "badge-warning",
    failed: "badge-danger",
  };
  return <span className={`badge ${map[status] ?? "badge-neutral"}`}>{status}</span>;
}