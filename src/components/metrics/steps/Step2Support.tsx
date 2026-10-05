import { useEffect, useState } from "react";
import type { MetricWizardForm } from "../../../types/metrics";
import type { WizardLookups } from "../../../hooks/useWizardLookups";
import { FormField } from "../../ui/FormField";
import SearchableSelect from "../../ui/SearchableSelect";
import CountPromptModal from "../../ui/CountPromptModal";

type Props = {
  form: MetricWizardForm;
  update: (patch: Partial<MetricWizardForm>) => void;
  lookups: WizardLookups;
};

export default function Step2Support({ form, update, lookups }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  // Open the count modal automatically on first arrival
  useEffect(() => {
    if (form.support_group_count === 0) {
      setModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sites = lookups.sites.filter(
    (s) => s.is_enabled && (!form.company_id || s.company_id === form.company_id)
  );

  function supportGroupOptions() {
    return lookups.supportGroups.map((g) => {
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
    });
  }

  function applyCount(count: number) {
    const current = form.support_groups ?? [];
    const next = Array.from({ length: count }, (_, i) => current[i] ?? "");
    update({
      support_group_count: count,
      support_groups: next,
      support_group_id: next[0] ?? "",
    });
  }

  function setGroup(index: number, value: string) {
    const current = [...(form.support_groups ?? [])];
    while (current.length < form.support_group_count) current.push("");
    current[index] = value;
    update({
      support_groups: current,
      // Mirror the first entry into the flat field for backwards compat
      support_group_id: current[0] ?? "",
    });
  }

  const groups = form.support_groups ?? [];
  const isSingle = form.support_group_count === 1;

  return (
    <>
      <div className="section-title">Support & Site</div>

      {/* Summary bar */}
      <div className="summary-bar">
        <span className="label">Support Groups:</span>
        <span className="value">
          {form.support_group_count === 0
            ? "—"
            : form.support_group_count === 1
            ? "1"
            : `${form.support_group_count} selected`}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setModalOpen(true)}
        >
          Change
        </button>
      </div>

      {/* Support group rows */}
      <div className="form-grid">
        {Array.from({ length: form.support_group_count }).map((_, idx) => (
          <div className="field full" key={idx}>
            {!isSingle && (
              <div className="multi-row-head" style={{ marginTop: 0 }}>
                <span className="num">{idx + 1}</span>
                <span className="label">
                  Support Group {idx + 1} of {form.support_group_count}
                </span>
              </div>
            )}
            <SearchableSelect
              label={isSingle ? "Support Group" : undefined}
              value={groups[idx] ?? ""}
              onChange={(v) => setGroup(idx, v)}
              options={supportGroupOptions()}
              required
              full
              placeholder="— Select support group —"
            />
          </div>
        ))}
      </div>

      {/* Site and dates */}
      <div className="section-title" style={{ marginTop: 20 }}>
        Site & Dates
      </div>
      <div className="form-grid">
        <SearchableSelect
          label="Site (optional — exclusive to company)"
          value={form.site_id}
          onChange={(v) => update({ site_id: v })}
          options={sites.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="— None —"
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

      <CountPromptModal
        open={modalOpen}
        title="Support Groups"
        question="Does this metric cover one support group, or multiple?"
        singleLabel="Just one support group"
        multiLabel="Multiple support groups"
        initialCount={form.support_group_count}
        onConfirm={(count) => {
          applyCount(count);
          setModalOpen(false);
        }}
        onCancel={() => {
          // If we haven't decided yet, default to 1 so the wizard isn't blocked
          if (form.support_group_count === 0) applyCount(1);
          setModalOpen(false);
        }}
      />
    </>
  );
}