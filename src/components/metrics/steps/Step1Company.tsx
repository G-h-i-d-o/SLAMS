import { useEffect } from "react";
import type { MetricWizardForm } from "../../../types/metrics";
import type { WizardLookups } from "../../../hooks/useWizardLookups";
import { FormField, SelectField, TextField } from "../../ui/FormField";

type Props = {
  form: MetricWizardForm;
  update: (patch: Partial<MetricWizardForm>) => void;
  lookups: WizardLookups;
};

export default function Step1Company({ form, update, lookups }: Props) {
  // Auto-fill contact_company if empty when a company is selected
  useEffect(() => {
    if (form.company_id && !form.contact_company) {
      const c = lookups.companies.find((x) => x.id === form.company_id);
      if (c) update({ contact_company: c.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.company_id]);

  function onCompanyChange(id: string) {
    const c = lookups.companies.find((x) => x.id === id);
    update({
      company_id: id,
      customer_number: c?.customer_number ?? "",
      contact_company: c?.name ?? "",
      site_id: "", // sites are scoped by company
    });
  }

  return (
    <>
      <div className="section-title">Company & Document</div>
      <div className="form-grid">
        <SelectField
          label="Company"
          value={form.company_id}
          onChange={onCompanyChange}
          options={lookups.companies.map((c) => ({ value: c.id, label: c.name }))}
          required
          full
        />
        <TextField
          label="Customer Number"
          value={form.customer_number}
          onChange={(v) => update({ customer_number: v })}
          required
          hint="Auto-filled when a Company is selected · editable"
        />
        <TextField
          label="Contact Company"
          value={form.contact_company}
          onChange={(v) => update({ contact_company: v })}
          required
          hint="Auto-filled when a Company is selected · editable"
        />
        <TextField
          label="Document ID"
          value={form.document_id}
          onChange={(v) => update({ document_id: v })}
          required
          hint="Format: {CustomerNumber}_{Suffix}"
        />
        <FormField label="Signed Date" required>
          <input
            type="date"
            value={form.signed_date}
            onChange={(e) => update({ signed_date: e.target.value })}
          />
        </FormField>
      </div>
    </>
  );
}