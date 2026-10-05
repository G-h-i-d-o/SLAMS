import { useEffect, useState } from "react";
import Modal from "./Modal";

type Props = {
  open: boolean;
  title: string;
  question: string;
  singleLabel: string;
  multiLabel: string;
  /** Current count — used to pre-select the radio and number input. */
  initialCount: number;
  maxCount?: number;
  onConfirm: (count: number) => void;
  onCancel: () => void;
};

export default function CountPromptModal({
  open,
  title,
  question,
  singleLabel,
  multiLabel,
  initialCount,
  maxCount = 20,
  onConfirm,
  onCancel,
}: Props) {
  const [mode, setMode] = useState<"single" | "multi">(
    initialCount > 1 ? "multi" : "single"
  );
  const [count, setCount] = useState<number>(initialCount > 1 ? initialCount : 2);

  useEffect(() => {
    if (!open) return;
    setMode(initialCount > 1 ? "multi" : "single");
    setCount(initialCount > 1 ? initialCount : 2);
  }, [open, initialCount]);

  function submit() {
    const finalCount = mode === "single" ? 1 : Math.max(2, Math.min(maxCount, count));
    onConfirm(finalCount);
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            Continue
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
        {question}
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
        <label
          className={`count-option ${mode === "single" ? "selected" : ""}`}
          onClick={() => setMode("single")}
        >
          <input
            type="radio"
            name="count-mode"
            checked={mode === "single"}
            onChange={() => setMode("single")}
          />
          <div>
            <div className="count-option-title">{singleLabel}</div>
            <div className="count-option-sub">One entry — the standard workflow</div>
          </div>
        </label>

        <label
          className={`count-option ${mode === "multi" ? "selected" : ""}`}
          onClick={() => setMode("multi")}
        >
          <input
            type="radio"
            name="count-mode"
            checked={mode === "multi"}
            onChange={() => setMode("multi")}
          />
          <div style={{ flex: 1 }}>
            <div className="count-option-title">{multiLabel}</div>
            <div className="count-option-sub">
              Choose how many — the wizard creates one metric per combination
            </div>
          </div>
        </label>
      </div>

      {mode === "multi" && (
        <div className="field" style={{ marginTop: 4 }}>
          <label>How many?</label>
          <input
            type="number"
            min={2}
            max={maxCount}
            value={count}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setCount(isNaN(v) ? 2 : v);
            }}
            autoFocus
          />
          <span className="hint">
            Between 2 and {maxCount}. You can change this later.
          </span>
        </div>
      )}
    </Modal>
  );
}