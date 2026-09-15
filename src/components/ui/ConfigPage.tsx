import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable, { Column } from "./DataTable";
import ConfigFormModal from "./ConfigFormModal";
import ConfirmDialog from "./ConfirmDialog";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useLookups } from "../../contexts/LookupsContext";
import { useTable, useMutateTable } from "../../hooks/useTable";
import type { ConfigSpec } from "../../types/config";

export default function ConfigPage<T extends { id: string }>({ spec }: { spec: ConfigSpec<T> }) {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();
  const lookups = useLookups();
  const { data, isLoading, error: loadError } = useTable<T>(spec.table, spec.orderBy);
  const mut = useMutateTable<T>(spec.table);

  const [params] = useSearchParams();
  const highlightId = params.get("highlight");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = data ?? [];

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(row: T) {
    setEditing(row);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await mut.remove.mutateAsync(deleting.id);
      success(`${spec.title.replace(/s$/, "")} deleted`);
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
    render: (row) => (c.render ? c.render(row, lookups) : renderDefault((row as Record<string, unknown>)[c.key])),
  }));

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
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add {spec.title.replace(/s$/, "")}
              </button>
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
          <div className={highlightId ? "" : ""}>
            <DataTableWrap
              columns={columns}
              rows={rows}
              rowKey={(r) => r.id}
              highlightId={highlightId}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={(r) => setDeleting(r)}
            />
          </div>
        )}
      </div>

      <ConfigFormModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={closeModal}
        table={spec.table}
        entityLabel={spec.title.replace(/s$/, "")}
        fields={spec.fields}
        row={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Confirm deletion"
        message={
          deleting
            ? `Are you sure you want to delete this ${spec.title.replace(/s$/, "").toLowerCase()}? This cannot be undone.`
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
  if (value === null || value === undefined || value === "") return <span className="cell-sub">—</span>;
  if (typeof value === "boolean") return String(value);
  return String(value);
}

/** Wraps DataTable to inject the row-highlight class based on the URL param. */
function DataTableWrap<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  highlightId,
  isAdmin,
  onEdit,
  onDelete,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (r: T) => string;
  highlightId: string | null;
  isAdmin: boolean;
  onEdit: (r: T) => void;
  onDelete: (r: T) => void;
}) {
  const actions = isAdmin
    ? (row: T) => (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(row)}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(row)}>
            Delete
          </button>
        </>
      )
    : undefined;

  // DataTable doesn't support per-row classes, so we render it then patch
  // the highlighting on the wrapper via a MutationObserver-free approach:
  // simply find the row after mount.
  return (
    <div
      className={highlightId ? "has-highlight" : ""}
      ref={(el) => {
        if (!el || !highlightId) return;
        const tr = el.querySelector(`tr[data-row-id="${highlightId}"]`) as HTMLTableRowElement | null;
        if (tr) {
          tr.classList.add("row-highlight");
          tr.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }}
    >
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => {
          const id = rowKey(r);
          return id;
        }}
        actions={actions}
      />
    </div>
  );
}