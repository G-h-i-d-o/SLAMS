import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { initials } from "../lib/utils";

type NavItem = { to: string; label: string; icon: JSX.Element; adminOnly?: boolean };
type NavSection = { label: string; items: NavItem[] };

const icon = {
  home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  plus: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  building: <><path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" /><path d="M15 21V9h4a2 2 0 0 1 2 2v10" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
  pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /></>,
  hex: <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />,
  timer: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
};

const SECTIONS: NavSection[] = [
  {
    label: "Operations",
    items: [
      { to: "/",            label: "Home (Dashboard)", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.home}</svg> },
      { to: "/create",      label: "Create Metrics",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.plus}</svg> },
      { to: "/history",     label: "Metrics History",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.clock}</svg> },
      { to: "/notifications", label: "Notifications", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
    ],
  },
   {
    label: "Configuration",
    items: [
      { to: "/companies",          label: "Companies",                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.building}</svg> },
      { to: "/sg-companies",       label: "Support Group Companies",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.hex}</svg> },
      { to: "/support-orgs",       label: "Support Organizations",    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.grid}</svg> },
      { to: "/groups",             label: "Support Groups",           icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.users}</svg> },
      { to: "/sites",              label: "Sites",                    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.pin}</svg> },
      { to: "/products",           label: "Product Categories",       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.grid}</svg> },
      { to: "/services",           label: "Services",                 icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.layers}</svg> },
      { to: "/bhours",             label: "Business Hours",           icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.clock}</svg> },
      { to: "/clusters",           label: "Clusters",                 icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.hex}</svg> },
      { to: "/mttrs",              label: "MTTR Presets",             icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{icon.timer}</svg> },
    ],
    },
    {
    label: "Administration",
    items: [
      {
        to: "/import-history",
        label: "Import History",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            {icon.download}
          </svg>
        ),
        adminOnly: true,
      },
      {
        to: "/audit",
        label: "Audit Log",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            {icon.shield}
          </svg>
        ),
        adminOnly: true,
      },
    ],
  },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, user, isAdmin, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email || "…";

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">SLA</div>
        <div className="brand-text">
          <h1>SLA Management</h1>
          <span>Systems Console</span>
        </div>
      </div>

      <nav className="nav">
        {SECTIONS.map((sec) => {
          const visible = sec.items.filter((i) => !i.adminOnly || isAdmin);
          if (!visible.length) return null;
          return (
            <div key={sec.label}>
              <div className="nav-label">{sec.label}</div>
              {visible.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                  onClick={onClose}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <div className="user-chip">
          <div className="avatar">{initials(displayName)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="u-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.full_name || user?.email}
            </div>
            <div className="u-role">{isAdmin ? "Administrator" : "Standard User"}</div>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}