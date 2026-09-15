import type { ConfigSpec } from "../types/config";

export type Service = {
  id: string;
  external_id: string;
  category: string;
  sub_category: string | null;
  component: string;
  component_mpss: string | null;
  is_enabled: boolean;
};

export const servicesSpec: ConfigSpec<Service> = {
  table: "services",
  title: "Services",
  subtitle: "Service Category → Sub Category → Component",
  orderBy: "category",
  columns: [
    {
      key: "external_id",
      label: "External ID",
      render: (r) => <span className="cell-id">{r.external_id}</span>,
    },
    { key: "category", label: "Category" },
    { key: "sub_category", label: "Sub Category" },
    { key: "component", label: "Component", render: (r) => <span className="cell-strong">{r.component}</span> },
    { key: "component_mpss", label: "Component (MPSS)", render: (r) => r.component_mpss || <span className="cell-sub">—</span> },
  ],
  fields: [
    { key: "category", label: "Service Category", type: "text", required: true },
    { key: "sub_category", label: "Service Sub Category", type: "text" },
    { key: "component", label: "Service Component", type: "text", required: true, full: true },
    { key: "component_mpss", label: "Component (MPSS)", type: "text" },
    { key: "is_enabled", label: "Enabled", type: "checkbox", default: true },
  ],
};