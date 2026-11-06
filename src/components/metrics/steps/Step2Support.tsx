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
  const [sgModalOpen, setSgModalOpen] = useState(false);
  const [siteModalOpen, setSiteModalOpen] = useState(false);

  // Support Groups — auto-prompt on first arrival (required field)
  useEffect(() => {
    if (form.support_group_count === 0) {
      setSgModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const siteCount = form.site_count ?? -1;
  const sites = form.sites ?? [];

  const siteOptions = lookups.sites
    .filter(
      (s) =>
        s.is_enabled &&
        (!form.company_id || s.company_id === form.company_id)
    )
    .map((s) => ({ value: s.id, label: s.name }));

  const groupOptions = lookups.supportGroups.map((g) => {
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

  function applyGroupCount(count: number) {
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
      support_group_id: current[0] ?? "",
    });
  }

  function applySiteCount(count: number) {
    const current = form.sites ?? [];
    const next =
      count <= 0
        ? []
        : Array.from({ length: count }, (_, i) => current[i] ?? "");
    update({
      site_count: count,
      sites: next,
      site_id: next[0] ?? "",
    });
  }

  function setSite(index: number, value: string) {
    const current = [...(form.sites ?? [])];
    while (current.length < siteCount) current.push("");
    current[index] = value;
    update({
      sites: current,
      site_id: current[0] ?? "",
    });
  }

  const groupRows = form.support_groups ?? [];
  const isSingleGroup = form.support_group_count === 1;
  const isSingleSite = siteCount === 1;

  return (
    <>
      {/* ---------------- Support Groups ---------------- */}
      <div className="section-title">Support Groups</div>

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
          onClick={() => setSgModalOpen(true)}
        >
          Change
        </button>
      </div>

      <div className="form-grid">
        {Array.from({ length: form.support_group_count }).map((_, idx) => (
          <div className="field full" key={idx}>
            {!isSingleGroup && (
              <div className="multi-row-head" style={{ marginTop: 0 }}>
                <span className="num">{idx + 1}</span>
                <span className="label">
                  Support Group {idx + 1} of {form.support_group_count}
                </span>
              </div>
            )}
            <SearchableSelect
              label={isSingleGroup ? "Support Group" : undefined}
              value={groupRows[idx] ?? ""}
              onChange={(v) => setGroup(idx, v)}
              options={groupOptions}
              required
              full
              placeholder="— Select support group —"
            />
          </div>
        ))}
      </div>

      {/* ---------------- Sites ---------------- */}
      <div className="section-title" style={{ marginTop: 20 }}>
        Sites (optional)
      </div>

      {siteCount === -1 ? (
        // Not yet configured — clicking triggers the count prompt
        <div className="form-grid">
          <div className="field full">
            <label>Site</label>
            <button
              type="button"
              className="searchable-select-trigger"
              onClick={() => setSiteModalOpen(true)}
            >
              <span className="ss-trigger-label placeholder">
                — Click to configure site(s) —
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
            <span className="label">Sites:</span>
            <span className="value">
              {siteCount === 0
                ? "None"
                : siteCount === 1
                ? "1"
                : `${siteCount} selected`}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSiteModalOpen(true)}
            >
              Change
            </button>
          </div>

          {siteCount > 0 && (
            <div className="form-grid">
              {Array.from({ length: siteCount }).map((_, idx) => (
                <div className="field full" key={idx}>
                  {!isSingleSite && (
                    <div className="multi-row-head" style={{ marginTop: 0 }}>
                      <span className="num">{idx + 1}</span>
                      <span className="label">
                        Site {idx + 1} of {siteCount}
                      </span>
                    </div>
                  )}
                  <SearchableSelect
                    label={isSingleSite ? "Site" : undefined}
                    value={sites[idx] ?? ""}
                    onChange={(v) => setSite(idx, v)}
                    options={siteOptions}
                    full
                    placeholder="— Select site —"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- Dates ---------------- */}
      <div className="section-title" style={{ marginTop: 20 }}>
        Dates
      </div>
      <div className="form-grid">
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
        open={sgModalOpen}
        title="Support Groups"
        question="Does this metric cover one support group, or multiple?"
        singleLabel="Just one support group"
        multiLabel="Multiple support groups"
        initialCount={form.support_group_count}
        onConfirm={(count) => {
          applyGroupCount(count);
          setSgModalOpen(false);
        }}
        onCancel={() => {
          if (form.support_group_count === 0) applyGroupCount(1);
          setSgModalOpen(false);
        }}
      />

      <CountPromptModal
        open={siteModalOpen}
        title="Sites"
        question="Does this metric cover one Site, or multiple?"
        singleLabel="Just one site"
        multiLabel="Multiple sites"
        noneLabel="No site (optional)"
        initialCount={siteCount}
        onConfirm={(count) => {
          applySiteCount(count);
          setSiteModalOpen(false);
        }}
        onCancel={() => setSiteModalOpen(false)}
      />
    </>
  );
}