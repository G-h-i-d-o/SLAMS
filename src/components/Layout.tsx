import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">SLA</div>
          <div>
            <div className="brand-title">SLA Management Systems</div>
            <div className="brand-sub">Phase 0 · Foundations</div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
