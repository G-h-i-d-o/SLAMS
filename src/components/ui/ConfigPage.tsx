import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable, { Column } from "./DataTable";
import ConfigFormModal from "./ConfigFormModal";
import ConfirmDialog from "./ConfirmDialog";
import ImportModal from "./ImportModal";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useLookups } from "../../contexts/LookupsContext";
import { useTable, useMutateTable } from "../../hooks/useTable";
import type { ConfigSpec } from "../../types/config";

export default function ConfigPage<T extends { id: string }>({ spec }: { spec: ConfigSpec<T> }) {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();
  const lookups = useLookups();
  const { data, isLoading, error: loadError, refetch } = useTable<T>(spec.table, spec.orderBy);
  const mut = useMutateTable<T>(spec.table);

  const [params] = useSearchParams();
  const highlightId = params.get("highlight");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = data ?? [];
  const entityLabel = spec.title.replace(/s$/, "");

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

  const actions = isAdmin
    ? (row: T) => (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleting(row)}>
            Delete
          </button>
        </>
      )
    : undefined;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>{spec.title}</h3>
            <p>{spec.subtitle}</p>
          </div>
          <div className="right">
            {isAdmin ? (
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
              <span className="badge badge-neutral">Read-only · Admin only</span>
            )}
          </div>
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
              rows={rows}
              rowKey={(r) => r.id}
              actions={actions}
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
          onImported={() => { refetch(); }}
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