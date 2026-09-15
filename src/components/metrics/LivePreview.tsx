import type { MetricWizardForm } from "../../types/metrics";
import type { WizardLookups } from "../../hooks/useWizardLookups";

type Props = {
  form: MetricWizardForm;
  lookups: WizardLookups;
  step: number;
};

export default function LivePreview({ form, lookups, step }: Props) {
  const companyName =
    lookups.companies.find((c) => c.id === form.company_id)?.name ?? "";
  const product = lookups.products.find((p) => p.id === form.product_category_id);
  const service = lookups.services.find((s) => s.id === form.service_id);
  const supportGroup = lookups.supportGroups.find((g) => g.id === form.support_group_id);
  const site = lookups.sites.find((s) => s.id === form.site_id);
  const cluster = lookups.clusters.find((c) => c.id === form.cluster_id);

  return (
    <div>
      <div className="preview-card" style={{ marginBottom: 16 }}>
        <div className="pc-label">Live Preview</div>
        <div className="pc-name">{form.document_id || "New Metric"}</div>
        <div style={{ fontSize: 12, color: "#c7d2fe", position: "relative", zIndex: 1 }}>
          {companyName || "— select company —"}
        </div>

        <div className="pc-chips">
          {form.action && <span className="pc-chip">{form.action}</span>}
          {form.tiered_type && <span className="pc-chip">{form.tiered_type}</span>}
          {form.rollup_performance && <span className="pc-chip">{form.rollup_performance}% roll-up</span>}
          {form.mttr_mode && <span className="pc-chip">MTTR: {form.mttr_mode}</span>}
        </div>

        <div className="pc-rows">
          <div className="pc-row"><span>Customer #</span><span>{form.customer_number || "—"}</span></div>
          <div className="pc-row"><span>Contact</span><span>{form.contact_company || "—"}</span></div>
          <div className="pc-row"><span>Support Group</span><span>{supportGroup?.name ?? "—"}</span></div>
          <div className="pc-row"><span>Site</span><span>{site?.name ?? "—"}</span></div>
          <div className="pc-row"><span>Product</span><span>{product?.product_name ?? "—"}</span></div>
          <div className="pc-row"><span>Service</span><span>{service?.component ?? "—"}</span></div>
          <div className="pc-row"><span>Dates</span><span>{form.start_date || "—"} → {form.end_date || "—"}</span></div>
          <div className="pc-row"><span>Cluster</span><span>{cluster?.name ?? "—"}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Progress</h3>
        </div>
        <div className="card-body">
          <div style={{ height: 6, background: "#eef2f7", borderRadius: 20, overflow: "hidden" }}>
            <div
              style={{
                width: `${(step / 6) * 100}%`,
                height: "100%",
                background: "var(--primary)",
                transition: "width .6s",
              }}
            />
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "#64748b", marginTop: 10 }}>
            Step {step} of 6
          </div>
        </div>
      </div>
    </div>
  );
}