import { ReactNode } from "react";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right";
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
};

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  actions,
  emptyMessage,
}: Props<T>) {
  const hasActions = !!actions;

  if (!rows.length) {
    return (
      <div className="empty">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <div>{emptyMessage ?? "No records found."}</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={c.align === "right" ? { textAlign: "right" } : undefined}
              >
                {c.label}
              </th>
            ))}
            {hasActions && <th style={{ textAlign: "right" }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} data-row-id={rowKey(row)}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={c.align === "right" ? { textAlign: "right" } : undefined}
                >
                  {c.render ? c.render(row) : String(row[c.key] ?? "")}
                </td>
              ))}
              {hasActions && (
                <td>
                  <div className="row-actions" role="group" aria-label="Row actions">
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}