import { useEffect, useMemo, useRef, useState } from "react";

export type SSOption = { value: string; label: string };

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: SSOption[];
  required?: boolean;
  hint?: string;
  full?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  required,
  hint,
  full,
  placeholder,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Reset highlight when the query changes
  useEffect(() => {
    setHighlight(0);
  }, [query]);

  // Focus the search input when opening; clear query when closing
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  // Click outside closes the dropdown
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Scroll the highlighted option into view
  useEffect(() => {
    if (!open || !optionsRef.current) return;
    const nodes = optionsRef.current.querySelectorAll(".searchable-select-option");
    const el = nodes[highlight] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  function pick(opt: SSOption) {
    onChange(opt.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[highlight];
      if (target) pick(target);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  const widget = (
    <div className="searchable-select" ref={wrapRef}>
      <button
        type="button"
        className={`searchable-select-trigger ${open ? "open" : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        <span className={`ss-trigger-label ${selected ? "" : "placeholder"}`}>
          {selected ? selected.label : placeholder ?? "— Select —"}
        </span>
        <svg
          className="ss-trigger-caret"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search">
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Type to search…"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>

          <div className="searchable-select-options" ref={optionsRef}>
            {filtered.length === 0 ? (
              <div className="searchable-select-empty">No matches</div>
            ) : (
              filtered.map((opt, i) => (
                <div
                  key={opt.value}
                  className={`searchable-select-option ${
                    i === highlight ? "highlighted" : ""
                  } ${opt.value === value ? "selected" : ""}`}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(opt)}
                  title={opt.label}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (!label) return widget;

  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label>
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {widget}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}