import Modal from "./Modal";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
  busy?: boolean;
};

export default function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm",
  onCancel, onConfirm, danger, busy,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}