import type { MetricWizardForm } from "../../../types/metrics";
import type { WizardLookups } from "../../../hooks/useWizardLookups";

type Props = {
  form: MetricWizardForm;
  lookups: WizardLookups;
};

function resolveDisplay(v: string): string {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  return s.toUpperCase() === "TD" ? "TD" : s;
}

export default function Step6Review({ form, lookups }: Props) {
  const company = lookups.companies.find((c) => c.id === form.company_id);
  const site = lookups.sites.find((s) => s.id === form.site_id);
  const product = lookups.products.find(
    (p) => p.id === form.product_category_id
  );
  const cluster = lookups.clusters.find((c) => c.id === form.cluster_id);
  const bh = (id: string) =>
    lookups.businessHours.find((b) => b.id === id)?.label ?? "—";

  const showRespond =
    form.mttr_mode === "respond" || form.mttr_mode === "both";
  const showResolve =
    form.mttr_mode === "resolve" || form.mttr_mode === "both";

  // Resolve support group display paths
  const groupRows = (form.support_groups ?? [])
    .map((id, idx) => {
      const g = lookups.supportGroups.find((x) => x.id === id);
      if (!g) return null;
      const org = lookups.supportOrganizations.find(
        (o) => o.id === g.support_organization_id
      );
      const sgc = org
        ? lookups.supportGroupCompanies.find(
            (c) => c.id === org.support_group_company_id
          )
        : null;
      const path = [sgc?.name, org?.name, g.name].filter(Boolean).join(" › ");
      return { idx, path };
    })
    .filter(Boolean) as { idx: number; path: string }[];

  // Resolve service rows
  const serviceRows = (form.services ?? [])
    .map((s, idx) => {
      const svc = lookups.services.find((x) => x.id === s.service_id);
      if (!svc) return null;
      return {
        idx,
        category: svc.category,
        sub: svc.sub_category,
        component: svc.component,
      };
    })
    .filter(Boolean) as {
    idx: number;
    category: string;
    sub: string | null;
    component: string;
  }[];

  const totalMetrics = Math.max(1, groupRows.length) * Math.max(1, serviceRows.length);

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
        <h4>
          Support Groups ({groupRows.length})
        </h4>
        <div style={{ display: "grid", gap: 6 }}>
          {groupRows.length === 0 ? (
            <div className="cell-sub">None selected</div>
          ) : (
            groupRows.map((g) => (
              <div
                key={g.idx}
                style={{
                  fontSize: 12.5,
                  padding: "6px 10px",
                  background: "#fafbfd",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <strong style={{ color: "var(--primary)", marginRight: 8 }}>
                  #{g.idx + 1}
                </strong>
                {g.path}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="review-block">
        <h4>Site & Dates</h4>
        <div className="review-grid">
          <div><span>Site</span><span>{site?.name ?? "—"}</span></div>
          <div><span>Start</span><span>{form.start_date || "—"}</span></div>
          <div><span>End</span><span>{form.end_date || "—"}</span></div>
        </div>
      </div>

      <div className="review-block">
        <h4>Product</h4>
        <div className="review-grid">
          <div><span>Product</span><span>{product?.product_name ?? "—"}</span></div>
          <div>
            <span>Tier</span>
            <span>
              {product ? `${product.tier1} › ${product.tier2 ?? ""}` : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="review-block">
        <h4>Services ({serviceRows.length})</h4>
        <div style={{ display: "grid", gap: 6 }}>
          {serviceRows.length === 0 ? (
            <div className="cell-sub">None selected</div>
          ) : (
            serviceRows.map((s) => (
              <div
                key={s.idx}
                style={{
                  fontSize: 12.5,
                  padding: "6px 10px",
                  background: "#fafbfd",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <strong style={{ color: "var(--primary)", marginRight: 8 }}>
                  #{s.idx + 1}
                </strong>
                {s.category} › {s.sub ?? ""} › {s.component}
              </div>
            ))
          )}
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

      {/* Multi-metric warning */}
      {totalMetrics > 1 && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 12.5,
            lineHeight: 1.6,
          }}
        >
          <strong>Heads up:</strong> this will create{" "}
          <strong>{totalMetrics} metrics</strong> — {groupRows.length} support
          group{groupRows.length === 1 ? "" : "s"} ×{" "}
          {serviceRows.length} service{serviceRows.length === 1 ? "" : "s"}.
          Document IDs will be suffixed <code>_1</code>, <code>_2</code>, … to
          keep them unique.
        </div>
      )}
    </>
  );
}