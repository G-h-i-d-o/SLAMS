import * as XLSX from "xlsx";
import type { ImportColumn } from "../../types/config";

export type ParseResult = {
  rows: Record<string, unknown>[];
  headers: string[];
  /** column.key -> the actual file header that matched it (or null) */
  mappedHeaders: Record<string, string | null>;
};

export async function parseFile(
  file: File,
  columns: ImportColumn[]
): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("The workbook contains no sheets.");

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: false,
  });
  if (!rows.length) throw new Error("No data rows found in the file.");

  const headers = Object.keys(rows[0]);

  const mappedHeaders: Record<string, string | null> = {};
  for (const col of columns) {
    const found = headers.find((h) => matchesAlias(h, col.aliases));
    mappedHeaders[col.key] = found ?? null;
  }

  return { rows, headers, mappedHeaders };
}

function matchesAlias(header: string, aliases: string[]): boolean {
  const h = header.toLowerCase().trim().replace(/[\s_]/g, "");
  return aliases.some((a) => {
    const al = a.toLowerCase().replace(/[\s_]/g, "");
    return h === al || h.includes(al);
  });
}