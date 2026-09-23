import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable, { Column } from "./DataTable";
import ConfigFormModal from "./ConfigFormModal";
import ConfirmDialog from "./ConfirmDialog";
import ImportModal from "./ImportModal";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useLookups } from "../../contexts/LookupsContext";
import { useTable, useMutateTable } from "../../hooks/useTable";
import type { ConfigSpec, Lookups } from "../../types/config";

/**
 * Build a lowercase, concatenated blob of every meaningful value in a row.
 * Used to power the config-page search box.
 *
 * Includes:
 *   - all non-ID column values as strings
 *   - booleans as "yes enabled" / "no disabled"
 *   - UUID columns resolved to human names via lookups
 *
 * This means searching "Global" finds a Support Group whose name is
 * "Tier 1 Service Desk" but whose Support Organization is "Global Services",
 * even though the row only stores the org's UUID.
 */
function buildSearchBlob<T extends Record<string, unknown>>(
  row: T,
  lookups: Lookups
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) continue;

    if (typeof value === "boolean") {
      parts.push(value ? "yes enabled active" : "no disabled inactive");
      continue;
    }

    if (typeof value === "string" && value.length === 36) {
      // Looks like a UUID — include it AND its resolved name if we know it
      parts.push(value);
      const resolved =
        lookups.companyNameById[value] ||
        lookups.supportOrgNameById[value] ||
        lookups.supportGroupCompanyNameById[value];
      if (resolved) parts.push(resolved);
      continue;
    }

    // Skip the row's own id from the searchable blob (it's noise)
    if (key === "id") continue;

    parts.push(String(value));
  }

  return parts.join(" ").toLowerCase();
}

export default function ConfigPage<T extends { id: string }>({
  spec,
}: {
  spec: ConfigSpec<T>;
}) {
  const { isEditor } = useAuth();
  const { success, error } = useToast();
  const lookups = useLookups();
  const { data, isLoading, error: loadError, refetch } = useTable<T>(
    spec.table,
    spec.orderBy
  );
  const mut = useMutateTable<T>(spec.table);

  const [params] = useSearchParams();
  const highlightId = params.get("highlight");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const rows = data ?? [];
  const entityLabel = spec.singular ?? spec.title.replace(/s$/, "");

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => buildSearchBlob(row, lookups).includes(q));
  }, [rows, query, lookups]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(row: T) {
    setEditing(row);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await mut.remove.mutateAsync(deleting.id);
      success(`${entityLabel} deleted`);
      setDeleting(null);
    } catch (err) {
      error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<T>[] = spec.columns.map((c) => ({
    key: c.key,
    label: c.label,
    align: c.align,
    render: (row) =>
      c.render
        ? c.render(row, lookups)
        : renderDefault((row as Record<string, unknown>)[c.key]),
  }));

  const actions = isEditor
    ? (row: T) => (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setDeleting(row)}
          >
            Delete
          </button>
        </>
      )
    : undefined;

  const showSearch = !isLoading && !loadError && rows.length > 0;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>{spec.title}</h3>
            <p>{spec.subtitle}</p>
          </div>
          <div className="right">
            {isEditor ? (
              <>
                {spec.import && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setImportOpen(true)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Import
                  </button>
                )}
                <button className="btn btn-primary btn-sm" onClick={openCreate}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add {entityLabel}
                </button>
              </>
            ) : (
              <span className="badge badge-neutral">
                Read-only · Admin or Editor
              </span>
            )}
          </div>
        </div>

        {showSearch && (
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
                minWidth: 220,
                background: "#f1f5f9",
                border: "1px solid transparent",
                borderRadius: 9,
                padding: "7px 11px",
                transition: ".15s",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.2"
                strokeLinecap="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder={`Search ${spec.title.toLowerCase()}…`}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 13,
                  width: "100%",
                  color: "var(--text)",
                  fontFamily: "inherit",
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--faint)",
                    padding: 2,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
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
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <span
              style={{
                fontSize: 12,
                color: "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
              {query
                ? `${filteredRows.length} of ${rows.length}`
                : `${rows.length} total`}
            </span>
          </div>
        )}

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
              rows={filteredRows}
              rowKey={(r) => r.id}
              actions={actions}
              emptyMessage={
                query
                  ? `No ${spec.title.toLowerCase()} match your search`
                  : "No records found."
              }
            />
          </div>
        )}
      </div>

      <ConfigFormModal
        open={formOpen}
        onClose={closeForm}
        onSaved={closeForm}
        table={spec.table}
        entityLabel={entityLabel}
        fields={spec.fields}
        row={editing}
      />

      {spec.import && (
        <ImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImported={() => {
            refetch();
          }}
          spec={spec.import}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Confirm deletion"
        message={
          deleting
            ? `Are you sure you want to delete this ${entityLabel.toLowerCase()}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function renderDefault(value: unknown) {
  if (value === null || value === undefined || value === "")
    return <span className="cell-sub">—</span>;
  if (typeof value === "boolean") return String(value);
  return String(value);
}