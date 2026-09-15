import type { DashboardStatusRow } from "../../hooks/useDashboard";

const COLORS: Record<string, string> = {
  active: "#10b981",
  pending: "#f59e0b",
  expired: "#94a3b8",
  terminated: "#ef4444",
};

const LABELS: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  expired: "Expired",
  terminated: "Terminated",
};

export default function StatusDonut({ rows }: { rows: DashboardStatusRow[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0);

  const r = 62, cx = 90, cy = 90, sw = 20;
  const C = 2 * Math.PI * r;

  let offset = 0;
  const arcs = rows.map((row) => {
    const len = total > 0 ? C * (row.count / total) : 0;
    const arc = {
      ...row,
      dasharray: `${Math.max(0, len - 2.5)} ${C - len + 2.5}`,
      dashoffset: -offset,
    };
    offset += len;
    return arc;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 180, height: 180 }}>
        <svg viewBox="0 0 180 180" width="180" height="180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
          {arcs.map((a) => (
            <circle
              key={a.status}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={COLORS[a.status] ?? "#cbd5e1"}
              strokeWidth={sw}
              strokeDasharray={a.dasharray}
              strokeDashoffset={a.dashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1 }}>
              {total}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--faint)",
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: ".7px",
              }}
            >
              Metrics
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 11, minWidth: 180, flex: 1 }}>
        {rows.length === 0 && (
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>No data yet</div>
        )}
        {rows.map((row) => {
          const pct = total > 0 ? (row.count / total) * 100 : 0;
          return (
            <div
              key={row.status}
              style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  flexShrink: 0,
                  background: COLORS[row.status] ?? "#cbd5e1",
                }}
              />
              <span style={{ color: "var(--muted)" }}>
                {LABELS[row.status] ?? row.status}
              </span>
              <span style={{ marginLeft: "auto", fontWeight: 700 }}>
                {row.count}{" "}
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>
                  ({pct.toFixed(1)}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}