import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import type { MetricWizardForm, MttrMode } from "../../types/metrics";

type Props = {
  open: boolean;
  onClose: () => void;
  form: MetricWizardForm;
  update: (patch: Partial<MetricWizardForm>) => void;
  onConfirm: (mode: MttrMode) => void;
};

export default function MttrModeModal({ open, onClose, form, update, onConfirm }: Props) {
  const [selected, setSelected] = useState<MttrMode>(form.mttr_mode || "");

  useEffect(() => {
    if (open) setSelected(form.mttr_mode || "");
  }, [open, form.mttr_mode]);

  function confirm() {
    if (!selected) return;
    // Clear the fields belonging to the hidden side
    const patch: Partial<MetricWizardForm> = { mttr_mode: selected };
    if (selected === "respond") {
      patch.mtt_resolve_critical = "";
      patch.mtt_resolve_high = "";
      patch.mtt_resolve_medium = "";
      patch.mtt_resolve_low = "";
    }
    if (selected === "resolve") {
      patch.mtt_respond_critical = "";
      patch.mtt_respond_high = "";
      patch.mtt_respond_medium = "";
      patch.mtt_respond_low = "";
    }
    update(patch);
    onConfirm(selected);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="MTTR Configuration"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={confirm} disabled={!selected}>
            Continue
          </button>
        </>
      }
    >
      <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 4 }}>
        Which MTTR targets apply to this metric? Choose the options that match the contract.
      </p>

      <div className="mttr-mode-grid">
        <label
          className={`mttr-mode-card ${selected === "respond" ? "selected" : ""}`}
          onClick={() => setSelected("respond")}
        >
          <input type="radio" name="mttr_mode" value="respond" readOnly checked={selected === "respond"} />
          <div className="mmc-check" />
          <div className="mmc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <div className="mmc-title">Respond only</div>
          <div className="mmc-sub">Only MTTrespond targets will be captured</div>
        </label>

        <label
          className={`mttr-mode-card ${selected === "resolve" ? "selected" : ""}`}
          onClick={() => setSelected("resolve")}
        >
          <input type="radio" name="mttr_mode" value="resolve" readOnly checked={selected === "resolve"} />
          <div className="mmc-check" />
          <div className="mmc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="mmc-title">Resolve only</div>
          <div className="mmc-sub">Accepts a number or TD (target-date driven)</div>
        </label>

        <label
          className={`mttr-mode-card ${selected === "both" ? "selected" : ""}`}
          onClick={() => setSelected("both")}
        >
          <input type="radio" name="mttr_mode" value="both" readOnly checked={selected === "both"} />
          <div className="mmc-check" />
          <div className="mmc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="mmc-title">Both</div>
          <div className="mmc-sub">Capture both respond and resolve targets</div>
        </label>
      </div>

      <div
        style={{
          marginTop: 6,
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 10,
          padding: "10px 14px",
          fontSize: 11.5,
          color: "#1e40af",
        }}
      >
        <strong>MTTrespond</strong> must be numeric (minutes). <strong>MTTresolve</strong> accepts
        a number <em>or</em> <code>TD</code>.
      </div>
    </Modal>
  );
}