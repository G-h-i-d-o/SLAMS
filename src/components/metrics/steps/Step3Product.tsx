import type { MetricWizardForm } from "../../../types/metrics";
import type { WizardLookups } from "../../../hooks/useWizardLookups";
import { SelectField } from "../../ui/FormField";

type Props = {
  form: MetricWizardForm;
  update: (patch: Partial<MetricWizardForm>) => void;
  lookups: WizardLookups;
};

export default function Step3Product({ form, update, lookups }: Props) {
  const products = lookups.products.filter(
    (p) => p.is_enabled && (!p.company_id || p.company_id === form.company_id)
  );

  const categories = Array.from(new Set(lookups.services.map((s) => s.category)));

  const subCategories = form.service_category
    ? Array.from(
        new Set(
          lookups.services
            .filter((s) => s.category === form.service_category)
            .map((s) => s.sub_category ?? "")
            .filter(Boolean)
        )
      )
    : [];

  const components =
    form.service_category && form.service_sub_category
      ? lookups.services.filter(
          (s) =>
            s.category === form.service_category &&
            s.sub_category === form.service_sub_category
        )
      : [];

  return (
    <>
      <div className="section-title">Product & Service</div>
      <div className="form-grid">
        <SelectField
          label="Product"
          value={form.product_category_id}
          onChange={(v) => update({ product_category_id: v })}
          options={products.map((p) => ({
            value: p.id,
            label: `${p.tier1} › ${p.tier2 ?? ""} › ${p.tier3 ?? ""} › ${p.product_name}`,
          }))}
          required
          full
        />
        <SelectField
          label="Service Category"
          value={form.service_category}
          onChange={(v) =>
            update({
              service_category: v,
              service_sub_category: "",
              service_id: "",
            })
          }
          options={categories.map((c) => ({ value: c, label: c }))}
          required
        />
        <SelectField
          label="Service Sub Category"
          value={form.service_sub_category}
          onChange={(v) =>
            update({ service_sub_category: v, service_id: "" })
          }
          options={subCategories.map((s) => ({ value: s, label: s }))}
          required
        />
        <SelectField
          label="Service Component"
          value={form.service_id}
          onChange={(v) => update({ service_id: v })}
          options={components.map((c) => ({ value: c.id, label: c.component }))}
          required
        />
      </div>
    </>
  );
}