import { useEffect, useState } from "react";
import type { MetricWizardForm, ServiceSelection } from "../../../types/metrics";
import { makeEmptyService, resizeArray } from "../../../types/metrics";
import type { WizardLookups } from "../../../hooks/useWizardLookups";
import SearchableSelect from "../../ui/SearchableSelect";
import CountPromptModal from "../../ui/CountPromptModal";

type Props = {
  form: MetricWizardForm;
  update: (patch: Partial<MetricWizardForm>) => void;
  lookups: WizardLookups;
};

export default function Step3Product({ form, update, lookups }: Props) {
  const [svcModalOpen, setSvcModalOpen] = useState(false);
  const [prodModalOpen, setProdModalOpen] = useState(false);

  // Services — auto-prompt on first arrival (required field)
  useEffect(() => {
    if (form.service_count === 0) {
      setSvcModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productCount = form.product_count ?? -1;
  const products = form.products ?? [];

  const productOptions = lookups.products
    .filter(
      (p) =>
        p.is_enabled &&
        (!p.company_id || p.company_id === form.company_id)
    )
    .map((p) => ({
      value: p.id,
      label: `${p.tier1} › ${p.tier2 ?? ""} › ${p.tier3 ?? ""} › ${p.product_name}`,
    }));

  const allCategories = Array.from(
    new Set(lookups.services.map((s) => s.category))
  );

  function subCategoriesFor(category: string): string[] {
    if (!category) return [];
    return Array.from(
      new Set(
        lookups.services
          .filter((s) => s.category === category)
          .map((s) => s.sub_category ?? "")
          .filter(Boolean)
      )
    );
  }

  function componentsFor(category: string, sub: string) {
    if (!category || !sub) return [];
    return lookups.services.filter(
      (s) => s.category === category && s.sub_category === sub
    );
  }

  function applyServiceCount(count: number) {
    const current = form.services ?? [];
    const next = resizeArray(current, count, makeEmptyService);
    update({
      service_count: count,
      services: next,
      service_category: next[0]?.category ?? "",
      service_sub_category: next[0]?.sub_category ?? "",
      service_id: next[0]?.service_id ?? "",
    });
  }

  function updateService(index: number, patch: Partial<ServiceSelection>) {
    const current = [...(form.services ?? [])];
    while (current.length < form.service_count) current.push(makeEmptyService());
    current[index] = { ...current[index], ...patch };
    update({
      services: current,
      service_category: current[0]?.category ?? "",
      service_sub_category: current[0]?.sub_category ?? "",
      service_id: current[0]?.service_id ?? "",
    });
  }

  function applyProductCount(count: number) {
    const current = form.products ?? [];
    const next =
      count <= 0
        ? []
        : Array.from({ length: count }, (_, i) => current[i] ?? "");
    update({
      product_count: count,
      products: next,
      product_category_id: next[0] ?? "",
    });
  }

  function setProduct(index: number, value: string) {
    const current = [...(form.products ?? [])];
    while (current.length < productCount) current.push("");
    current[index] = value;
    update({
      products: current,
      product_category_id: current[0] ?? "",
    });
  }

  const services = form.services ?? [];
  const isSingleService = form.service_count === 1;
  const isSingleProduct = productCount === 1;

  return (
    <>
      {/* ---------------- Products ---------------- */}
      <div className="section-title">Products (optional)</div>

      {productCount === -1 ? (
        <div className="form-grid">
          <div className="field full">
            <label>Product</label>
            <button
              type="button"
              className="searchable-select-trigger"
              onClick={() => setProdModalOpen(true)}
            >
              <span className="ss-trigger-label placeholder">
                — Click to configure product(s) —
              </span>
              <svg
                className="ss-trigger-caret"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="summary-bar">
            <span className="label">Products:</span>
            <span className="value">
              {productCount === 0
                ? "None"
                : productCount === 1
                ? "1"
                : `${productCount} selected`}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setProdModalOpen(true)}
            >
              Change
            </button>
          </div>

          {productCount > 0 && (
            <div className="form-grid">
              {Array.from({ length: productCount }).map((_, idx) => (
                <div className="field full" key={idx}>
                  {!isSingleProduct && (
                    <div className="multi-row-head" style={{ marginTop: 0 }}>
                      <span className="num">{idx + 1}</span>
                      <span className="label">
                        Product {idx + 1} of {productCount}
                      </span>
                    </div>
                  )}
                  <SearchableSelect
                    label={isSingleProduct ? "Product" : undefined}
                    value={products[idx] ?? ""}
                    onChange={(v) => setProduct(idx, v)}
                    options={productOptions}
                    full
                    placeholder="— Select product —"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- Services ---------------- */}
      <div className="section-title" style={{ marginTop: 20 }}>
        Services
      </div>

      <div className="summary-bar">
        <span className="label">Services:</span>
        <span className="value">
          {form.service_count === 0
            ? "—"
            : form.service_count === 1
            ? "1"
            : `${form.service_count} selected`}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setSvcModalOpen(true)}
        >
          Change
        </button>
      </div>

      {Array.from({ length: form.service_count }).map((_, idx) => {
        const row = services[idx] ?? makeEmptyService();
        const subs = subCategoriesFor(row.category);
        const comps = componentsFor(row.category, row.sub_category);

        return (
          <div key={idx}>
            {!isSingleService && (
              <div className="multi-row-head">
                <span className="num">{idx + 1}</span>
                <span className="label">
                  Service {idx + 1} of {form.service_count}
                </span>
              </div>
            )}

            <div className="form-grid">
              <SearchableSelect
                label="Service Category"
                value={row.category}
                onChange={(v) =>
                  updateService(idx, {
                    category: v,
                    sub_category: "",
                    service_id: "",
                  })
                }
                options={allCategories.map((c) => ({ value: c, label: c }))}
                required
              />
              <SearchableSelect
                label="Service Sub Category"
                value={row.sub_category}
                onChange={(v) =>
                  updateService(idx, { sub_category: v, service_id: "" })
                }
                options={subs.map((s) => ({ value: s, label: s }))}
                required
              />
              <SearchableSelect
                label="Service Component"
                value={row.service_id}
                onChange={(v) => updateService(idx, { service_id: v })}
                options={comps.map((c) => ({ value: c.id, label: c.component }))}
                required
                full
              />
            </div>
          </div>
        );
      })}

      <CountPromptModal
        open={svcModalOpen}
        title="Services"
        question="Does this metric cover one service, or multiple?"
        singleLabel="Just one service"
        multiLabel="Multiple services"
        initialCount={form.service_count}
        onConfirm={(count) => {
          applyServiceCount(count);
          setSvcModalOpen(false);
        }}
        onCancel={() => {
          if (form.service_count === 0) applyServiceCount(1);
          setSvcModalOpen(false);
        }}
      />

      <CountPromptModal
        open={prodModalOpen}
        title="Products"
        question="Does this metric cover one Product, or multiple?"
        singleLabel="Just one product"
        multiLabel="Multiple products"
        noneLabel="No product (optional)"
        initialCount={productCount}
        onConfirm={(count) => {
          applyProductCount(count);
          setProdModalOpen(false);
        }}
        onCancel={() => setProdModalOpen(false)}
      />
    </>
  );
}