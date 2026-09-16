import type { ConfigSpec } from "../types/config";
import { importSpecs } from "../lib/import/specs";

export type SupportGroupCompany = {
  id: string;
  external_id: string;
  name: string;
  is_enabled: boolean;
};

export const supportGroupCompaniesSpec: ConfigSpec<SupportGroupCompany> = {
  table: "support_group_companies",
  title: "Support Group Companies",
  singular: "Support Group Company",
  subtitle: "Top tier — independent support companies",
  orderBy: "name",
  columns: [
    {
      key: "external_id",
      label: "External ID",
      render: (r) => <span className="cell-id">{r.external_id}</span>,
    },
    {
      key: "name",
      label: "Support Group Company",
      render: (r) => <span className="cell-strong">{r.name}</span>,
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
    { key: "name", label: "Support Group Company Name", type: "text", required: true, full: true },
    { key: "is_enabled", label: "Enabled", type: "checkbox", default: true },
  ],
  import: importSpecs.supportGroupCompanies,
};