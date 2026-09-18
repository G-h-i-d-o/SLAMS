import type { MetricWizardForm, MttrMode } from "../../../types/metrics";
import type { WizardLookups } from "../../../hooks/useWizardLookups";
import { FormField } from "../../ui/FormField";
import SearchableSelect from "../../ui/SearchableSelect";

type Props = {
  form: MetricWizardForm;
  update: (patch: Partial<MetricWizardForm>) => void;
  lookups: WizardLookups;
  onOpenMttrModal: () => void;
};

const PRIORITIES = ["critical", "high", "medium", "low"] as const;

function cap(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

function modeLabel(m: MttrMode): string {
  if (m === "respond") return "Respond only";
  if (m === "resolve") return "Resolve only";
  if (m === "both") return "Respond & Resolve";
  return "Not set";
}

export default function Step4Terms({
  form,
  update,
  lookups,
  onOpenMttrModal,
}: Props) {
  const bhs = lookups.businessHours.filter((b) => b.is_enabled);
  const showRespond = form.mttr_mode === "respond" || form.mttr_mode === "both";
  const showResolve = form.mttr_mode === "resolve" || form.mttr_mode === "both";

  function applyPreset(presetId: string) {
    const p = lookups.mttrPresets.find((x) => x.id === presetId);
    if (!p) {
      update({ mttr_preset_id: presetId });
      return;
    }
    const patch: Partial<MetricWizardForm> = { mttr_preset_id: presetId };
    if (form.mttr_mode === "respond" || form.mttr_mode === "both") {
      patch.mtt_respond_critical = String(p.respond_critical);
      patch.mtt_respond_high = String(p.respond_high);
      patch.mtt_respond_medium = String(p.respond_medium);
      patch.mtt_respond_low = String(p.respond_low);
    }
    if (form.mttr_mode === "resolve" || form.mttr_mode === "both") {
      patch.mtt_resolve_critical = String(p.resolve_critical);
      patch.mtt_resolve_high = String(p.resolve_high);
      patch.mtt_resolve_medium = String(p.resolve_medium);
      patch.mtt_resolve_low = String(p.resolve_low);
    }
    update(patch);
  }

  return (
    <>
      <div className="section-title">Contract Terms</div>
      <div className="form-grid">
        <FormField label="% Roll-up Performance" required>
          <input
            type="number"
            min={0}
            max={100}
            value={form.rollup_performance}
            onChange={(e) => update({ rollup_performance: e.target.value })}
          />
        </FormField>
        <SearchableSelect
          label="Tiered / Configured / Non Catalogued"
          value={form.tiered_type}
          onChange={(v) =>
            update({ tiered_type: v as MetricWizardForm["tiered_type"] })
          }
          options={[
            { value: "Tiered", label: "Tiered" },
            { value: "Configured", label: "Configured" },
            { value: "Non Catalogued", label: "Non Catalogued" },
          ]}
          required
        />
      </div>

      <div className="section-title" style={{ marginTop: 20 }}>
        Business Hours (per priority)
      </div>
      <div className="form-grid">
        {PRIORITIES.map((p) => (
          <SearchableSelect
            key={p}
            label={`Business Hours — ${cap(p)}`}
            value={(form[`bh_${p}` as keyof MetricWizardForm] as string) ?? ""}
            onChange={(v) =>
              update({ [`bh_${p}`]: v } as Partial<MetricWizardForm>)
            }
            options={bhs.map((b) => ({ value: b.id, label: b.label }))}
            required
          />
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 20 }}>
        MTTR Targets
      </div>

      <div className="mttr-summary-bar">
        <span className="label">MTTR mode:</span>
        <span className="value">{modeLabel(form.mttr_mode)}</span>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={onOpenMttrModal}
        >
          {form.mttr_mode ? "Change" : "Configure"}
        </button>
      </div>

      {form.mttr_mode && (
        <>
          <div style={{ marginBottom: 12 }}>
            <SearchableSelect
              label="Start from preset (optional)"
              value={form.mttr_preset_id}
              onChange={applyPreset}
              options={lookups.mttrPresets.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
              placeholder="— None (manual) —"
            />
          </div>

          <div className="form-grid">
            {showRespond &&
              PRIORITIES.map((p) => (
                <FormField key={`r-${p}`} label={`MTTrespond ${cap(p)} (min)`} required>
                  <input
                    type="number"
                    min={0}
                    value={form[`mtt_respond_${p}` as keyof MetricWizardForm] as string}
                    onChange={(e) =>
                      update({ [`mtt_respond_${p}`]: e.target.value } as Partial<MetricWizardForm>)
                    }
                  />
                </FormField>
              ))}

            {showResolve &&
              PRIORITIES.map((p) => (
                <FormField
                  key={`res-${p}`}
                  label={`MTTresolve ${cap(p)} (number or TD)`}
                  required
                >
                  <input
                    type="text"
                    value={form[`mtt_resolve_${p}` as keyof MetricWizardForm] as string}
                    placeholder="e.g. 240 or TD"
                    onChange={(e) =>
                      update({ [`mtt_resolve_${p}`]: e.target.value } as Partial<MetricWizardForm>)
                    }
                  />
                </FormField>
              ))}
          </div>
        </>
      )}

      {!form.mttr_mode && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 11.5,
          }}
        >
          <strong>MTTR not configured yet.</strong>{" "}
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={onOpenMttrModal}
            style={{ marginLeft: 8 }}
          >
            Configure MTTRs
          </button>
        </div>
      )}
    </>
  );
}