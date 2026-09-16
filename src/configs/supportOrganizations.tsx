import type { ConfigSpec } from "../types/config";
import { importSpecs } from "../lib/import/specs";

export type SupportOrganization = {
  id: string;
  external_id: string;
  support_group_company_id: string;
  name: string;
  is_enabled: boolean;
};

export const supportOrganizationsSpec: ConfigSpec<SupportOrganization> = {
  table: "support_organizations",
  title: "Support Organizations",
  singular: "Support Organization",
  subtitle: "Middle tier — organizational units inside a Support Group Company",
  orderBy: "name",
  columns: [
    {
      key: "external_id",
      label: "External ID",
      render: (r) => <span className="cell-id">{r.external_id}</span>,
    },
    {
      key: "name",
      label: "Support Organization",
      render: (r) => <span className="cell-strong">{r.name}</span>,
    },
    {
      key: "support_group_company_id",
      label: "Support Group Company",
      render: (r, l) =>
        l.supportGroupCompanyNameById[r.support_group_company_id] ?? (
          <span className="cell-sub">—</span>
        ),
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
    { key: "name", label: "Support Organization Name", type: "text", required: true, full: true },
    {
      key: "support_group_company_id",
      label: "Support Group Company",
      type: "select",
      required: true,
      options: (l) =>
        l.supportGroupCompanies.map((c) => ({ value: c.id, label: c.name })),
    },
    { key: "is_enabled", label: "Enabled", type: "checkbox", default: true },
  ],
  import: importSpecs.supportOrganizations,
};