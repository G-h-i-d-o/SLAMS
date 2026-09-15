import { ReactNode } from "react";

type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  full?: boolean;
};

export function FormField({ label, required, hint, children, full }: FieldProps) {
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "email" | "number" | "date";
  hint?: string;
  full?: boolean;
};

export function TextField({
  label, value, onChange, required, placeholder, type = "text", hint, full,
}: TextFieldProps) {
  return (
    <FormField label={label} required={required} hint={hint} full={full}>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  full?: boolean;
};

export function SelectField({
  label, value, onChange, options, required, hint, full,
}: SelectFieldProps) {
  return (
    <FormField label={label} required={required} hint={hint} full={full}>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="checkbox-field">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
    </label>
  );
}