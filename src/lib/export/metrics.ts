import * as XLSX from "xlsx";
import type { MetricFull } from "../../types/metrics";

export const EXPORT_COLUMNS: string[] = [
  "Start Date",
  "End Date",
  "Signed Date",
  "Customer Number",
  "Contact_Company",
  "DocumentID",
  "Support Group",
  "Site",
  "Service Category",
  "Service Sub Category",
  "Service Component",
  "Service Component (MPSS)",
  "Product _Tier1",
  "Product _Tier2",
  "Product _Tier3",
  "Product",
  "% Roll-up Performance",
  "Tiered / Configured / Non Catalogued",
  "Business Hours",
  "Business Hours  Critical",
  "Business Hours  High",
  "Business Hours  Medium",
  "Business Hours  Low",
  "MTTrespond Critical",
  "MTTResolve Critical",
  "MTTrespond High",
  "MTTResolve High",
  "MTTrespond  Medium",
  "MTTResolve Medium",
  "MTTrespond  Low",
  "MTTResolve Low",
  "Cluster",
  "New",
  "Modify",
  "Expire",
  "Terminate",
  "Vendor Group",
  "CHG_Start Date",
  "CHG_End Date",
  "CHG_Signed Date",
  "CHG_Support Group",
  "CHG_Product",
  "CHG_% Roll-up Performance",
  "CHG_Tiered / Configured / Non Catalogued",
  "CHG_Business Hours  Critical",
  "CHG_Business Hours  High",
  "CHG_Business Hours  Medium",
  "CHG_Business Hours  Low",
  "CHG_MTTrespond Critical",
  "CHG_MTTresolve Critical",
  "CHG_MTTrespond High",
  "CHG_MTTresolve High",
  "CHG_MTTrespond  Medium",
  "CHG_MTTresolve Medium",
  "CHG_MTTrespond  Low",
  "CHG_MTTresolve Low",
  "CHG_ServiceComp",
  "Exclude M7",
];

const TEXT_FORMAT_COLUMNS = [
  "Start Date",
  "End Date",
  "Signed Date",
  "Customer Number",
  "% Roll-up Performance",
  "MTTrespond Critical",
  "MTTResolve Critical",
  "MTTrespond High",
  "MTTResolve High",
  "MTTrespond  Medium",
  "MTTResolve Medium",
  "MTTrespond  Low",
  "MTTResolve Low",
];

function fmtDate(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function metricToRow(m: MetricFull): Record<string, unknown> {
  return {
    "Start Date": fmtDate(m.start_date),
    "End Date": fmtDate(m.end_date),
    "Signed Date": fmtDate(m.signed_date),
    "Customer Number": m.customer_number ?? "",
    Contact_Company: m.contact_company ?? "",
    DocumentID: m.document_id ?? "",
    "Support Group": m.support_group_name ?? "",
    Site: m.site_name ?? "",
    "Service Category": m.service_category ?? "",
    "Service Sub Category": m.service_sub_category ?? "",
    "Service Component": m.service_component ?? "",
    "Service Component (MPSS)": m.service_component_mpss ?? "",
    "Product _Tier1": m.product_tier1 ?? "",
    "Product _Tier2": m.product_tier2 ?? "",
    "Product _Tier3": m.product_tier3 ?? "",
    Product: m.product_name ?? "",
    "% Roll-up Performance": m.rollup_performance ?? "",
    "Tiered / Configured / Non Catalogued": m.tiered_type ?? "",
    "Business Hours": m.bh_critical_label ?? "",
    "Business Hours  Critical": m.bh_critical_label ?? "",
    "Business Hours  High": m.bh_high_label ?? "",
    "Business Hours  Medium": m.bh_medium_label ?? "",
    "Business Hours  Low": m.bh_low_label ?? "",
    "MTTrespond Critical": m.mtt_respond_critical ?? "",
    "MTTResolve Critical": m.mtt_resolve_critical ?? "",
    "MTTrespond High": m.mtt_respond_high ?? "",
    "MTTResolve High": m.mtt_resolve_high ?? "",
    "MTTrespond  Medium": m.mtt_respond_medium ?? "",
    "MTTResolve Medium": m.mtt_resolve_medium ?? "",
    "MTTrespond  Low": m.mtt_respond_low ?? "",
    "MTTResolve Low": m.mtt_resolve_low ?? "",
    Cluster: m.cluster_name ?? "",
    New: m.revision_action === "New" ? "yes" : "",
    Modify: m.revision_action === "Modify" ? "yes" : "",
    Expire: m.revision_action === "Expire" ? "yes" : "",
    Terminate: m.revision_action === "Terminate" ? "yes" : "",
    "Vendor Group": m.vendor_group ?? "",
    "CHG_Start Date": "",
    "CHG_End Date": "",
    "CHG_Signed Date": "",
    "CHG_Support Group": "",
    "CHG_Product": "",
    "CHG_% Roll-up Performance": "",
    "CHG_Tiered / Configured / Non Catalogued": "",
    "CHG_Business Hours  Critical": "",
    "CHG_Business Hours  High": "",
    "CHG_Business Hours  Medium": "",
    "CHG_Business Hours  Low": "",
    "CHG_MTTrespond Critical": "",
    "CHG_MTTresolve Critical": "",
    "CHG_MTTrespond High": "",
    "CHG_MTTresolve High": "",
    "CHG_MTTrespond  Medium": "",
    "CHG_MTTresolve Medium": "",
    "CHG_MTTrespond  Low": "",
    "CHG_MTTresolve Low": "",
    "CHG_ServiceComp": "",
    "Exclude M7": m.exclude_m7 ? "yes" : "",
  };
}

function applyTextFormatting(
  ws: XLSX.WorkSheet,
  rows: Record<string, unknown>[]
) {
  const colIndex: Record<string, number> = {};
  EXPORT_COLUMNS.forEach((c, i) => {
    colIndex[c] = i;
  });

  rows.forEach((row, rIdx) => {
    const R = rIdx + 1;
    TEXT_FORMAT_COLUMNS.forEach((col) => {
      const C = colIndex[col];
      if (C === undefined) return;
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const raw = row[col];
      if (raw === "" || raw === null || raw === undefined) {
        delete ws[addr];
        return;
      }
      ws[addr] = { t: "s", v: String(raw), z: "@" };
    });
  });
}

function safeFilename(s: string): string {
  return s.replace(/[^A-Za-z0-9_\-\.]/g, "_");
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------- */
/*  Core export — writes N metrics into a single sheet                  */
/* -------------------------------------------------------------------- */
export function exportMetricsGroup(
  metrics: MetricFull[],
  filenameBase: string
): void {
  if (!metrics.length) throw new Error("No metrics to export");
  const rows = metrics.map(metricToRow);
  const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS });
  applyTextFormatting(ws, rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Combined");
  XLSX.writeFile(wb, `${safeFilename(filenameBase)}_${todayStamp()}.xlsx`);
}

/* -------------------------------------------------------------------- */
/*  Export a single metric                                              */
/* -------------------------------------------------------------------- */
export function exportSingleMetric(m: MetricFull): void {
  exportMetricsGroup([m], String(m.document_id || m.id));
}

/* -------------------------------------------------------------------- */
/*  Export an entire batch — always one sheet, regardless of count      */
/* -------------------------------------------------------------------- */
export function exportBatch(metrics: MetricFull[], baseName?: string): void {
  if (metrics.length <= 1) {
    if (metrics[0]) exportSingleMetric(metrics[0]);
    return;
  }
  const name =
    baseName ??
    String(metrics[0]?.document_id ?? "batch").replace(/_\d+$/, "");
  exportMetricsGroup(metrics, `${name}_batch`);
}

/* -------------------------------------------------------------------- */
/*  Export an arbitrary selection — always one sheet                    */
/* -------------------------------------------------------------------- */
export function exportSelected(metrics: MetricFull[]): void {
  if (!metrics.length) throw new Error("No metrics selected");
  if (metrics.length === 1) {
    exportSingleMetric(metrics[0]);
    return;
  }
  exportMetricsGroup(metrics, `selection_${metrics.length}_metrics`);
}

/* -------------------------------------------------------------------- */
/*  Master export — every metric in one sheet                           */
/* -------------------------------------------------------------------- */
export function exportMasterSheet(metrics: MetricFull[]): void {
  exportMetricsGroup(metrics, "SLA_Export");
}