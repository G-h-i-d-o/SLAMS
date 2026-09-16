import type { MetricWizardForm } from "../../../types/metrics";
import type { WizardLookups } from "../../../hooks/useWizardLookups";
import { FormField, SelectField } from "../../ui/FormField";

type Props = {
  form: MetricWizardForm;
  update: (patch: Partial<MetricWizardForm>) => void;
  lookups: WizardLookups;
};

export default function Step2Support({ form, update, lookups }: Props) {
  const sites = lookups.sites.filter(
    (s) => s.is_enabled && (!form.company_id || s.company_id === form.company_id)
  );

  return (
    <>
      <div className="section-title">Support & Site</div>
      <div className="form-grid">
        <SelectField
          label="Support Group"
          value={form.support_group_id}
          onChange={(v) => update({ support_group_id: v })}
          options={lookups.supportGroups.map((g) => {
            const org = lookups.supportOrganizations.find(
              (o) => o.id === g.support_organization_id
            );
            const sgc = org
              ? lookups.supportGroupCompanies.find(
                  (c) => c.id === org.support_group_company_id
                )
              : null;
            const path = [sgc?.name, org?.name].filter(Boolean).join(" › ");
            return {
              value: g.id,
              label: path ? `${path} › ${g.name}` : g.name,
            };
          })}
          required
          full
        />
        <SelectField
          label="Site (optional — exclusive to company)"
          value={form.site_id}
          onChange={(v) => update({ site_id: v })}
          options={sites.map((s) => ({ value: s.id, label: s.name }))}
        />
        <FormField label="Start Date" required>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => update({ start_date: e.target.value })}
          />
        </FormField>
        <FormField label="End Date" required>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => update({ end_date: e.target.value })}
          />
        </FormField>
      </div>
    </>
  );
}