import type { ConfigSpec } from "../types/config";
import { importSpecs } from "../lib/import/specs";

export type SupportGroup = {
  id: string;
  external_id: string;
  support_organization_id: string;
  name: string;
  is_enabled: boolean;
};

export const supportGroupsSpec: ConfigSpec<SupportGroup> = {
  table: "support_groups",
  title: "Support Groups",
  subtitle: "Support Company → Support Org → Support Group",
  orderBy: "name",
  columns: [
    {
      key: "external_id",
      label: "External ID",
      render: (r) => <span className="cell-id">{r.external_id}</span>,
    },
    { key: "name", label: "Support Group", render: (r) => <span className="cell-strong">{r.name}</span> },
    {
      key: "support_organization_id",
      label: "Support Organization",
      render: (r, l) => l.supportOrgNameById[r.support_organization_id] ?? <span className="cell-sub">—</span>,
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
    { key: "name", label: "Support Group Name", type: "text", required: true, full: true },
    {
      key: "support_organization_id",
      label: "Support Organization",
      type: "select",
      required: true,
      options: (l) => l.supportOrganizations.map((o) => ({ value: o.id, label: o.name })),
    },
    { key: "is_enabled", label: "Enabled", type: "checkbox", default: true },
  ],
  import: importSpecs.groups,
};