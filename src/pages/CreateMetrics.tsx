import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/metrics/Stepper";
import LivePreview from "../components/metrics/LivePreview";
import MttrModeModal from "../components/metrics/MttrModeModal";
import Step1Company from "../components/metrics/steps/Step1Company";
import Step2Support from "../components/metrics/steps/Step2Support";
import Step3Product from "../components/metrics/steps/Step3Product";
import Step4Terms from "../components/metrics/steps/Step4Terms";
import Step5Cluster from "../components/metrics/steps/Step5Cluster";
import Step6Review from "../components/metrics/steps/Step6Review";
import { useWizardDraft } from "../hooks/useWizardDraft";
import { useWizardLookups } from "../hooks/useWizardLookups";
import { useToast } from "../contexts/ToastContext";
import { createMetric } from "../lib/api/createMetric";
import { isValidMttrResolve, type MetricWizardForm } from "../types/metrics";

const PRIORITIES = ["critical", "high", "medium", "low"] as const;

function validateStep(step: number, f: MetricWizardForm): string | null {
  if (step === 1) {
    if (!f.company_id) return "Please select a company";
    if (!f.customer_number.trim()) return "Customer Number is required";
    if (!f.contact_company.trim()) return "Contact Company is required";
    if (!f.document_id.trim()) return "Document ID is required";
    if (!f.signed_date) return "Signed Date is required";
  }
  if (step === 2) {
    if (!f.support_group_id) return "Please select a support group";
    if (!f.start_date) return "Start Date is required";
    if (!f.end_date) return "End Date is required";
  }
  if (step === 3) {
    if (!f.product_category_id) return "Please select a product";
    if (!f.service_category) return "Please select a service category";
    if (!f.service_sub_category) return "Please select a service sub category";
    if (!f.service_id) return "Please select a service component";
  }
  if (step === 4) {
    if (String(f.rollup_performance).trim() === "") return "% Roll-up Performance is required";
    if (isNaN(Number(f.rollup_performance))) return "% Roll-up Performance must be numeric";
    if (!f.tiered_type) return "Tiered / Configured is required";
    for (const p of PRIORITIES) {
      if (!(f[`bh_${p}` as keyof MetricWizardForm] as string)) {
        return `Business Hours (${p}) is required`;
      }
    }
    if (!f.mttr_mode) return "Please configure MTTR (Respond / Resolve / Both)";
    const showRespond = f.mttr_mode === "respond" || f.mttr_mode === "both";
    const showResolve = f.mttr_mode === "resolve" || f.mttr_mode === "both";
    if (showRespond) {
      for (const p of PRIORITIES) {
        const v = String(f[`mtt_respond_${p}` as keyof MetricWizardForm] ?? "").trim();
        if (!v) return `MTTrespond ${p} is required`;
        if (isNaN(Number(v))) return `MTTrespond ${p} must be numeric`;
      }
    }
    if (showResolve) {
      for (const p of PRIORITIES) {
        const v = String(f[`mtt_resolve_${p}` as keyof MetricWizardForm] ?? "").trim();
        if (!v) return `MTTresolve ${p} is required`;
        if (!isValidMttrResolve(v)) return `MTTresolve ${p} must be a number or "TD"`;
      }
    }
  }
  if (step === 5) {
    if (!f.cluster_id) return "Cluster is required";
    if (!f.action) return "Action is required";
  }
  return null;
}

export default function CreateMetrics() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const draft = useWizardDraft();
  const lookups = useWizardLookups();

  const [step, setStep] = useState(1);
  const [mttrModalOpen, setMttrModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-open MTTR modal on first arrival at step 4
  useEffect(() => {
    if (step === 4 && !draft.form.mttr_mode) {
      setMttrModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function next() {
    const err = validateStep(step, draft.form);
    if (err) {
      error(err);
      return;
    }
    setStep((s) => Math.min(6, s + 1));
  }

  function prev() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    for (let s = 1; s <= 5; s++) {
      const err = validateStep(s, draft.form);
      if (err) {
        error(`Step ${s}: ${err}`);
        setStep(s);
        return;
      }
    }

    setSubmitting(true);
    try {
      await createMetric(draft.form);
      success(`Metric ${draft.form.document_id} created`);
      draft.reset();
      setStep(1);
      navigate("/history");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to create metric");
    } finally {
      setSubmitting(false);
    }
  }

  if (lookups.loading) {
    return <div className="card"><div className="empty">Loading reference data…</div></div>;
  }

  return (
    <>
      <div className="wizard-grid">
        <div className="card">
          <Stepper current={step} />

          <div className="wizard-body">
            {step === 1 && (
              <Step1Company form={draft.form} update={draft.update} lookups={lookups} />
            )}
            {step === 2 && (
              <Step2Support form={draft.form} update={draft.update} lookups={lookups} />
            )}
            {step === 3 && (
              <Step3Product form={draft.form} update={draft.update} lookups={lookups} />
            )}
            {step === 4 && (
              <Step4Terms
                form={draft.form}
                update={draft.update}
                lookups={lookups}
                onOpenMttrModal={() => setMttrModalOpen(true)}
              />
            )}
            {step === 5 && (
              <Step5Cluster form={draft.form} update={draft.update} lookups={lookups} />
            )}
            {step === 6 && <Step6Review form={draft.form} lookups={lookups} />}
          </div>

          <div className="wizard-foot">
            <button className="btn btn-ghost" onClick={prev} disabled={step === 1}>
              ← Back
            </button>
            {step < 6 ? (
              <button className="btn btn-primary" onClick={next}>
                Next →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={submit} disabled={submitting}>
                {submitting ? "Creating…" : "Create Metric"}
              </button>
            )}
          </div>
        </div>

        <LivePreview form={draft.form} lookups={lookups} step={step} />
      </div>

      <MttrModeModal
        open={mttrModalOpen}
        onClose={() => setMttrModalOpen(false)}
        form={draft.form}
        update={draft.update}
        onConfirm={(mode) => {
          if (mode === "resolve" || mode === "both") {
            // no-op; nothing extra
          }
        }}
      />
    </>
  );
}