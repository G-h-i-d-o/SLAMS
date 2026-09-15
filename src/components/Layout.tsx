import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const META: Record<string, { title: string; sub: string }> = {
  "/":          { title: "Home",                   sub: "Service level overview" },
  "/create":    { title: "Create Metrics",         sub: "Define a new service level objective" },
  "/history":   { title: "Metrics History",        sub: "All SLA evaluations" },
  "/companies": { title: "Companies",              sub: "Client organisations under SLA contract" },
  "/groups":    { title: "Support Groups",         sub: "Support Company → Support Org → Support Group" },
  "/sites":     { title: "Sites",                  sub: "Customer-exclusive sites" },
  "/products":  { title: "Product Categories",     sub: "Product Tier 1 → Tier 2 → Tier 3 → Product Name" },
  "/services":  { title: "Services",               sub: "Service Category → Sub Category → Component" },
  "/bhours":    { title: "Business Hours",         sub: "Working-hour calendars" },
  "/clusters":  { title: "Clusters",               sub: "Customer cluster information" },
  "/mttrs":     { title: "MTTR Presets",           sub: "Response and resolve targets" },
  "/import-history": { title: "Import History", sub: "Every manual upload and ITSM sync" },
  "/audit":     { title: "Audit Log",              sub: "All significant actions in the system" },
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = META[pathname] ?? { title: "SLA Management", sub: "" };

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar title={meta.title} subtitle={meta.sub} onBurger={() => setSidebarOpen((v) => !v)} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}