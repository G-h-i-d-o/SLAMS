import { Fragment, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useMetricsFull, useSoftDeleteMetric } from "../hooks/useMetrics";
import {
  exportBatch,
  exportMasterSheet,
  exportSelected,
  exportSingleMetric,
} from "../lib/export/metrics";
import { fmtDate } from "../lib/utils";
import type { MetricFull } from "../types/metrics";

type HistoryGroup = {
  key: string;
  isBatch: boolean;
  primary: MetricFull;
  members: MetricFull[];
};

function groupMetrics(rows: MetricFull[]): HistoryGroup[] {
  const byKey = new Map<string, HistoryGroup>();
  for (const r of rows) {
    const key = r.batch_id ?? r.id;
    let g = byKey.get(key);
    if (!g) {
      g = { key, isBatch: !!r.batch_id, primary: r, members: [] };
      byKey.set(key, g);
    }
    g.members.push(r);
  }
  return Array.from(byKey.values()).sort(
    (a, b) =>
      new Date(b.primary.created_at).getTime() -
      new Date(a.primary.created_at).getTime()
  );
}

export default function MetricsHistory() {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();
  const { data, isLoading, error: loadError } = useMetricsFull();
  const del = useSoftDeleteMetric();

  const [params] = useSearchParams();
  const highlightId = params.get("highlight");

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleting, setDeleting] = useState<HistoryGroup | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const allGroups = useMemo(() => {
    const rows = data ?? [];
    return groupMetrics(rows);
  }, [data]);

  const companies = useMemo(
    () =>
      Array.from(
        new Set(allGroups.map((g) => g.primary.company_name).filter(Boolean))
      ).sort() as string[],
    [allGroups]
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return allGroups.filter((g) => {
      const p = g.primary;
      if (companyFilter && p.company_name !== companyFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (dateFrom && p.start_date && p.start_date < dateFrom) return false;
      if (dateTo && p.start_date && p.start_date > dateTo) return false;
      if (s) {
        const blob = `${p.document_id} ${p.company_name ?? ""} ${p.contact_company} ${p.customer_number}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [allGroups, search, companyFilter, statusFilter, dateFrom, dateTo]);

  function clearFilters() {
    setSearch("");
    setCompanyFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  }

  function toggleSelection(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedKeys(new Set(filtered.map((g) => g.key)));
  }

  function clearSelection() {
    setSelectedKeys(new Set());
  }

  function toggleExpand(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function onConfirmDelete() {
    if (!deleting) return;
    try {
      // Delete every member of the group
      for (const m of deleting.members) {
        await del.mutateAsync(m.id);
      }
      success(
        deleting.members.length > 1
          ? `${deleting.members.length} metrics terminated`
          : `Metric ${deleting.primary.document_id} terminated`
      );
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.delete(deleting.key);
        return next;
      });
      setDeleting(null);
    } catch (err) {
      error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function handleExportGroup(g: HistoryGroup) {
    try {
      if (g.members.length === 1) {
        exportSingleMetric(g.members[0]);
        success(`Exported ${g.primary.document_id}`);
      } else {
        exportBatch(g.members, g.primary.document_id);
        success(`Exported ${g.members.length} metrics as one sheet`);
      }
    } catch (err) {
      error(err instanceof Error ? err.message : "Export failed");
    }
  }

  function handleExportSelected() {
    try {
      const selectedGroups = allGroups.filter((g) => selectedKeys.has(g.key));
      const allMembers = selectedGroups.flatMap((g) => g.members);
      if (!allMembers.length) {
        error("No metrics selected");
        return;
      }
      exportSelected(allMembers);
      success(
        `Exported ${allMembers.length} metric${
          allMembers.length === 1 ? "" : "s"
        } as one sheet`
      );
    } catch (err) {
      error(err instanceof Error ? err.message : "Export failed");
    }
  }

  function handleExportMaster() {
    try {
      const allMembers = filtered.flatMap((g) => g.members);
      exportMasterSheet(allMembers);
      success(
        `Exported ${allMembers.length} metric${allMembers.length === 1 ? "" : "s"}`
      );
    } catch (err) {
      error(err instanceof Error ? err.message : "Export failed");
    }
  }

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((g) => selectedKeys.has(g.key));

  const totalMetrics = allGroups.reduce((s, g) => s + g.members.length, 0);
  const selectedMetrics = allGroups
    .filter((g) => selectedKeys.has(g.key))
    .reduce((s, g) => s + g.members.length, 0);

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Metrics History</h3>
            <p>
              {allGroups.length} document{allGroups.length === 1 ? "" : "s"} ·{" "}
              {totalMetrics} metric{totalMetrics === 1 ? "" : "s"}
              {selectedKeys.size > 0 && (
                <>
                  {" · "}
                  <strong style={{ color: "var(--primary)" }}>
                    {selectedMetrics} selected
                  </strong>
                </>
              )}
            </p>
          </div>
          <div className="right">
            {selectedKeys.size > 0 && (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleExportSelected}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export Selected ({selectedMetrics})
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={clearSelection}
                  title="Clear selection"
                >
                  Clear
                </button>
              </>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleExportMaster}
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
              <option key={c} value={c}>
                {c}
              </option>
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
        ) : filtered.length === 0 ? (
          <div className="empty">
            {allGroups.length
              ? "No metrics match the current filters."
              : "No metrics created yet. Go to Create Metrics to add your first one."}
          </div>
        ) : (
          <div
            className="table-wrap"
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
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={() =>
                        allVisibleSelected ? clearSelection() : selectAllVisible()
                      }
                      aria-label="Select all visible"
                      style={{
                        width: 15,
                        height: 15,
                        accentColor: "var(--primary)",
                        cursor: "pointer",
                      }}
                    />
                  </th>
                  <th style={{ width: 40 }}></th>
                  <th>Document ID</th>
                  <th>Company</th>
                  <th>Support Groups</th>
                  <th>Services</th>
                  <th>Site</th>
                  <th>Product</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const p = g.primary;
                  const isExpanded = expandedKeys.has(g.key);
                  const isSelected = selectedKeys.has(g.key);
                  const isHighlighted =
                    highlightId === p.id ||
                    g.members.some((m) => m.id === highlightId);

                  const supportGroupSummary =
                    g.members.length === 1
                      ? p.support_group_name ?? "—"
                      : `${g.members.length} group${
                          g.members.length === 1 ? "" : "s"
                        } × service${
                          new Set(g.members.map((m) => m.service_id)).size === 1
                            ? ""
                            : "s"
                        }`;

                  // Count distinct support groups and services
                  const distinctGroups = new Set(
                    g.members.map((m) => m.support_group_id)
                  );
                  const distinctServices = new Set(
                    g.members.map((m) => m.service_id)
                  );

                  const supportGroupDisplay =
                    g.members.length === 1
                      ? p.support_group_name ?? "—"
                      : distinctGroups.size === 1
                      ? `${p.support_group_name ?? "1 group"} × ${distinctServices.size} services`
                      : `${distinctGroups.size} support groups`;

                  const serviceDisplay =
                    g.members.length === 1
                      ? p.service_component ?? "—"
                      : distinctServices.size === 1
                      ? `${p.service_component ?? "1 service"} × ${distinctGroups.size} groups`
                      : `${distinctServices.size} services`;

                  void supportGroupSummary;

                  return (
                    <Fragment key={g.key}>
                      <tr
                        data-row-id={p.id}
                        className={isHighlighted ? "row-highlight" : ""}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(g.key)}
                            aria-label={`Select ${p.document_id}`}
                            style={{
                              width: 15,
                              height: 15,
                              accentColor: "var(--primary)",
                              cursor: "pointer",
                            }}
                          />
                        </td>
                        <td>
                          {g.members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(g.key)}
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 2,
                                display: "grid",
                                placeItems: "center",
                                color: "var(--muted)",
                                transform: isExpanded
                                  ? "rotate(90deg)"
                                  : "rotate(0deg)",
                                transition: "transform .15s",
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          )}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span className="cell-mono">
                              {p.document_id}
                            </span>
                            {g.members.length > 1 && (
                              <span
                                className="badge badge-purple"
                                title={`${g.members.length} metrics bundled into one document`}
                              >
                                {g.members.length} metrics
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="cell-strong">
                            {p.company_name ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span className="cell-sub">
                            {supportGroupDisplay}
                          </span>
                        </td>
                        <td>
                          <span className="cell-sub">{serviceDisplay}</span>
                        </td>
                        <td>
                          <span className="cell-sub">
                            {p.site_name ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span className="cell-sub">
                            {p.product_name ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span className="cell-sub">
                            {fmtDate(p.start_date)}
                          </span>
                        </td>
                        <td>
                          <span className="cell-sub">
                            {fmtDate(p.end_date)}
                          </span>
                        </td>
                        <td>{statusBadge(p.status)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleExportGroup(g)}
                              title={
                                g.members.length > 1
                                  ? `Export all ${g.members.length} metrics as one sheet`
                                  : "Export this metric"
                              }
                            >
                              {g.members.length > 1
                                ? `Export (${g.members.length})`
                                : "Export"}
                            </button>
                            {isAdmin && p.status !== "terminated" && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeleting(g)}
                                title="Soft delete"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && g.members.length > 1 && (
                        <tr>
                          <td
                            colSpan={12}
                            style={{
                              background: "#fafbfd",
                              padding: "0 20px 14px",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <div style={{ paddingTop: 12 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--muted)",
                                  textTransform: "uppercase",
                                  letterSpacing: ".5px",
                                  marginBottom: 8,
                                }}
                              >
                                {g.members.length} metrics bundled into this
                                document
                              </div>
                              <table style={{ fontSize: 12 }}>
                                <thead>
                                  <tr>
                                    <th style={{ width: 40 }}>#</th>
                                    <th>Support Group</th>
                                    <th>Service Category</th>
                                    <th>Service Component</th>
                                    <th>MTTR</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {g.members.map((m, i) => (
                                    <tr key={m.id}>
                                      <td
                                        style={{
                                          color: "var(--faint)",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {i + 1}
                                      </td>
                                      <td>{m.support_group_name ?? "—"}</td>
                                      <td className="cell-sub">
                                        {m.service_category ?? "—"}
                                      </td>
                                      <td>{m.service_component ?? "—"}</td>
                                      <td>
                                        <span className="badge badge-info">
                                          {m.mttr_mode || "—"}
                                        </span>
                                      </td>
                                      <td>{statusBadge(m.status)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Terminate metrics"
        message={
          deleting
            ? deleting.members.length > 1
              ? `Terminate all ${deleting.members.length} metrics bundled into "${deleting.primary.document_id}"? They stay in the audit log but are marked terminated.`
              : `Terminate metric "${deleting.primary.document_id}" for ${deleting.primary.company_name}? The metric stays in the audit log but is marked as terminated and removed from active reporting.`
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