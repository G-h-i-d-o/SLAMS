import { useMemo } from "react";
import type { MetricFull } from "../../types/metrics";
import type { TreeSelection, ProductRow } from "./CategoryTree";
import { fmtDate } from "../../lib/utils";

type Props = {
  selection: TreeSelection;
  products: ProductRow[];
  metrics: MetricFull[];
};

export default function CategoryDetail({ selection, products, metrics }: Props) {
  const { title, subtitle, selectedProducts } = useMemo(
    () => resolveSelection(selection, products),
    [selection, products]
  );

  const productIds = useMemo(
    () => new Set(selectedProducts.map((p) => p.id)),
    [selectedProducts]
  );

  const branchMetrics = useMemo(
    () =>
      metrics
        .filter((m) => productIds.has(m.product_category_id))
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [metrics, productIds]
  );

  const completeness = useMemo(() => {
    if (!branchMetrics.length) return 0;
    const ok = branchMetrics.filter((m) => isFullyConfigured(m)).length;
    return Math.round((ok / branchMetrics.length) * 100);
  }, [branchMetrics]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-.3px" }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Stat strip */}
      <div
        style={{
          display: "flex",
          gap: 22,
          flexWrap: "wrap",
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Stat label="Products" value={selectedProducts.length} />
        <Stat label="Metrics" value={branchMetrics.length} />
        <Stat
          label="MTTR Completeness"
          value={`${completeness}%`}
          color={
            completeness >= 90 ? "#10b981" : completeness >= 60 ? "#f59e0b" : "#ef4444"
          }
        />
      </div>

      {/* Metrics table */}
      {branchMetrics.length === 0 ? (
        <div className="empty" style={{ padding: 30 }}>
          No metrics use {selection.kind === "all" ? "any product" : "these products"} yet.
        </div>
      ) : (
        <div
          style={{
            maxHeight: 380,
            overflow: "auto",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}
        >
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Document ID</th>
                <th>Company</th>
                <th>Product</th>
                <th>MTTR</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {branchMetrics.map((m) => (
                <tr key={m.id}>
                  <td className="cell-mono">{m.document_id}</td>
                  <td className="cell-strong">{m.company_name ?? "—"}</td>
                  <td className="cell-sub">{m.product_name ?? "—"}</td>
                  <td>
                    <span className="badge badge-info">{m.mttr_mode || "—"}</span>
                  </td>
                  <td className="cell-sub">{fmtDate(m.start_date)}</td>
                  <td className="cell-sub">{fmtDate(m.end_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.5px", color }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "var(--faint)",
          textTransform: "uppercase",
          fontWeight: 700,
          letterSpacing: ".6px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function isFullyConfigured(m: MetricFull): boolean {
  const hasRespond =
    m.mtt_respond_critical != null &&
    m.mtt_respond_high != null &&
    m.mtt_respond_medium != null &&
    m.mtt_respond_low != null;
  const hasResolve =
    m.mtt_resolve_critical != null &&
    m.mtt_resolve_high != null &&
    m.mtt_resolve_medium != null &&
    m.mtt_resolve_low != null;

  if (m.mttr_mode === "respond") return hasRespond;
  if (m.mttr_mode === "resolve") return hasResolve;
  if (m.mttr_mode === "both") return hasRespond && hasResolve;
  return false;
}

function resolveSelection(
  selection: TreeSelection,
  products: ProductRow[]
): { title: string; subtitle: string; selectedProducts: ProductRow[] } {
  if (selection.kind === "all") {
    return {
      title: "All Products",
      subtitle: "Every product across every category",
      selectedProducts: products,
    };
  }
  if (selection.kind === "product") {
    const p = selection.product;
    const path = [p.tier1, p.tier2, p.tier3].filter(Boolean).join(" › ");
    return {
      title: p.product_name,
      subtitle: `${path}${p.company_id ? "" : " · Global"}`,
      selectedProducts: [p],
    };
  }
  if (selection.kind === "tier1") {
    const list = products.filter((p) => p.tier1 === selection.tier1);
    return {
      title: selection.tier1,
      subtitle: "Tier 1 branch",
      selectedProducts: list,
    };
  }
  if (selection.kind === "tier2") {
    const list = products.filter(
      (p) => p.tier1 === selection.tier1 && p.tier2 === selection.tier2
    );
    return {
      title: selection.tier2,
      subtitle: `${selection.tier1} › ${selection.tier2}`,
      selectedProducts: list,
    };
  }
  // tier3
  const list = products.filter(
    (p) =>
      p.tier1 === selection.tier1 &&
      p.tier2 === selection.tier2 &&
      p.tier3 === selection.tier3
  );
  return {
    title: selection.tier3,
    subtitle: `${selection.tier1} › ${selection.tier2} › ${selection.tier3}`,
    selectedProducts: list,
  };
}