import type { ImportColumn, Lookups } from "../../types/config";

export type ValidatedRow = {
  index: number;
  raw: Record<string, unknown>;
  resolved: Record<string, unknown>;
  errors: string[];
};

export function validateRows(
  rows: Record<string, unknown>[],
  mappedHeaders: Record<string, string | null>,
  columns: ImportColumn[],
  lookups: Lookups
): ValidatedRow[] {
  return rows.map((raw, index) => {
    const resolved: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const col of columns) {
      const header = mappedHeaders[col.key];
      if (!header) {
        if (col.required) errors.push(`${col.label}: column not found`);
        continue;
      }
      const rawVal = String(raw[header] ?? "").trim();

      if (col.required && !rawVal) {
        errors.push(`${col.label} is required`);
        continue;
      }

      if (col.resolve) {
        const r = col.resolve(rawVal, lookups);
        if (r === null) {
          errors.push(`${col.label}: "${rawVal}" not found`);
        } else if (r === undefined) {
          resolved[col.key] = null;
        } else {
          resolved[col.key] = r;
        }
      } else {
        resolved[col.key] = rawVal || null;
      }
    }

    return { index, raw, resolved, errors };
  });
}