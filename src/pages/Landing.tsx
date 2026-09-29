import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Feature = {
  title: string;
  desc: string;
  color: string;
  bg: string;
  icon: JSX.Element;
};

const FEATURES: Feature[] = [
  {
    title: "Metric tracking",
    desc: "Define SLA objectives per client, priority tier, and service component. Track response and resolution targets with or without fixed time windows.",
    color: "#4f46e5",
    bg: "#eef2ff",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Excel import & export",
    desc: "Bulk-load configuration from spreadsheets with header auto-detection. Export the master sheet or any single metric in the exact column format your contracts require.",
    color: "#3b82f6",
    bg: "#eff6ff",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    title: "Breach alerts",
    desc: "Every evaluation is compared against its target. Breaches fan out to admins in real time — in-app immediately, by email when configured.",
    color: "#ef4444",
    bg: "#fef2f2",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    title: "Live dashboard",
    desc: "KPIs, compliance trends, and status distribution update as new metrics are created — no refresh required. Drill into any figure with one click.",
    color: "#10b981",
    bg: "#ecfdf5",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    title: "Audit trail",
    desc: "Every insert, update, and delete is logged with the actor, timestamp, and before/after values. Compliance reviewers get the full story without digging.",
    color: "#f59e0b",
    bg: "#fffbeb",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Three-tier access",
    desc: "Admins, editors, and standard users each see only what they should. Permissions are enforced at the database layer, not just hidden in the UI.",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    title: "Configure",
    desc: "Load companies, support groups, products, services, and business hours. Import from a spreadsheet, or let the nightly ITSM sync keep everything in step.",
  },
  {
    title: "Create metrics",
    desc: "Walk through a guided wizard to define each SLA. Every target, priority tier, and support group is captured in a single atomic record.",
  },
  {
    title: "Track compliance",
    desc: "Evaluate actuals against targets. Breaches trigger alerts. The dashboard, history, and exports give you everything you need to prove compliance.",
  },
];

const ROLES = [
  {
    key: "admin",
    name: "Administrator",
    badge: "Full access",
    perms: [
      "Everything an Editor can do",
      "Create, edit, and delete users",
      "Change roles and deactivate accounts",
      "View audit log and import history",
    ],
  },
  {
    key: "editor",
    name: "Editor",
    badge: "Ops + Config",
    perms: [
      "Everything a User can do",
      "Add and edit configuration data",
      "Import spreadsheets",
      "View the full dashboard",
    ],
  },
  {
    key: "user",
    name: "Standard User",
    badge: "Ops only",
    perms: [
      "Create and view metrics",
      "Browse Metrics History",
      "Export the master sheet",
      "Receive in-app notifications",
    ],
  },
];

export default function Landing() {
  const { user } = useAuth();

  const destination = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Go to Dashboard" : "Sign In";

  return (
    <div className="landing">
      {/* ── Nav ── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <span className="landing-brand-mark">SLAMS</span>
            <span className="landing-brand-name">SLA Management System</span>
          </Link>

          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#roles">Roles</a>
          </nav>

          <Link to={destination} className="landing-cta-top">
            {ctaLabel}
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <span className="landing-eyebrow">
              <span className="dot" />
              Enterprise SLA management
            </span>

            <h1>
              SLA compliance,
              <br />
              <span className="grad">without the spreadsheet chaos</span>
            </h1>

            <p className="landing-lede">
              SLAMS centralises every client contract, support group, and service
              component in one system. Track response and resolution targets,
              export compliance reports in your exact format, and catch breaches
              before they cost you.
            </p>

            <div className="landing-hero-ctas">
              <Link to={destination} className="landing-btn-primary">
                {ctaLabel}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a href="#features" className="landing-btn-secondary">
                See features
              </a>
            </div>

            <div className="landing-hero-trust">
              <div>
                <div className="landing-trust-num">3-tier</div>
                <div className="landing-trust-lbl">RBAC model</div>
              </div>
              <div>
                <div className="landing-trust-num">58</div>
                <div className="landing-trust-lbl">Export columns</div>
              </div>
              <div>
                <div className="landing-trust-num">Realtime</div>
                <div className="landing-trust-lbl">Dashboard updates</div>
              </div>
            </div>
          </div>

          {/* Mock dashboard visual */}
          <div className="landing-hero-visual" aria-hidden="true">
            <div className="landing-mock">
              <div className="landing-mock-head">
                <div className="landing-mock-dots">
                  <span /><span /><span />
                </div>
                <div className="landing-mock-title">Dashboard</div>
              </div>

              <div className="landing-mock-kpis">
                <div className="landing-mock-kpi">
                  <div className="landing-mock-kpi-lbl">Active</div>
                  <div className="landing-mock-kpi-val">148</div>
                </div>
                <div className="landing-mock-kpi">
                  <div className="landing-mock-kpi-lbl">Compliance</div>
                  <div className="landing-mock-kpi-val">94.2%</div>
                </div>
                <div className="landing-mock-kpi">
                  <div className="landing-mock-kpi-lbl">Breaches</div>
                  <div className="landing-mock-kpi-val">9</div>
                </div>
              </div>

              <div className="landing-mock-chart">
                <svg viewBox="0 0 300 100" width="100%" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="landingArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity=".35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 70 L 30 62 L 60 66 L 90 55 L 120 58 L 150 45 L 180 48 L 210 32 L 240 35 L 270 22 L 300 18 L 300 100 L 0 100 Z"
                    fill="url(#landingArea)"
                  />
                  <path
                    d="M 0 70 L 30 62 L 60 66 L 90 55 L 120 58 L 150 45 L 180 48 L 210 32 L 240 35 L 270 22 L 300 18"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="landing-mock-rows">
                <div className="landing-mock-row">
                  <span>3526_R</span>
                  <span className="ok">Met</span>
                </div>
                <div className="landing-mock-row">
                  <span>4102_A</span>
                  <span className="ok">Met</span>
                </div>
                <div className="landing-mock-row">
                  <span>3955_T</span>
                  <span className="warn">At Risk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Capabilities</span>
            <h2>Everything you need to run SLA operations</h2>
            <p>
              From contract definition to breach notification — SLAMS covers the
              full lifecycle.
            </p>
          </div>

          <div className="landing-features">
            {FEATURES.map((f) => (
              <div className="landing-feature" key={f.title}>
                <div
                  className="landing-feature-icon"
                  style={{ background: f.bg, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <div className="landing-section-head">
            <span className="landing-eyebrow">How it works</span>
            <h2>Three steps from contract to compliance</h2>
          </div>

          <div className="landing-steps">
            {STEPS.map((s, i) => (
              <div className="landing-step" key={s.title}>
                <div className="landing-step-num">{i + 1}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Access model</span>
            <h2>Security built around three roles</h2>
            <p>
              Every permission is enforced at the database layer, not just hidden
              in the UI.
            </p>
          </div>

          <div className="landing-roles">
            {ROLES.map((r) => (
              <div className={`landing-role landing-role-${r.key}`} key={r.key}>
                <div className="landing-role-head">
                  <h3>{r.name}</h3>
                  <span className="landing-role-badge">{r.badge}</span>
                </div>
                <ul>
                  {r.perms.map((p) => (
                    <li key={p}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="landing-cta-section">
        <div className="landing-cta-inner">
          <h2>Ready to take control of your SLAs?</h2>
          <p>Sign in to your workspace, or contact your administrator for access.</p>
          <Link to={destination} className="landing-btn-primary landing-btn-lg">
            {ctaLabel}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-brand">
            <span className="landing-brand-mark">SLAMS</span>
            <span className="landing-brand-name">SLA Management System</span>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} SLA Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}