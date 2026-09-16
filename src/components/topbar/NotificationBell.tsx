import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { fmtDateTime } from "../../lib/utils";

export default function NotificationBell() {
  const { rows, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function openMetric(n: { metric_id: string | null }) {
    if (!n.metric_id) return;
    navigate(`/history?highlight=${n.metric_id}`);
    setOpen(false);
  }

  const recent = rows.slice(0, 6);

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="bell-dropdown">
          <div className="bell-head">
            <div style={{ fontSize: 13, fontWeight: 700 }}>Notifications</div>
            {unreadCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                Mark all read
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
              No notifications yet.
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {recent.map((n) => (
                <div
                  key={n.id}
                  className={`bell-item ${n.is_read ? "" : "unread"}`}
                  onClick={() => {
                    markRead.mutate(n.id);
                    openMetric(n);
                  }}
                >
                  <div className="bell-item-icon">
                    {n.kind === "breach" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    )}
                  </div>
                  <div className="bell-item-body">
                    <div className="bell-item-title">{n.title}</div>
                    {n.body && <div className="bell-item-sub">{n.body}</div>}
                    <div className="bell-item-time">{fmtDateTime(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bell-foot">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                navigate("/notifications");
                setOpen(false);
              }}
              style={{ width: "100%" }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}