import type { ConfigSpec } from "../types/config";
import { fmtDate } from "../lib/utils";

export type Company = {
  id: string;
  external_id: string;
  customer_number: string | null;
  name: string;
  is_enabled: boolean;
  created_at: string;
};

export const companiesSpec: ConfigSpec<Company> = {
  table: "companies",
  title: "Companies",
  subtitle: "Client organisations under SLA contract",
  orderBy: "name",
  columns: [
    {
      key: "external_id",
      label: "External ID",
      render: (r) => <span className="cell-id">{r.external_id}</span>,
    },
    { key: "name", label: "Company Name", render: (r) => <span className="cell-strong">{r.name}</span> },
    { key: "customer_number", label: "Customer #" },
    {
      key: "is_enabled",
      label: "Status",
      render: (r) =>
        r.is_enabled ? (
          <span className="badge badge-success">Enabled</span>
        ) : (
          <span className="badge badge-neutral">Disabled</span>
        ),
    },
    { key: "created_at", label: "Created", render: (r) => <span className="cell-sub">{fmtDate(r.created_at)}</span> },
  ],
  fields: [
    { key: "name", label: "Company Name", type: "text", required: true, full: true },
    { key: "customer_number", label: "Customer Number", type: "text" },
    { key: "is_enabled", label: "Enabled", type: "checkbox", default: true },
  ],
};