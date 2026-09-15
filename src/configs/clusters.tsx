import type { ConfigSpec } from "../types/config";

export type Cluster = {
  id: string;
  external_id: string;
  company_id: string;
  name: string;
  is_enabled: boolean;
};

export const clustersSpec: ConfigSpec<Cluster> = {
  table: "clusters",
  title: "Clusters",
  subtitle: "Customer cluster information",
  orderBy: "name",
  columns: [
    {
      key: "external_id",
      label: "External ID",
      render: (r) => <span className="cell-id">{r.external_id}</span>,
    },
    { key: "name", label: "Cluster", render: (r) => <span className="cell-strong">{r.name}</span> },
    {
      key: "company_id",
      label: "Company",
      render: (r, l) => l.companyNameById[r.company_id] ?? <span className="cell-sub">—</span>,
    },
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
  ],
  fields: [
    { key: "name", label: "Cluster Name", type: "text", required: true, full: true },
    {
      key: "company_id",
      label: "Company",
      type: "select",
      required: true,
      options: (l) => l.companies.map((c) => ({ value: c.id, label: c.name })),
    },
    { key: "is_enabled", label: "Enabled", type: "checkbox", default: true },
  ],
};