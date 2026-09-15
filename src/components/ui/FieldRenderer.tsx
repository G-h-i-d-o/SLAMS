import type { FieldSpec, Lookups } from "../../types/config";

type Props = {
  field: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
  lookups: Lookups;
};

export default function FieldRenderer({ field, value, onChange, lookups }: Props) {
  // Checkbox is special-cased — no wrapper label.
  if (field.type === "checkbox") {
    return (
      <label className={`checkbox-field ${field.full ? "full" : ""}`}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>
          {field.label}
          {field.required && <span className="req"> *</span>}
        </span>
      </label>
    );
  }

  return (
    <div className={`field ${field.full ? "full" : ""}`}>
      <label>
        {field.label}
        {field.required && <span className="req"> *</span>}
      </label>

      {field.type === "select" ? (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {(field.options ? field.options(lookups) : []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={(e) =>
            onChange(field.type === "number" ? Number(e.target.value) : e.target.value)
          }
        />
      )}

      {field.hint && <span className="hint">{field.hint}</span>}
    </div>
  );
}