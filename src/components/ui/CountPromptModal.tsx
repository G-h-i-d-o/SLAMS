import { useEffect, useState } from "react";
import Modal from "./Modal";

type Mode = "none" | "single" | "multi";

type Props = {
  open: boolean;
  title: string;
  question: string;
  singleLabel: string;
  multiLabel: string;
  /** When provided, a third "None" option is shown. */
  noneLabel?: string;
  /** Current count. -1 = undecided (first click), 0 = none, 1 = single, N > 1 = multi. */
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
  noneLabel,
  initialCount,
  maxCount = 20,
  onConfirm,
  onCancel,
}: Props) {
  const allowNone = !!noneLabel;
  const [mode, setMode] = useState<Mode>("single");
  const [count, setCount] = useState<number>(2);

  useEffect(() => {
    if (!open) return;
    if (initialCount > 1) {
      setMode("multi");
      setCount(initialCount);
    } else if (initialCount === 1) {
      setMode("single");
      setCount(2);
    } else if (initialCount === 0 && allowNone) {
      setMode("none");
      setCount(2);
    } else {
      // initialCount === -1 (undecided) — default to single if not optional
      setMode(allowNone ? "single" : "single");
      setCount(2);
    }
  }, [open, initialCount, allowNone]);

  function submit() {
    const finalCount =
      mode === "none"
        ? 0
        : mode === "single"
        ? 1
        : Math.max(2, Math.min(maxCount, count));
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
            <div className="count-option-sub">One entry</div>
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
              One metric per combination
            </div>
          </div>
        </label>

        {allowNone && (
          <label
            className={`count-option ${mode === "none" ? "selected" : ""}`}
            onClick={() => setMode("none")}
          >
            <input
              type="radio"
              name="count-mode"
              checked={mode === "none"}
              onChange={() => setMode("none")}
            />
            <div>
              <div className="count-option-title">{noneLabel}</div>
              <div className="count-option-sub">Skip this field entirely</div>
            </div>
          </label>
        )}
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