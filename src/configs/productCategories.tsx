import type { ConfigSpec } from "../types/config";
import { importSpecs } from "../lib/import/specs";

export type ProductCategory = {
  id: string;
  external_id: string;
  company_id: string | null;
  tier1: string;
  tier2: string | null;
  tier3: string | null;
  product_name: string;
  is_enabled: boolean;
};

export const productCategoriesSpec: ConfigSpec<ProductCategory> = {
  table: "product_categories",
  title: "Product Categories",
  singular: "Product",
  subtitle: "Product Tier 1 → Tier 2 → Tier 3 → Product Name",
  orderBy: "tier1",
  columns: [
    {
      key: "external_id",
      label: "External ID",
      render: (r) => <span className="cell-id">{r.external_id}</span>,
    },
    { key: "tier1", label: "Tier 1" },
    { key: "tier2", label: "Tier 2" },
    { key: "tier3", label: "Tier 3" },
    { key: "product_name", label: "Product Name", render: (r) => <span className="cell-strong">{r.product_name}</span> },
    {
      key: "company_id",
      label: "Scope",
      render: (r, l) =>
        r.company_id ? (
          l.companyNameById[r.company_id] ?? "—"
        ) : (
          <span className="badge badge-info">Global</span>
        ),
    },
  ],
  fields: [
    { key: "tier1", label: "Product Tier 1", type: "text", required: true },
    { key: "tier2", label: "Product Tier 2", type: "text" },
    { key: "tier3", label: "Product Tier 3", type: "text" },
    { key: "product_name", label: "Product Name", type: "text", required: true },
    {
      key: "company_id",
      label: "Exclusive Company (optional)",
      type: "select",
      hint: "Leave blank for Global",
      options: (l) => l.companies.map((c) => ({ value: c.id, label: c.name })),
      transform: (v) => (v === "" || v === null || v === undefined ? null : v),
    },
    { key: "is_enabled", label: "Enabled", type: "checkbox", default: true },
  ],
  import: importSpecs.products,
};