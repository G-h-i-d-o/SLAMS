import type { DashboardTrendRow } from "../../hooks/useDashboard";

export default function TrendChart({ rows }: { rows: DashboardTrendRow[] }) {
  const W = 720, H = 260;
  const pl = 44, pr = 18, pt = 18, pb = 40;
  const iw = W - pl - pr;
  const ih = H - pt - pb;

  const max = Math.max(5, ...rows.map((r) => r.count));
  const niceMax = Math.ceil(max / 5) * 5;

  const X = (i: number) => (rows.length > 1 ? pl + (i / (rows.length - 1)) * iw : pl + iw / 2);
  const Y = (v: number) => pt + (1 - v / niceMax) * ih;

  // Gridlines
  const grid: string[] = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const v = (niceMax / steps) * i;
    const y = Y(v);
    grid.push(
      `<line x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}" stroke="#eef2f7" stroke-width="1"/>`,
      `<text x="${pl - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#94a3b8" font-family="inherit">${v}</text>`
    );
  }

  const line = rows.map((r, i) => `${i === 0 ? "M" : "L"} ${X(i)},${Y(r.count)}`).join(" ");
  const area =
    rows.length > 0
      ? `${line} L ${X(rows.length - 1)},${pt + ih} L ${X(0)},${pt + ih} Z`
      : "";

  const dots = rows
    .map(
      (r, i) =>
        `<circle cx="${X(i)}" cy="${Y(r.count)}" r="${
          i === rows.length - 1 ? 5 : 3.5
        }" fill="#fff" stroke="#4f46e5" stroke-width="${i === rows.length - 1 ? 3 : 2}"/>`
    )
    .join("");

  const labels = rows
    .map(
      (r, i) =>
        `<text x="${X(i)}" y="${H - 14}" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="inherit">${r.label
          .split(" ")[0]
          .slice(0, 3)}</text>`
    )
    .join("");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity=".28" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g dangerouslySetInnerHTML={{ __html: grid.join("") }} />
      {rows.length > 0 && (
        <>
          <path d={area} fill="url(#trendGrad)" />
          <path
            d={line}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <g dangerouslySetInnerHTML={{ __html: dots }} />
        </>
      )}
      <g dangerouslySetInnerHTML={{ __html: labels }} />
    </svg>
  );
}