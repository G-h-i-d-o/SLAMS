import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { fmtDateTime } from "../lib/utils";

type Filter = "all" | "unread" | "breach";

export default function Notifications() {
  const { rows, unreadCount, isLoading, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  const filtered = rows.filter((r) => {
    if (filter === "unread") return !r.is_read;
    if (filter === "breach") return r.kind === "breach";
    return true;
  });

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Notifications</h3>
          <p>
            {rows.length} total · {unreadCount} unread
          </p>
        </div>
        <div className="right">
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
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {(["all", "unread", "breach"] as Filter[]).map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "unread" ? "Unread" : "Breaches"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="empty">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          {filter === "unread"
            ? "No unread notifications."
            : filter === "breach"
            ? "No breach notifications yet."
            : "No notifications yet."}
        </div>
      ) : (
        <div>
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id);
                if (n.metric_id) navigate(`/history?highlight=${n.metric_id}`);
              }}
              style={{
                display: "flex",
                gap: 12,
                padding: "14px 20px",
                borderBottom: "1px solid #f1f5f9",
                cursor: n.metric_id ? "pointer" : "default",
                background: n.is_read ? undefined : "#f8faff",
                transition: "background .12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = n.is_read ? "" : "#f8faff")
              }
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  background: n.kind === "breach" ? "#fef2f2" : "#eff6ff",
                  color: n.kind === "breach" ? "#ef4444" : "#3b82f6",
                }}
              >
                {n.kind === "breach" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: n.is_read ? 600 : 800,
                    marginBottom: 3,
                  }}
                >
                  {n.title}
                </div>
                {n.body && (
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                    {n.body}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "var(--faint)" }}>
                  {fmtDateTime(n.created_at)}
                </div>
              </div>
              {!n.is_read && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 50,
                    background: "var(--primary)",
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}