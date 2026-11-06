export type MttrMode = "" | "respond" | "resolve" | "both";
export type TieredType = "" | "Tiered" | "Configured" | "Non Catalogued";
export type MetricAction = "" | "New" | "Modify" | "Expire" | "Terminate";

export type ServiceSelection = {
  category: string;
  sub_category: string;
  service_id: string;
};

export type MetricWizardForm = {
  company_id: string;
  customer_number: string;
  contact_company: string;
  document_id: string;
  signed_date: string;

  // Support groups — single (flat) OR multiple (array).
  support_group_id: string;
  support_group_count: number;
  support_groups: string[];

  // Sites — -1 = undecided, 0 = explicitly none, 1 = single, N > 1 = multiple.
  site_id: string;
  site_count: number;
  sites: string[];

  start_date: string;
  end_date: string;

  // Products — same convention as sites.
  product_category_id: string;
  product_count: number;
  products: string[];

  // Services — single OR multiple.
  service_category: string;
  service_sub_category: string;
  service_id: string;
  service_count: number;
  services: ServiceSelection[];

  rollup_performance: string;
  tiered_type: TieredType;
  bh_critical: string;
  bh_high: string;
  bh_medium: string;
  bh_low: string;

  mttr_mode: MttrMode;
  mttr_preset_id: string;
  mtt_respond_critical: string;
  mtt_resolve_critical: string;
  mtt_respond_high: string;
  mtt_resolve_high: string;
  mtt_respond_medium: string;
  mtt_resolve_medium: string;
  mtt_respond_low: string;
  mtt_resolve_low: string;

  cluster_id: string;
  vendor_group: string;
  action: MetricAction;
  exclude_m7: boolean;
};

export const EMPTY_WIZARD_FORM: MetricWizardForm = {
  company_id: "",
  customer_number: "",
  contact_company: "",
  document_id: "",
  signed_date: "",

  support_group_id: "",
  support_group_count: 0,
  support_groups: [],

  site_id: "",
  site_count: -1,
  sites: [],

  start_date: "",
  end_date: "",

  product_category_id: "",
  product_count: -1,
  products: [],

  service_category: "",
  service_sub_category: "",
  service_id: "",
  service_count: 0,
  services: [],

  rollup_performance: "90",
  tiered_type: "Configured",
  bh_critical: "",
  bh_high: "",
  bh_medium: "",
  bh_low: "",

  mttr_mode: "",
  mttr_preset_id: "",
  mtt_respond_critical: "",
  mtt_resolve_critical: "",
  mtt_respond_high: "",
  mtt_resolve_high: "",
  mtt_respond_medium: "",
  mtt_resolve_medium: "",
  mtt_respond_low: "",
  mtt_resolve_low: "",

  cluster_id: "",
  vendor_group: "",
  action: "New",
  exclude_m7: false,
};

export function isValidMttrResolve(v: string): boolean {
  const s = String(v ?? "").trim();
  if (!s) return true;
  if (s.toUpperCase() === "TD") return true;
  return /^\d+(\.\d+)?$/.test(s);
}

export const WIZARD_STEPS = [
  { n: 1, title: "Company & Document" },
  { n: 2, title: "Support & Site" },
  { n: 3, title: "Product & Service" },
  { n: 4, title: "SLA Terms" },
  { n: 5, title: "Cluster & Action" },
  { n: 6, title: "Review" },
];

export function makeEmptyService(): ServiceSelection {
  return { category: "", sub_category: "", service_id: "" };
}

export function resizeArray<T>(
  current: T[],
  targetLength: number,
  makeDefault: () => T
): T[] {
  return Array.from(
    { length: targetLength },
    (_, i) => current[i] ?? makeDefault()
  );
}

/** How many values this dimension contributes to the cross-product. */
export function multiplierFor(items: string[] | undefined): number {
  const count = (items ?? []).filter(Boolean).length;
  return count > 0 ? count : 1;
}

/** The list of items to iterate over — falls back to one blank if empty. */
export function iterableFor(items: string[] | undefined): string[] {
  const list = (items ?? []).filter(Boolean);
  return list.length > 0 ? list : [""];
}

export type MetricFull = {
  id: string;
  document_id: string;
  revision_number: number;
  batch_id: string | null;

  company_id: string;
  company_name: string | null;
  company_external_id: string | null;

  customer_number: string;
  contact_company: string;

  support_group_id: string;
  support_group_name: string | null;

  site_id: string | null;
  site_name: string | null;

  product_category_id: string | null;
  product_tier1: string | null;
  product_tier2: string | null;
  product_tier3: string | null;
  product_name: string | null;

  service_id: string;
  service_category: string | null;
  service_sub_category: string | null;
  service_component: string | null;
  service_component_mpss: string | null;

  start_date: string;
  end_date: string;
  signed_date: string;

  rollup_performance: number;
  tiered_type: string;

  bh_critical: string;
  bh_critical_label: string | null;
  bh_high: string;
  bh_high_label: string | null;
  bh_medium: string;
  bh_medium_label: string | null;
  bh_low: string;
  bh_low_label: string | null;

  mttr_mode: string;
  mtt_respond_critical: number | null;
  mtt_resolve_critical: string | null;
  mtt_respond_high: number | null;
  mtt_resolve_high: string | null;
  mtt_respond_medium: number | null;
  mtt_resolve_medium: string | null;
  mtt_respond_low: number | null;
  mtt_resolve_low: string | null;

  cluster_id: string | null;
  cluster_name: string | null;

  vendor_group: string | null;
  exclude_m7: boolean;
  status: string;
  is_current: boolean;

  created_by: string | null;
  created_at: string;
  updated_at: string;

  revision_action: string | null;
  effective_from: string | null;
  effective_to: string | null;
};