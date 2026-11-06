import type { MetricWizardForm } from "../../../types/metrics";
import { multiplierFor } from "../../../types/metrics";
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
  const cluster = lookups.clusters.find((c) => c.id === form.cluster_id);
  const bh = (id: string) =>
    lookups.businessHours.find((b) => b.id === id)?.label ?? "—";

  const showRespond =
    form.mttr_mode === "respond" || form.mttr_mode === "both";
  const showResolve =
    form.mttr_mode === "resolve" || form.mttr_mode === "both";

  const groupRows = (form.support_groups ?? [])
    .filter(Boolean)
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

  const siteRows = (form.sites ?? [])
    .filter(Boolean)
    .map((id, idx) => {
      const s = lookups.sites.find((x) => x.id === id);
      return s ? { idx, name: s.name } : null;
    })
    .filter(Boolean) as { idx: number; name: string }[];

  const productRows = (form.products ?? [])
    .filter(Boolean)
    .map((id, idx) => {
      const p = lookups.products.find((x) => x.id === id);
      if (!p) return null;
      return {
        idx,
        name: p.product_name,
        path: `${p.tier1} › ${p.tier2 ?? ""} › ${p.tier3 ?? ""}`,
      };
    })
    .filter(Boolean) as { idx: number; name: string; path: string }[];

  const serviceRows = (form.services ?? [])
    .filter((s) => s.service_id)
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

  // Cross-product total
  const sgMultiplier = Math.max(1, groupRows.length);
  const svcMultiplier = Math.max(1, serviceRows.length);
  const siteMultiplier = multiplierFor(form.sites);
  const prodMultiplier = multiplierFor(form.products);
  const totalMetrics =
    sgMultiplier * svcMultiplier * siteMultiplier * prodMultiplier;

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
        <h4>Support Groups ({groupRows.length})</h4>
        {groupRows.length === 0 ? (
          <div className="cell-sub">None selected</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {groupRows.map((g) => (
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
            ))}
          </div>
        )}
      </div>

      <div className="review-block">
        <h4>
          Sites ({siteRows.length > 0 ? siteRows.length : "None"})
        </h4>
        {siteRows.length === 0 ? (
          <div className="cell-sub">No site — site stays blank on all metrics</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {siteRows.map((s) => (
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
                {s.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="review-block">
        <h4>Dates</h4>
        <div className="review-grid">
          <div><span>Start</span><span>{form.start_date || "—"}</span></div>
          <div><span>End</span><span>{form.end_date || "—"}</span></div>
        </div>
      </div>

      <div className="review-block">
        <h4>
          Products ({productRows.length > 0 ? productRows.length : "None"})
        </h4>
        {productRows.length === 0 ? (
          <div className="cell-sub">
            No product — product stays blank on all metrics
          </div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {productRows.map((p) => (
              <div
                key={p.idx}
                style={{
                  fontSize: 12.5,
                  padding: "6px 10px",
                  background: "#fafbfd",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <strong style={{ color: "var(--primary)", marginRight: 8 }}>
                  #{p.idx + 1}
                </strong>
                {p.name}
                <span className="cell-sub" style={{ marginLeft: 8 }}>
                  · {p.path}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="review-block">
        <h4>Services ({serviceRows.length})</h4>
        {serviceRows.length === 0 ? (
          <div className="cell-sub">None selected</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {serviceRows.map((s) => (
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
            ))}
          </div>
        )}
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

      {totalMetrics > 1 && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 12.5,
            lineHeight: 1.7,
          }}
        >
          <strong>Heads up:</strong> this will create{" "}
          <strong>{totalMetrics} metrics</strong>{" "}
          <span style={{ fontSize: 11.5 }}>
            ({sgMultiplier} group{sgMultiplier === 1 ? "" : "s"} ×{" "}
            {svcMultiplier} service{svcMultiplier === 1 ? "" : "s"} ×{" "}
            {siteMultiplier} site{siteMultiplier === 1 ? "" : "s"} ×{" "}
            {prodMultiplier} product{prodMultiplier === 1 ? "" : "s"})
          </span>
          . They'll share the same Document ID, show as one row in History, and
          export as one Excel sheet.
        </div>
      )}
    </>
  );
}