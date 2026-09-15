export type MttrMode = "" | "respond" | "resolve" | "both";
export type TieredType = "" | "Tiered" | "Configured" | "Non Catalogued";
export type MetricAction = "" | "New" | "Modify" | "Expire" | "Terminate";

export type MetricWizardForm = {
  company_id: string;
  customer_number: string;
  contact_company: string;
  document_id: string;
  signed_date: string;

  support_group_id: string;
  site_id: string;
  start_date: string;
  end_date: string;

  product_category_id: string;
  service_category: string;
  service_sub_category: string;
  service_id: string;

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
  site_id: "",
  start_date: "",
  end_date: "",
  product_category_id: "",
  service_category: "",
  service_sub_category: "",
  service_id: "",
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