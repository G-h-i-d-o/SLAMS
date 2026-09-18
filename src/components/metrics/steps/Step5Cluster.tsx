import type { MetricWizardForm, MetricAction } from "../../../types/metrics";
import type { WizardLookups } from "../../../hooks/useWizardLookups";
import { TextField } from "../../ui/FormField";
import SearchableSelect from "../../ui/SearchableSelect";

type Props = {
  form: MetricWizardForm;
  update: (patch: Partial<MetricWizardForm>) => void;
  lookups: WizardLookups;
};

const ACTIONS: MetricAction[] = ["New", "Modify", "Expire", "Terminate"];

export default function Step5Cluster({ form, update, lookups }: Props) {
  const clusters = lookups.clusters.filter(
    (c) => c.is_enabled && (!form.company_id || c.company_id === form.company_id)
  );

  return (
    <>
      <div className="section-title">Cluster & Action</div>
      <div className="form-grid">
        <SearchableSelect
          label="Cluster"
          value={form.cluster_id}
          onChange={(v) => update({ cluster_id: v })}
          options={clusters.map((c) => ({ value: c.id, label: c.name }))}
          required
        />
        <TextField
          label="Vendor Group"
          value={form.vendor_group}
          onChange={(v) => update({ vendor_group: v })}
        />
        <div className="field full">
          <label>
            Action <span className="req">*</span>
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ACTIONS.map((a) => (
              <button
                key={a}
                type="button"
                className="btn"
                style={{
                  background: form.action === a ? "var(--primary)" : "#fff",
                  color: form.action === a ? "#fff" : "var(--text)",
                  border:
                    form.action === a
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border)",
                }}
                onClick={() => update({ action: a })}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <label
          className="field full"
          style={{ flexDirection: "row", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={form.exclude_m7}
            onChange={(e) => update({ exclude_m7: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Exclude M7</span>
        </label>
      </div>
    </>
  );
}