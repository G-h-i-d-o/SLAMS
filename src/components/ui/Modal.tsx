import { ReactNode, useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (!open) return;

    const el = modalRef.current;
    if (!el) return;

    // This effect does ONE thing: trap Tab focus inside the modal.
    //
    // It does NOT auto-focus any field (that caused focus to bounce back to
    // the first input on every keystroke).
    //
    // It does NOT handle Escape-to-close or click-outside-to-close.
    // The modal closes only via:
    //   - the X button in the header (onClick={onClose})
    //   - the Cancel button in the footer (parent passes it)
    //   - the submit button (parent calls onClose after success)
    function getFocusables(): HTMLElement[] {
      if (!el) return [];
      const list = Array.from(
        el.querySelectorAll<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      // Hidden inputs (file, hidden) can't receive focus — exclude them so
      // the Tab cycle doesn't break.
      return list.filter((node) => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
    }

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusables = getFocusables();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // If focus is outside the modal (e.g. still on the trigger button
      // behind the overlay), pull it inside on the next Tab press.
      if (!el || !el.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    // No onClick handler on the overlay — clicking outside does nothing.
    <div className="modal-overlay">
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="modal-head">
          <h3 id={titleId.current}>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close dialog">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}