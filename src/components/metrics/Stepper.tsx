import { WIZARD_STEPS } from "../../types/metrics";

export default function Stepper({ current }: { current: number }) {
  return (
    <div className="stepper">
      {WIZARD_STEPS.map((s) => {
        const cls = current === s.n ? "active" : current > s.n ? "done" : "";
        return (
          <div key={s.n} className={`step-pill ${cls}`}>
            <span className="step-num">{current > s.n ? "✓" : s.n}</span>
            <span>{s.title}</span>
          </div>
        );
      })}
    </div>
  );
}