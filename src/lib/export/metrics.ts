import * as XLSX from "xlsx";
import type { MetricFull } from "../../types/metrics";

/* --------------------------------------------------------------
   The 58-column export layout — frozen as of Phase 0.
   Any change here is a breaking change to the Excel contract.
   -------------------------------------------------------------- */
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

/* Columns forced to Excel "Text" format (z:'@').
   Numeric values written here produce Excel's green
   "number stored as text" triangle. */
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
    "Contact_Company": m.contact_company ?? "",
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
    const R = rIdx + 1; // header is row 0
    TEXT_FORMAT_COLUMNS.forEach((col) => {
      const C = colIndex[col];
      if (C === undefined) return;
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const raw = row[col];
      if (raw === "" || raw === null || raw === undefined) {
        delete ws[addr];
        return;
      }
      // t:'s' → string cell · z:'@' → Excel Text number-format
      ws[addr] = { t: "s", v: String(raw), z: "@" };
    });
  });
}

function buildWorkbook(rows: Record<string, unknown>[]): XLSX.WorkBook {
  const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS });
  applyTextFormatting(ws, rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Combined");
  return wb;
}

export function exportSingleMetric(m: MetricFull) {
  const row = metricToRow(m);
  const wb = buildWorkbook([row]);
  const safeDocId = String(m.document_id || m.id).replace(
    /[^A-Za-z0-9_\-\.]/g,
    "_"
  );
  const filename = `${safeDocId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportMasterSheet(metrics: MetricFull[]) {
  const rows = metrics.map(metricToRow);
  const wb = buildWorkbook(rows);
  const filename = `SLA_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}