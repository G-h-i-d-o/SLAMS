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
import {
  isValidMttrResolve,
  iterableFor,
  type MetricWizardForm,
  type ServiceSelection,
} from "../types/metrics";

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
    if (f.support_group_count < 1) {
      return "Please choose how many support groups you need";
    }
    for (let i = 0; i < f.support_group_count; i++) {
      if (!f.support_groups[i]) {
        return f.support_group_count === 1
          ? "Please select a support group"
          : `Support Group ${i + 1} is required`;
      }
    }

    // Site validation — optional, but every row must be filled if chosen
    const siteCount = f.site_count ?? -1;
    if (siteCount > 0) {
      for (let i = 0; i < siteCount; i++) {
        if (!f.sites[i]) {
          return siteCount === 1
            ? "Please select a site (or set Sites to None)"
            : `Site ${i + 1} is required (or set Sites to None)`;
        }
      }
    }

    if (!f.start_date) return "Start Date is required";
    if (!f.end_date) return "End Date is required";
  }

  if (step === 3) {
    // Product validation — optional, but every row must be filled if chosen
    const productCount = f.product_count ?? -1;
    if (productCount > 0) {
      for (let i = 0; i < productCount; i++) {
        if (!f.products[i]) {
          return productCount === 1
            ? "Please select a product (or set Products to None)"
            : `Product ${i + 1} is required (or set Products to None)`;
        }
      }
    }

    if (f.service_count < 1) {
      return "Please choose how many services you need";
    }
    for (let i = 0; i < f.service_count; i++) {
      const s = f.services[i];
      const pfx = f.service_count === 1 ? "" : `Service ${i + 1}: `;
      if (!s?.category) return `${pfx}Category is required`;
      if (!s?.sub_category) return `${pfx}Sub Category is required`;
      if (!s?.service_id) return `${pfx}Component is required`;
    }
  }

  if (step === 4) {
    if (String(f.rollup_performance).trim() === "")
      return "% Roll-up Performance is required";
    if (isNaN(Number(f.rollup_performance)))
      return "% Roll-up Performance must be numeric";
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
        const v = String(
          f[`mtt_respond_${p}` as keyof MetricWizardForm] ?? ""
        ).trim();
        if (!v) return `MTTrespond ${p} is required`;
        if (isNaN(Number(v))) return `MTTrespond ${p} must be numeric`;
      }
    }
    if (showResolve) {
      for (const p of PRIORITIES) {
        const v = String(
          f[`mtt_resolve_${p}` as keyof MetricWizardForm] ?? ""
        ).trim();
        if (!v) return `MTTresolve ${p} is required`;
        if (!isValidMttrResolve(v))
          return `MTTresolve ${p} must be a number or "TD"`;
      }
    }
  }

  if (step === 5) {
    if (!f.cluster_id) return "Cluster is required";
    if (!f.action) return "Action is required";
  }

  return null;
}

type Combination = {
  supportGroupId: string;
  service: ServiceSelection;
  site: string;
  product: string;
  index: number;
};

function buildCombinations(f: MetricWizardForm): Combination[] {
  const groups = (f.support_groups ?? []).filter(Boolean);
  const services = (f.services ?? []).filter((s) => s.service_id);
  const sites = iterableFor(f.sites);
  const products = iterableFor(f.products);
  if (!groups.length || !services.length) return [];
  const combos: Combination[] = [];
  let idx = 0;
  for (const sg of groups) {
    for (const svc of services) {
      for (const site of sites) {
        for (const product of products) {
          combos.push({
            supportGroupId: sg,
            service: svc,
            site,
            product,
            index: idx++,
          });
        }
      }
    }
  }
  return combos;
}

function newBatchId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function CreateMetrics() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const draft = useWizardDraft();
  const lookups = useWizardLookups();

  const [step, setStep] = useState(1);
  const [mttrModalOpen, setMttrModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

    const combos = buildCombinations(draft.form);
    if (combos.length === 0) {
      error("No valid combinations to create");
      return;
    }

    setSubmitting(true);

    // All metrics from one submit share a batch_id when there is more than one.
    const batchId = combos.length > 1 ? newBatchId() : null;

    const createdIds: string[] = [];
    const failures: string[] = [];

    for (const combo of combos) {
      const variant: MetricWizardForm = {
        ...draft.form,
        support_group_id: combo.supportGroupId,
        service_category: combo.service.category,
        service_sub_category: combo.service.sub_category,
        service_id: combo.service.service_id,
        site_id: combo.site,
        product_category_id: combo.product,
      };

      try {
        const id = await createMetric(variant, batchId);
        createdIds.push(id);
        console.log(
          `[batch ${batchId ?? "single"}] created #${combo.index + 1}`,
          {
            document_id: variant.document_id,
            support_group_id: combo.supportGroupId,
            service_id: combo.service.service_id,
            site_id: combo.site || "(none)",
            product_category_id: combo.product || "(none)",
            id,
          }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        failures.push(`#${combo.index + 1}: ${msg}`);
        console.error(
          `[batch ${batchId ?? "single"}] FAILED #${combo.index + 1}`,
          {
            document_id: variant.document_id,
            support_group_id: combo.supportGroupId,
            service_id: combo.service.service_id,
            site_id: combo.site || "(none)",
            product_category_id: combo.product || "(none)",
            error: msg,
          }
        );
      }
    }

    setSubmitting(false);

    if (failures.length === 0) {
      success(
        combos.length > 1
          ? `${createdIds.length} metrics created as one batch`
          : `Metric created`
      );
      draft.reset();
      setStep(1);
      navigate("/history");
    } else if (createdIds.length === 0) {
      error(`All ${failures.length} creation(s) failed. See browser console.`);
      console.error("Metric creation failures:", failures);
    } else {
      error(
        `${createdIds.length} created, ${failures.length} failed. See browser console.`
      );
      console.error("Metric creation failures:", failures);
      draft.reset();
      setStep(1);
      navigate("/history");
    }
  }

  if (lookups.loading) {
    return (
      <div className="card">
        <div className="empty">Loading reference data…</div>
      </div>
    );
  }

  const combos = buildCombinations(draft.form);

  return (
    <>
      <div className="wizard-grid">
        <div className="card">
          <Stepper current={step} />

          <div className="wizard-body">
            {step === 1 && (
              <Step1Company
                form={draft.form}
                update={draft.update}
                lookups={lookups}
              />
            )}
            {step === 2 && (
              <Step2Support
                form={draft.form}
                update={draft.update}
                lookups={lookups}
              />
            )}
            {step === 3 && (
              <Step3Product
                form={draft.form}
                update={draft.update}
                lookups={lookups}
              />
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
              <Step5Cluster
                form={draft.form}
                update={draft.update}
                lookups={lookups}
              />
            )}
            {step === 6 && <Step6Review form={draft.form} lookups={lookups} />}
          </div>

          <div className="wizard-foot">
            <button
              className="btn btn-ghost"
              onClick={prev}
              disabled={step === 1 || submitting}
            >
              ← Back
            </button>
            {step < 6 ? (
              <button className="btn btn-primary" onClick={next}>
                Next →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={submitting}
              >
                {submitting
                  ? "Creating…"
                  : combos.length > 1
                  ? `Create ${combos.length} Metrics`
                  : "Create Metric"}
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
        onConfirm={() => undefined}
      />
    </>
  );
}