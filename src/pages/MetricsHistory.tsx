 import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable, { type Column } from "../components/ui/DataTable";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useMetricsFull, useSoftDeleteMetric } from "../hooks/useMetrics";
import { exportSingleMetric, exportMasterSheet } from "../lib/export/metrics";
import { fmtDate } from "../lib/utils";
import type { MetricFull } from "../types/metrics";

export default function MetricsHistory() {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();
  const { data, isLoading, error: loadError } = useMetricsFull();
  const del = useSoftDeleteMetric();

  const [params] = useSearchParams();
  const highlightId = params.get("highlight");

  useEffect(() => {
  const s = params.get("status");
  if (s) setStatusFilter(s);
  const c = params.get("company");
  if (c) setCompanyFilter(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleting, setDeleting] = useState<MetricFull | null>(null);

  const allRows = useMemo(() => {
    const rows = data ?? [];
    return rows.slice().sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data]);

  const companies = useMemo(
    () =>
      Array.from(new Set(allRows.map((r) => r.company_name).filter(Boolean))).sort() as string[],
    [allRows]
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return allRows.filter((r) => {
      if (companyFilter && r.company_name !== companyFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (dateFrom && r.start_date && r.start_date < dateFrom) return false;
      if (dateTo && r.start_date && r.start_date > dateTo) return false;
      if (s) {
        const blob = `${r.document_id} ${r.company_name ?? ""} ${r.contact_company} ${r.customer_number}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [allRows, search, companyFilter, statusFilter, dateFrom, dateTo]);

  function clearFilters() {
    setSearch("");
    setCompanyFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  }

  async function onConfirmDelete() {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      success(`Metric ${deleting.document_id} terminated`);
      setDeleting(null);
    } catch (err) {
      error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const columns: Column<MetricFull>[] = [
    {
      key: "document_id",
      label: "Document ID",
      render: (r) => <span className="cell-mono">{r.document_id}</span>,
    },
    {
      key: "company_name",
      label: "Company",
      render: (r) => <span className="cell-strong">{r.company_name ?? "—"}</span>,
    },
    {
      key: "support_group_name",
      label: "Support Group",
      render: (r) => <span className="cell-sub">{r.support_group_name ?? "—"}</span>,
    },
    {
      key: "site_name",
      label: "Site",
      render: (r) => <span className="cell-sub">{r.site_name ?? "—"}</span>,
    },
    {
      key: "product_name",
      label: "Product",
      render: (r) => <span className="cell-sub">{r.product_name ?? "—"}</span>,
    },
    {
      key: "service_component",
      label: "Service",
      render: (r) => <span className="cell-sub">{r.service_component ?? "—"}</span>,
    },
    {
      key: "start_date",
      label: "Start",
      render: (r) => <span className="cell-sub">{fmtDate(r.start_date)}</span>,
    },
    {
      key: "end_date",
      label: "End",
      render: (r) => <span className="cell-sub">{fmtDate(r.end_date)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => statusBadge(r.status),
    },
  ];

  const actions = (row: MetricFull) => (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => {
          try {
            exportSingleMetric(row);
            success(`Exported ${row.document_id}`);
          } catch (err) {
            error(err instanceof Error ? err.message : "Export failed");
          }
        }}
        title="Export this metric as its own file"
      >
        Export
      </button>
      {isAdmin && row.status !== "terminated" && (
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setDeleting(row)}
          title="Soft delete (mark as terminated)"
        >
          Delete
        </button>
      )}
    </>
  );

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Metrics History</h3>
            <p>{allRows.length} record{allRows.length === 1 ? "" : "s"}</p>
          </div>
          <div className="right">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                try {
                  exportMasterSheet(filtered);
                  success(`Exported ${filtered.length} metric${filtered.length === 1 ? "" : "s"}`);
                } catch (err) {
                  error(err instanceof Error ? err.message : "Export failed");
                }
              }}
              disabled={!filtered.length}
              title="Export all filtered metrics into one workbook"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Master Sheet
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
            placeholder="Search Document ID / company / contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "7px 11px", fontSize: 12 }}
          />
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            style={{ minWidth: 160, padding: "7px 11px", fontSize: 12 }}
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: 140, padding: "7px 11px", fontSize: 12 }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: "7px 11px", fontSize: 12 }}
            title="Start date from"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: "7px 11px", fontSize: 12 }}
            title="Start date to"
          />
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Clear
          </button>
        </div>

        {isLoading ? (
          <div className="empty">Loading…</div>
        ) : loadError ? (
          <div className="empty" style={{ color: "#b91c1c" }}>
            Error: {(loadError as Error).message}
          </div>
        ) : (
          <div
            ref={(el) => {
              if (!el || !highlightId) return;
              const tr = el.querySelector(
                `tr[data-row-id="${highlightId}"]`
              ) as HTMLTableRowElement | null;
              if (tr) {
                tr.classList.add("row-highlight");
                tr.scrollIntoView({ block: "center", behavior: "smooth" });
              }
            }}
          >
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              actions={actions}
              emptyMessage={
                allRows.length
                  ? "No metrics match the current filters."
                  : "No metrics created yet. Go to Create Metrics to add your first one."
              }
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Terminate metric"
        message={
          deleting
            ? `Terminate metric "${deleting.document_id}" for ${deleting.company_name}? ` +
              `The metric stays in the audit log but is marked as terminated and removed from active reporting.`
            : ""
        }
        confirmLabel="Terminate"
        danger
        busy={del.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "badge-success",
    pending: "badge-warning",
    expired: "badge-neutral",
    terminated: "badge-danger",
  };
  return (
    <span className={`badge ${map[status] ?? "badge-neutral"}`}>{status}</span>
  );
}