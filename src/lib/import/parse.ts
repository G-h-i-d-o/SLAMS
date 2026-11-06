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

  // ---- Score every (column, header) pair, then greedily assign the ----
  // ---- highest-scoring pairs first, ensuring each header is used    ----
  // ---- at most once (a header is one column of data).              ----
  type Pair = { col: string; header: string; score: number };
  const pairs: Pair[] = [];

  for (const col of columns) {
    for (const header of headers) {
      const score = scoreAlias(header, col.aliases);
      if (score > 0) {
        pairs.push({ col: col.key, header, score });
      }
    }
  }

  // Sort by score desc — exact matches claim their header before looser ones
  pairs.sort((a, b) => b.score - a.score);

  const mappedHeaders: Record<string, string | null> = {};
  const claimed = new Set<string>();

  for (const { col, header } of pairs) {
    if (mappedHeaders[col] !== undefined && mappedHeaders[col] !== null) {
      // column already has a header
      continue;
    }
    if (claimed.has(header)) {
      // this header is already used by another column
      continue;
    }
    mappedHeaders[col] = header;
    claimed.add(header);
  }

  // Any column not assigned a header gets null
  for (const col of columns) {
    if (mappedHeaders[col.key] === undefined) {
      mappedHeaders[col.key] = null;
    }
  }

  return { rows, headers, mappedHeaders };
}

/**
 * Score how well a header matches a set of aliases.
 *
 * Tiers (highest to lowest):
 *   100 = exact match (case-insensitive, trimmed)
 *    90 = normalized exact (spaces/underscores removed)
 *    80 = header starts with the alias followed by a boundary
 *    70 = normalized header starts with normalized alias
 *    50 = header contains " <alias>" or "_<alias>" (word boundary)
 *    30 = normalized header contains normalized alias (loosest)
 *
 * Returns the best score across all aliases.
 */
function scoreAlias(header: string, aliases: string[]): number {
  const h = String(header).toLowerCase().trim();
  const hNorm = h.replace(/[\s_]/g, "");
  let best = 0;

  for (const a of aliases) {
    const al = String(a).toLowerCase().trim();
    const alNorm = al.replace(/[\s_]/g, "");

    if (h === al) {
      best = Math.max(best, 100);
    } else if (hNorm === alNorm) {
      best = Math.max(best, 90);
    } else if (h.startsWith(al + " ") || h.startsWith(al + "_")) {
      best = Math.max(best, 80);
    } else if (hNorm.startsWith(alNorm)) {
      best = Math.max(best, 70);
    } else if (
      h.includes(" " + al) ||
      h.includes("_" + al) ||
      h.includes("-" + al)
    ) {
      best = Math.max(best, 50);
    } else if (hNorm.includes(alNorm)) {
      best = Math.max(best, 30);
    }
  }

  return best;
}