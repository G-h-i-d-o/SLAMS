export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Auto ID generation — mirrors what the POC did client-side, but Phase 1
 *  generates these in a Postgres default instead (see Part 2). Kept here
 *  so we can reference the same alphabet if needed in UI hints. */
export const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";