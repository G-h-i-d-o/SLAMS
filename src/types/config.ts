import type { ReactNode } from "react";

export type Lookups = {
  companies: { id: string; name: string; external_id: string }[];
  supportOrganizations: { id: string; name: string }[];
  companyNameById: Record<string, string>;
  supportOrgNameById: Record<string, string>;
};

export type ColumnSpec<T> = {
  key: string;
  label: string;
  render?: (row: T, lookups: Lookups) => ReactNode;
  align?: "left" | "right";
};

export type FieldType = "text" | "number" | "select" | "checkbox" | "textarea";

export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  full?: boolean;
  default?: unknown;
  /** For select fields — returns the list of options given the current lookups. */
  options?: (lookups: Lookups) => { value: string; label: string }[];
  /** Coerce the raw form value before saving (e.g. empty string → null). */
  transform?: (value: unknown) => unknown;
};

export type ConfigSpec<T> = {
  table: string;
  title: string;
  subtitle: string;
  orderBy: string;
  columns: ColumnSpec<T>[];
  fields: FieldSpec[];
};