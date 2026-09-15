import { supabase } from "../supabase";
import type { MetricWizardForm } from "../../types/metrics";

/**
 * Builds the JSON payload that the Postgres function `create_metric` expects.
 * Empty strings become null so Postgres can apply defaults / CHECK constraints.
 */
function toPayload(f: MetricWizardForm): Record<string, unknown> {
  const n = (v: string) => (String(v ?? "").trim() === "" ? null : String(v).trim());

  return {
    document_id: f.document_id.trim(),
    company_id: f.company_id,
    customer_number: f.customer_number.trim(),
    contact_company: f.contact_company.trim(),
    support_group_id: f.support_group_id,
    site_id: n(f.site_id),
    product_category_id: f.product_category_id,
    service_id: f.service_id,
    start_date: f.start_date,
    end_date: f.end_date,
    signed_date: f.signed_date,
    rollup_performance: Number(f.rollup_performance) || 0,
    tiered_type: f.tiered_type,
    bh_critical: f.bh_critical,
    bh_high: f.bh_high,
    bh_medium: f.bh_medium,
    bh_low: f.bh_low,
    mttr_mode: f.mttr_mode,
    mtt_respond_critical: n(f.mtt_respond_critical),
    mtt_resolve_critical: n(f.mtt_resolve_critical),
    mtt_respond_high: n(f.mtt_respond_high),
    mtt_resolve_high: n(f.mtt_resolve_high),
    mtt_respond_medium: n(f.mtt_respond_medium),
    mtt_resolve_medium: n(f.mtt_resolve_medium),
    mtt_respond_low: n(f.mtt_respond_low),
    mtt_resolve_low: n(f.mtt_resolve_low),
    cluster_id: f.cluster_id,
    vendor_group: n(f.vendor_group),
    exclude_m7: !!f.exclude_m7,
    action: f.action || "New",
  };
}

export async function createMetric(form: MetricWizardForm): Promise<string> {
  const { data, error } = await supabase.rpc("create_metric", {
    payload: toPayload(form),
  });
  if (error) throw new Error(error.message);
  return data as string;
}