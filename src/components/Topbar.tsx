import GlobalSearch from "./GlobalSearch";
import { useAuth } from "../contexts/AuthContext";

function roleLabel(role: string | undefined): string {
  if (role === "admin") return "Admin";
  if (role === "editor") return "Editor";
  return "User";
}

export default function Topbar({
  title,
  subtitle,
  onBurger,
}: {
  title: string;
  subtitle: string;
  onBurger: () => void;
}) {
  const { profile } = useAuth();
  const role = profile?.role;

  return (
    <header className="topbar">
      <button className="burger" onClick={onBurger} aria-label="Toggle navigation">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="page-title">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <GlobalSearch />

      <div className="topbar-actions">
        <div className={`role-chip ${role === "admin" ? "" : "user"}`}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span>{roleLabel(role)}</span>
        </div>
      </div>
    </header>
  );
}