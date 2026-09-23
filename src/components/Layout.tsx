import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const META: Record<string, { title: string; sub: string }> = {
  "/":               { title: "Home", sub: "Service level overview" },
  "/create":         { title: "Create Metrics", sub: "Define a new service level objective" },
  "/history":        { title: "Metrics History", sub: "All SLA evaluations" },
  "/notifications":  { title: "Notifications", sub: "Breach alerts and system activity" },
  "/companies":      { title: "Companies", sub: "Client organisations under SLA contract" },
  "/sg-companies":   { title: "Support Group Companies", sub: "Top tier — independent support companies" },
  "/support-orgs":   { title: "Support Organizations", sub: "Middle tier — organizational units inside a Support Group Company" },
  "/groups":         { title: "Support Groups", sub: "Bottom tier — Support Group Company → Support Organization → Support Group" },
  "/sites":          { title: "Sites", sub: "Customer-exclusive sites" },
  "/products":       { title: "Product Categories", sub: "Product hierarchy & metric usage" },
  "/services":       { title: "Services", sub: "Service taxonomy" },
  "/bhours":         { title: "Business Hours", sub: "Working-hour calendars" },
  "/clusters":       { title: "Clusters", sub: "Customer cluster information" },
  "/mttrs":          { title: "MTTR Presets", sub: "Response and resolve targets" },
  "/users":          { title: "Users", sub: "Manage user accounts and roles" },
  "/import-history": { title: "Import History", sub: "Every manual upload and ITSM sync" },
  "/audit":          { title: "Audit Log", sub: "All significant actions in the system" },
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = META[pathname] ?? { title: "SLA Management", sub: "" };

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar
          title={meta.title}
          subtitle={meta.sub}
          onBurger={() => setSidebarOpen((v) => !v)}
        />
        <main id="main-content" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}