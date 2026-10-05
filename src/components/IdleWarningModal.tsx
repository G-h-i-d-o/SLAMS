import { useEffect, useState } from "react";
import Modal from "./ui/Modal";

type Props = {
  open: boolean;
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
};

export default function IdleWarningModal({
  open,
  secondsLeft,
  onStay,
  onLogout,
}: Props) {
  const [remaining, setRemaining] = useState(secondsLeft);

  // Reset the countdown each time the modal opens, then tick every second
  useEffect(() => {
    if (!open) return;
    setRemaining(secondsLeft);
    const id = window.setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, secondsLeft]);

  return (
    <Modal
      open={open}
      onClose={onStay}
      title="Still there?"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onLogout}>
            Sign out now
          </button>
          <button className="btn btn-primary" onClick={onStay} autoFocus>
            Stay signed in
          </button>
        </>
      }
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#fffbeb",
            color: "#d97706",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            You've been inactive for a while. To keep your account secure,
            you'll be signed out automatically.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              padding: "12px 16px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 10,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-.5px",
                color: "#b45309",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(remaining).padStart(2, "0")}
            </span>
            <span style={{ fontSize: 12.5, color: "#92400e", fontWeight: 600 }}>
              seconds until automatic sign-out
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}