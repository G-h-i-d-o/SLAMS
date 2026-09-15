import type { MetricWizardForm } from "../../../types/metrics";
import type { WizardLookups } from "../../../hooks/useWizardLookups";
import { isValidMttrResolve } from "../../../types/metrics";

type Props = {
  form: MetricWizardForm;
  lookups: WizardLookups;
};

function resolveDisplay(v: string): string {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  return isValidMttrResolve(s) ? s.toUpperCase() === "TD" ? "TD" : s : s;
}

export default function Step6Review({ form, lookups }: Props) {
  const company = lookups.companies.find((c) => c.id === form.company_id);
  const supportGroup = lookups.supportGroups.find((g) => g.id === form.support_group_id);
  const site = lookups.sites.find((s) => s.id === form.site_id);
  const product = lookups.products.find((p) => p.id === form.product_category_id);
  const service = lookups.services.find((s) => s.id === form.service_id);
  const cluster = lookups.clusters.find((c) => c.id === form.cluster_id);
  const bh = (id: string) => lookups.businessHours.find((b) => b.id === id)?.label ?? "—";

  const showRespond = form.mttr_mode === "respond" || form.mttr_mode === "both";
  const showResolve = form.mttr_mode === "resolve" || form.mttr_mode === "both";

  return (
    <>
      <div className="review-block">
        <h4>Document</h4>
        <div className="review-grid">
          <div><span>Company</span><span>{company?.name ?? "—"}</span></div>
          <div><span>Customer #</span><span>{form.customer_number || "—"}</span></div>
          <div><span>Contact</span><span>{form.contact_company || "—"}</span></div>
          <div><span>Document ID</span><span>{form.document_id || "—"}</span></div>
          <div><span>Signed</span><span>{form.signed_date || "—"}</span></div>
        </div>
      </div>

      <div className="review-block">
        <h4>Support & Dates</h4>
        <div className="review-grid">
          <div><span>Support Group</span><span>{supportGroup?.name ?? "—"}</span></div>
          <div><span>Site</span><span>{site?.name ?? "—"}</span></div>
          <div><span>Start</span><span>{form.start_date || "—"}</span></div>
          <div><span>End</span><span>{form.end_date || "—"}</span></div>
        </div>
      </div>

      <div className="review-block">
        <h4>Product & Service</h4>
        <div className="review-grid">
          <div><span>Product</span><span>{product?.product_name ?? "—"}</span></div>
          <div><span>Tier</span><span>{product ? `${product.tier1} › ${product.tier2 ?? ""}` : "—"}</span></div>
          <div><span>Service Cat.</span><span>{form.service_category || "—"}</span></div>
          <div><span>Sub Cat.</span><span>{form.service_sub_category || "—"}</span></div>
          <div><span>Component</span><span>{service?.component ?? "—"}</span></div>
        </div>
      </div>

      <div className="review-block">
        <h4>SLA Terms</h4>
        <div className="review-grid">
          <div><span>% Roll-up</span><span>{form.rollup_performance || "—"}</span></div>
          <div><span>Tiered</span><span>{form.tiered_type || "—"}</span></div>
          <div><span>BH Critical</span><span>{bh(form.bh_critical)}</span></div>
          <div><span>BH High</span><span>{bh(form.bh_high)}</span></div>
          <div><span>BH Medium</span><span>{bh(form.bh_medium)}</span></div>
          <div><span>BH Low</span><span>{bh(form.bh_low)}</span></div>
        </div>
      </div>

      <div className="review-block">
        <h4>MTTR Targets ({form.mttr_mode || "not set"})</h4>
        <div className="review-grid">
          {showRespond && (
            <>
              <div><span>Resp. Critical</span><span>{form.mtt_respond_critical || "—"}</span></div>
              <div><span>Resp. High</span><span>{form.mtt_respond_high || "—"}</span></div>
              <div><span>Resp. Medium</span><span>{form.mtt_respond_medium || "—"}</span></div>
              <div><span>Resp. Low</span><span>{form.mtt_respond_low || "—"}</span></div>
            </>
          )}
          {showResolve && (
            <>
              <div><span>Res. Critical</span><span>{resolveDisplay(form.mtt_resolve_critical)}</span></div>
              <div><span>Res. High</span><span>{resolveDisplay(form.mtt_resolve_high)}</span></div>
              <div><span>Res. Medium</span><span>{resolveDisplay(form.mtt_resolve_medium)}</span></div>
              <div><span>Res. Low</span><span>{resolveDisplay(form.mtt_resolve_low)}</span></div>
            </>
          )}
        </div>
      </div>

      <div className="review-block">
        <h4>Cluster & Action</h4>
        <div className="review-grid">
          <div><span>Cluster</span><span>{cluster?.name ?? "—"}</span></div>
          <div><span>Vendor Group</span><span>{form.vendor_group || "—"}</span></div>
          <div><span>Action</span><span>{form.action || "—"}</span></div>
          <div><span>Exclude M7</span><span>{form.exclude_m7 ? "Yes" : "No"}</span></div>
        </div>
      </div>
    </>
  );
}