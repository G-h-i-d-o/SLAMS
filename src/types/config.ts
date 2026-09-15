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
  options?: (lookups: Lookups) => { value: string; label: string }[];
  transform?: (value: unknown) => unknown;
};

/* ---- Import types ---- */

export type ImportColumn = {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[];
  /**
   * Optional FK resolver. Called for each cell value.
   *   - return undefined  → cell is blank; column gets NULL
   *   - return null       → value not found; row is flagged as error
   *   - return string     → resolved id
   */
  resolve?: (rawValue: string, lookups: Lookups) => string | null | undefined;
  resolveHint?: string;
};

export type ImportSpec = {
  table: string;
  title: string;
  columns: ImportColumn[];
  /** One sample row used when generating the download template. */
  sample: Record<string, string>;
};

export type ConfigSpec<T> = {
  table: string;
  title: string;
  /** Singular form used for buttons like "Add Company". Falls back to title without trailing "s". */
  singular?: string;
  subtitle: string;
  orderBy: string;
  columns: ColumnSpec<T>[];
  fields: FieldSpec[];
  import?: ImportSpec;
};