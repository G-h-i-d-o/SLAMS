import { useMemo, useState } from "react";

export type ProductRow = {
  id: string;
  external_id: string;
  company_id: string | null;
  tier1: string;
  tier2: string | null;
  tier3: string | null;
  product_name: string;
  is_enabled: boolean;
};

export type TreeSelection =
  | { kind: "all" }
  | { kind: "tier1"; tier1: string }
  | { kind: "tier2"; tier1: string; tier2: string }
  | { kind: "tier3"; tier1: string; tier2: string; tier3: string }
  | { kind: "product"; product: ProductRow };

type Props = {
  products: ProductRow[];
  selection: TreeSelection;
  onSelect: (sel: TreeSelection) => void;
};

type Branch = {
  tier1: string;
  tier2Groups: { tier2: string; tier3Groups: { tier3: string; products: ProductRow[] }[] }[];
  directProducts: ProductRow[];
};

export default function CategoryTree({ products, selection, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    // Auto-expand first tier1 to give a good first impression
    if (products[0]) s.add(`t1:${products[0].tier1}`);
    return s;
  });

  const tree: Branch[] = useMemo(() => buildTree(products), [products]);

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function isSelected(sel: TreeSelection): boolean {
    switch (sel.kind) {
      case "tier1":
        return selection.kind === "tier1" && selection.tier1 === sel.tier1;
      case "tier2":
        return (
          selection.kind === "tier2" &&
          selection.tier1 === sel.tier1 &&
          selection.tier2 === sel.tier2
        );
      case "tier3":
        return (
          selection.kind === "tier3" &&
          selection.tier1 === sel.tier1 &&
          selection.tier2 === sel.tier2 &&
          selection.tier3 === sel.tier3
        );
      case "product":
        return (
          selection.kind === "product" && selection.product.id === sel.product.id
        );
      default:
        return false;
    }
  }

  if (!products.length) {
    return (
      <div className="empty" style={{ padding: 24 }}>
        No products defined yet.
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 4px" }}>
      <div
        className="tree-row-all"
        onClick={() => onSelect({ kind: "all" })}
        style={rowStyle(selection.kind === "all")}
      >
        <span style={{ fontWeight: 700, fontSize: 13 }}>All Products</span>
        <span className="tree-count">{products.length}</span>
      </div>

      <div style={{ marginTop: 6 }}>
        {tree.map((branch) => {
          const t1Key = `t1:${branch.tier1}`;
          const t1Open = expanded.has(t1Key);
          const t1Sel = isSelected({ kind: "tier1", tier1: branch.tier1 });
          const t1Total = countInBranch(branch);

          return (
            <div key={t1Key}>
              <div
                style={rowStyle(t1Sel)}
                onClick={() => onSelect({ kind: "tier1", tier1: branch.tier1 })}
              >
                <span
                  className={`tree-caret ${t1Open ? "open" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(t1Key);
                  }}
                >
                  ▸
                </span>
                <span style={{ fontWeight: 600, fontSize: 12.5 }}>{branch.tier1}</span>
                <span className="tree-count">{t1Total}</span>
              </div>

              {t1Open && (
                <div style={{ paddingLeft: 16 }}>
                  {branch.tier2Groups.map((g) => {
                    const t2Key = `t2:${branch.tier1}/${g.tier2}`;
                    const t2Open = expanded.has(t2Key);
                    const t2Sel = isSelected({
                      kind: "tier2",
                      tier1: branch.tier1,
                      tier2: g.tier2,
                    });
                    const t2Total = g.tier3Groups.reduce(
                      (s, x) => s + x.products.length,
                      0
                    );

                    return (
                      <div key={t2Key}>
                        <div
                          style={rowStyle(t2Sel)}
                          onClick={() =>
                            onSelect({
                              kind: "tier2",
                              tier1: branch.tier1,
                              tier2: g.tier2,
                            })
                          }
                        >
                          <span
                            className={`tree-caret ${t2Open ? "open" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(t2Key);
                            }}
                          >
                            ▸
                          </span>
                          <span style={{ fontSize: 12.5 }}>{g.tier2}</span>
                          <span className="tree-count">{t2Total}</span>
                        </div>

                        {t2Open && (
                          <div style={{ paddingLeft: 16 }}>
                            {g.tier3Groups.map((tg) => {
                              const t3Key = `t3:${branch.tier1}/${g.tier2}/${tg.tier3}`;
                              const t3Open = expanded.has(t3Key);
                              const t3Sel = isSelected({
                                kind: "tier3",
                                tier1: branch.tier1,
                                tier2: g.tier2,
                                tier3: tg.tier3,
                              });

                              return (
                                <div key={t3Key}>
                                  <div
                                    style={rowStyle(t3Sel)}
                                    onClick={() =>
                                      onSelect({
                                        kind: "tier3",
                                        tier1: branch.tier1,
                                        tier2: g.tier2,
                                        tier3: tg.tier3,
                                      })
                                    }
                                  >
                                    <span
                                      className={`tree-caret ${t3Open ? "open" : ""}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggle(t3Key);
                                      }}
                                    >
                                      ▸
                                    </span>
                                    <span style={{ fontSize: 12.5 }}>{tg.tier3}</span>
                                    <span className="tree-count">
                                      {tg.products.length}
                                    </span>
                                  </div>

                                  {t3Open && (
                                    <div style={{ paddingLeft: 16 }}>
                                      {tg.products.map((p) => {
                                        const pSel = isSelected({
                                          kind: "product",
                                          product: p,
                                        });
                                        return (
                                          <div
                                            key={p.id}
                                            style={rowStyle(pSel)}
                                            onClick={() =>
                                              onSelect({ kind: "product", product: p })
                                            }
                                          >
                                            <span style={{ width: 14, display: "inline-block" }} />
                                            <span
                                              style={{
                                                fontSize: 12,
                                                color: p.is_enabled
                                                  ? "var(--text)"
                                                  : "var(--muted)",
                                              }}
                                            >
                                              {p.product_name}
                                            </span>
                                            {!p.is_enabled && (
                                              <span className="badge badge-neutral" style={{ marginLeft: 6 }}>
                                                disabled
                                              </span>
                                            )}
                                            {!p.company_id && (
                                              <span className="badge badge-info" style={{ marginLeft: "auto" }}>
                                                Global
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Products with no tier2 */}
                  {branch.directProducts.map((p) => {
                    const pSel = isSelected({ kind: "product", product: p });
                    return (
                      <div
                        key={p.id}
                        style={rowStyle(pSel)}
                        onClick={() => onSelect({ kind: "product", product: p })}
                      >
                        <span style={{ width: 14, display: "inline-block" }} />
                        <span style={{ fontSize: 12 }}>{p.product_name}</span>
                        {!p.company_id && (
                          <span className="badge badge-info" style={{ marginLeft: "auto" }}>
                            Global
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function rowStyle(selected: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
    background: selected ? "var(--primary-light)" : undefined,
    color: selected ? "var(--primary)" : undefined,
    transition: "background .12s",
  };
}

function buildTree(products: ProductRow[]): Branch[] {
  const byTier1 = new Map<string, ProductRow[]>();
  for (const p of products) {
    const arr = byTier1.get(p.tier1) ?? [];
    arr.push(p);
    byTier1.set(p.tier1, arr);
  }

  const branches: Branch[] = [];
  for (const [tier1, list] of Array.from(byTier1.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const byTier2 = new Map<string, ProductRow[]>();
    const directProducts: ProductRow[] = [];
    for (const p of list) {
      if (!p.tier2) {
        directProducts.push(p);
        continue;
      }
      const arr = byTier2.get(p.tier2) ?? [];
      arr.push(p);
      byTier2.set(p.tier2, arr);
    }

    const tier2Groups = Array.from(byTier2.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tier2, list2]) => {
        const byTier3 = new Map<string, ProductRow[]>();
        for (const p of list2) {
          const t3 = p.tier3 ?? "—";
          const arr = byTier3.get(t3) ?? [];
          arr.push(p);
          byTier3.set(t3, arr);
        }
        const tier3Groups = Array.from(byTier3.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([tier3, list3]) => ({
            tier3,
            products: list3.sort((a, b) =>
              a.product_name.localeCompare(b.product_name)
            ),
          }));
        return { tier2, tier3Groups };
      });

    branches.push({ tier1, tier2Groups, directProducts });
  }
  return branches;
}

function countInBranch(b: Branch): number {
  return (
    b.directProducts.length +
    b.tier2Groups.reduce(
      (s, g) => s + g.tier3Groups.reduce((s2, tg) => s2 + tg.products.length, 0),
      0
    )
  );
}