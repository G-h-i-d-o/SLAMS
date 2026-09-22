import { useEffect, useState } from "react";
import Modal from "./Modal";
import FieldRenderer from "./FieldRenderer";
import { useToast } from "../../contexts/ToastContext";
import { useLookups } from "../../contexts/LookupsContext";
import { useMutateTable } from "../../hooks/useTable";
import type { FieldSpec } from "../../types/config";

type Props<T extends { id: string }> = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  table: string;
  entityLabel: string;
  fields: FieldSpec[];
  row: T | null;
};

/**
 * Translate Postgres error messages into human-friendly text.
 */
function friendlyDbError(msg: string, entityLabel: string): string {
  const lower = msg.toLowerCase();

  if (
    lower.includes("duplicate key") ||
    lower.includes("unique constraint") ||
    lower.includes("unique index")
  ) {
    return `A ${entityLabel.toLowerCase()} with these details already exists. Use different values.`;
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "You don't have permission to make this change.";
  }
  if (lower.includes("violates foreign key")) {
    return "This record is referenced by other data and can't be changed this way.";
  }
  if (lower.includes("violates not-null")) {
    return "A required field is missing.";
  }
  return msg;
}

export default function ConfigFormModal<T extends { id: string }>({
  open,
  onClose,
  onSaved,
  table,
  entityLabel,
  fields,
  row,
}: Props<T>) {
  const { success, error } = useToast();
  const lookups = useLookups();
  const mut = useMutateTable<T>(table);

  const [form, setForm] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const init: Record<string, unknown> = {};
    for (const f of fields) {
      const existing = row ? (row as Record<string, unknown>)[f.key] : undefined;
      if (existing !== undefined && existing !== null) init[f.key] = existing;
      else if (f.type === "checkbox") init[f.key] = f.default ?? true;
      else init[f.key] = f.default ?? "";
    }
    setForm(init);
    setBusy(false);
  }, [open, row, fields]);

  function setField(key: string, v: unknown) {
    setForm((prev) => ({ ...prev, [key]: v }));
  }

  async function submit() {
    for (const f of fields) {
      if (!f.required) continue;
      const v = form[f.key];
      if (v === undefined || v === null || String(v).trim() === "") {
        error(`${f.label} is required`);
        return;
      }
    }

    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      let v = form[f.key];
      if (f.transform) v = f.transform(v);
      payload[f.key] = v;
    }

    setBusy(true);
    try {
      if (row) {
        await mut.update.mutateAsync({ id: row.id, patch: payload });
        success(`${entityLabel} updated`);
      } else {
        await mut.create.mutateAsync(payload);
        success(`${entityLabel} created`);
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      error(friendlyDbError(msg, entityLabel));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${row ? "Edit" : "New"} ${entityLabel}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : row ? "Save changes" : "Create"}
          </button>
        </>
      }
    >
      {!row && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 11.5,
            color: "#1e40af",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            A unique <strong>External ID</strong> will be assigned automatically
            by the system. Duplicate names are rejected.
          </div>
        </div>
      )}

      <div className="form-grid">
        {fields.map((f) => (
          <FieldRenderer
            key={f.key}
            field={f}
            value={form[f.key]}
            onChange={(v) => setField(f.key, v)}
            lookups={lookups}
          />
        ))}
      </div>
    </Modal>
  );
}