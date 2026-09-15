import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listRows } from "../lib/api";
import { esc } from "../lib/utils";

type Result = {
  type: "company" | "group" | "site" | "product" | "service" | "bhours" | "cluster" | "mttr";
  id: string;
  title: string;
  sub: string;
  page: string;
  keywords: string[];
};

const TYPE_META: Record<Result["type"], { label: string; icon: string; page: string }> = {
  company: { label: "Companies",          icon: "C", page: "/companies" },
  group:   { label: "Support Groups",     icon: "G", page: "/groups"    },
  site:    { label: "Sites",              icon: "S", page: "/sites"     },
  product: { label: "Product Categories", icon: "P", page: "/products"  },
  service: { label: "Services",           icon: "V", page: "/services"  },
  bhours:  { label: "Business Hours",     icon: "B", page: "/bhours"    },
  cluster: { label: "Clusters",           icon: "K", page: "/clusters"  },
  mttr:    { label: "MTTR Presets",       icon: "T", page: "/mttrs"     },
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const companies = useQuery({ queryKey: ["search", "companies"],   queryFn: () => listRows<any>("companies", "name") });
  const groups    = useQuery({ queryKey: ["search", "groups"],      queryFn: () => listRows<any>("support_groups", "name") });
  const sites     = useQuery({ queryKey: ["search", "sites"],       queryFn: () => listRows<any>("sites", "name") });
  const products  = useQuery({ queryKey: ["search", "products"],    queryFn: () => listRows<any>("product_categories", "tier1") });
  const services  = useQuery({ queryKey: ["search", "services"],    queryFn: () => listRows<any>("services", "category") });
  const bhours    = useQuery({ queryKey: ["search", "bhours"],      queryFn: () => listRows<any>("business_hours", "label") });
  const clusters  = useQuery({ queryKey: ["search", "clusters"],    queryFn: () => listRows<any>("clusters", "name") });
  const mttrs     = useQuery({ queryKey: ["search", "mttrs"],       queryFn: () => listRows<any>("mttr_presets", "name") });

  const index: Result[] = useMemo(() => {
    const out: Result[] = [];
    (companies.data ?? []).forEach((r) => out.push({
      type: "company", id: r.id, title: r.name, sub: `Company · ${r.external_id ?? "—"}`,
      page: "/companies", keywords: [r.name, r.external_id].filter(Boolean),
    }));
    (groups.data ?? []).forEach((r) => out.push({
      type: "group", id: r.id, title: r.name, sub: `Support Group`,
      page: "/groups", keywords: [r.name, r.external_id].filter(Boolean),
    }));
    (sites.data ?? []).forEach((r) => out.push({
      type: "site", id: r.id, title: r.name, sub: `Site`,
      page: "/sites", keywords: [r.name, r.external_id].filter(Boolean),
    }));
    (products.data ?? []).forEach((r) => out.push({
      type: "product", id: r.id,
      title: `${r.tier1} › ${r.tier2 ?? ""} › ${r.tier3 ?? ""} › ${r.product_name}`,
      sub: `Product · ${r.external_id ?? "—"}`,
      page: "/products", keywords: [r.tier1, r.tier2, r.tier3, r.product_name, r.external_id].filter(Boolean),
    }));
    (services.data ?? []).forEach((r) => out.push({
      type: "service", id: r.id, title: r.component,
      sub: `Service · ${r.category} › ${r.sub_category ?? ""}`,
      page: "/services", keywords: [r.category, r.sub_category, r.component, r.external_id].filter(Boolean),
    }));
    (bhours.data ?? []).forEach((r) => out.push({
      type: "bhours", id: r.id, title: r.label, sub: `Business Hours · ${r.schedule}`,
      page: "/bhours", keywords: [r.label, r.schedule, r.external_id].filter(Boolean),
    }));
    (clusters.data ?? []).forEach((r) => out.push({
      type: "cluster", id: r.id, title: r.name, sub: `Cluster`,
      page: "/clusters", keywords: [r.name, r.external_id].filter(Boolean),
    }));
    (mttrs.data ?? []).forEach((r) => out.push({
      type: "mttr", id: r.id, title: r.name, sub: `MTTR Preset`,
      page: "/mttrs", keywords: [r.name].filter(Boolean),
    }));
    return out;
  }, [companies.data, groups.data, sites.data, products.data, services.data, bhours.data, clusters.data, mttrs.data]);

  const results = useMemo(() => {
    if (!q || q.length < 1) return [];
    const ql = q.toLowerCase();
    return index
      .map((item) => {
        let best = 0;
        for (const f of [item.title, item.sub, ...item.keywords]) {
          const fl = String(f).toLowerCase();
          if (fl === ql) best = Math.max(best, 100);
          else if (fl.startsWith(ql)) best = Math.max(best, 70);
          else if (fl.includes(ql)) best = Math.max(best, 40);
        }
        return { item, score: best };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.item);
  }, [q, index]);

  useEffect(() => {
    setActiveIndex(0);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function pick(idx: number) {
    const r = results[idx];
    if (!r) return;
    navigate(r.page + `?highlight=${r.id}`);
    setQ("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); setQ(""); return; }
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(activeIndex); }
  }

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-box">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          value={q}
          placeholder="Search anything — companies, groups, services…"
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
        <kbd>⌘K</kbd>
      </div>

      {open && (
        <div className="search-dropdown">
          {!q ? (
            <div className="search-hint">
              <span>Type to search across the whole app</span>
              <span><kbd>esc</kbd> to close</span>
            </div>
          ) : !results.length ? (
            <div className="search-empty">No matches for "{esc(q)}"</div>
          ) : (
            <>
              {Object.entries(
                results.reduce<Record<string, { r: Result; idx: number }[]>>((acc, r, i) => {
                  (acc[r.type] = acc[r.type] || []).push({ r, idx: i });
                  return acc;
                }, {})
              ).map(([type, list]) => (
                <div key={type}>
                  <div className="search-group">{TYPE_META[type as Result["type"]].label}</div>
                  {list.map(({ r, idx }) => (
                    <div
                      key={r.id}
                      className={`search-item ${idx === activeIndex ? "active" : ""}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => pick(idx)}
                    >
                      <div className="si-icon">{TYPE_META[r.type].icon}</div>
                      <div className="si-main">
                        <div className="si-title">{r.title}</div>
                        <div className="si-sub">{r.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="search-hint">
                <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
                <span><kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}