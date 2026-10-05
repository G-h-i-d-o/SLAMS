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
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (form.service_count === 0) {
      setModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const products = lookups.products.filter(
    (p) => p.is_enabled && (!p.company_id || p.company_id === form.company_id)
  );

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

  function applyCount(count: number) {
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

  const services = form.services ?? [];
  const isSingle = form.service_count === 1;

  return (
    <>
      <div className="section-title">Product & Service</div>

      {/* Product stays single — first row */}
      <div className="form-grid">
        <SearchableSelect
          label="Product (optional)"
          value={form.product_category_id}
          onChange={(v) => update({ product_category_id: v })}
          options={products.map((p) => ({
            value: p.id,
            label: `${p.tier1} › ${p.tier2 ?? ""} › ${p.tier3 ?? ""} › ${p.product_name}`,
          }))}
          full
          placeholder="— None (optional) —"
        />
      </div>

      {/* Summary bar for services */}
      <div className="summary-bar" style={{ marginTop: 20 }}>
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
          onClick={() => setModalOpen(true)}
        >
          Change
        </button>
      </div>

      {/* Service rows */}
      {Array.from({ length: form.service_count }).map((_, idx) => {
        const row = services[idx] ?? makeEmptyService();
        const subs = subCategoriesFor(row.category);
        const comps = componentsFor(row.category, row.sub_category);

        return (
          <div key={idx}>
            {!isSingle && (
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
        open={modalOpen}
        title="Services"
        question="Does this metric cover one service, or multiple?"
        singleLabel="Just one service"
        multiLabel="Multiple services"
        initialCount={form.service_count}
        onConfirm={(count) => {
          applyCount(count);
          setModalOpen(false);
        }}
        onCancel={() => {
          if (form.service_count === 0) applyCount(1);
          setModalOpen(false);
        }}
      />
    </>
  );
}