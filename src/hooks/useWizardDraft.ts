import { useEffect, useState } from "react";
import { EMPTY_WIZARD_FORM, type MetricWizardForm } from "../types/metrics";

const STORAGE_KEY = "sla_wizard_draft_v1";

export function useWizardDraft() {
  const [form, setForm] = useState<MetricWizardForm>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return EMPTY_WIZARD_FORM;
      return { ...EMPTY_WIZARD_FORM, ...JSON.parse(raw) };
    } catch {
      return EMPTY_WIZARD_FORM;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* quota or serialization error — non-fatal */
    }
  }, [form]);

  function update(patch: Partial<MetricWizardForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    setForm(EMPTY_WIZARD_FORM);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* no-op */
    }
  }

  return { form, update, reset };
}