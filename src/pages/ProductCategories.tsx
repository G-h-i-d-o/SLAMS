import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ConfigPage from "../components/ui/ConfigPage";
import CategoryTree, {
  type ProductRow,
  type TreeSelection,
} from "../components/products/CategoryTree";
import CategoryDetail from "../components/products/CategoryDetail";
import { productCategoriesSpec, type ProductCategory } from "../configs/productCategories";
import { listRows } from "../lib/api";
import type { MetricFull } from "../types/metrics";

type Mode = "table" | "tree";

export default function ProductCategories() {
  const [mode, setMode] = useState<Mode>("table");
  const [selection, setSelection] = useState<TreeSelection>({ kind: "all" });

  const productsQ = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => listRows<ProductRow>("product_categories", "tier1"),
    enabled: mode === "tree",
  });

  const metricsQ = useQuery({
    queryKey: ["metrics", "full"],
    queryFn: () => listRows<MetricFull>("v_metrics_full"),
    enabled: mode === "tree",
  });

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 3,
          }}
        >
          <TabButton active={mode === "table"} onClick={() => setMode("table")}>
            Table
          </TabButton>
          <TabButton active={mode === "tree"} onClick={() => setMode("tree")}>
            Tree view
          </TabButton>
        </div>
      </div>

      {mode === "table" ? (
        <ConfigPage<ProductCategory> spec={productCategoriesSpec} />
      ) : (
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Product Category Tree</h3>
              <p>Drill down to see metrics using each product</p>
            </div>
          </div>
          <div
            className="card-body"
            style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20 }}
          >
            <div
              style={{
                borderRight: "1px solid var(--border)",
                paddingRight: 16,
                maxHeight: 560,
                overflowY: "auto",
              }}
            >
              {productsQ.isLoading ? (
                <div style={{ padding: 20, color: "var(--muted)", fontSize: 12.5 }}>
                  Loading products…
                </div>
              ) : productsQ.error ? (
                <div style={{ padding: 20, color: "#b91c1c", fontSize: 12.5 }}>
                  Error: {(productsQ.error as Error).message}
                </div>
              ) : (
                <CategoryTree
                  products={productsQ.data ?? []}
                  selection={selection}
                  onSelect={setSelection}
                />
              )}
            </div>

            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {metricsQ.isLoading || productsQ.isLoading ? (
                <div style={{ padding: 20, color: "var(--muted)", fontSize: 12.5 }}>
                  Loading…
                </div>
              ) : (
                <CategoryDetail
                  selection={selection}
                  products={productsQ.data ?? []}
                  metrics={metricsQ.data ?? []}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: "none",
        background: active ? "var(--primary)" : "transparent",
        color: active ? "#fff" : "var(--muted)",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        transition: "background .15s, color .15s",
      }}
    >
      {children}
    </button>
  );
}