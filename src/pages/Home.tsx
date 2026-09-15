import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { profile, user, isAdmin } = useAuth();
  const name = profile?.full_name || user?.email || "there";

  return (
    <>
      <div className="home-hero">
        <h1>Welcome back, {name}.</h1>
        <p>
          You're signed in as {isAdmin ? "an Administrator" : "a Standard User"}.
          {isAdmin
            ? " You have full access to configure and manage SLA metrics."
            : " You can browse configurations and create metrics."}
        </p>
      </div>

      <div className="grid g-3">
        <div className="card">
          <div className="card-head"><h3>Get started</h3></div>
          <div className="card-body" style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
            Phase 1 delivers the shell and configuration pages. Watch for Create Metrics
            and Metrics History in Phase 2 and 3.
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Global search</h3></div>
          <div className="card-body" style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
            Press <strong>⌘K</strong> (or <strong>Ctrl+K</strong>) anywhere to search across every
            configuration table. Click a result to jump straight to the row.
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Your role</h3></div>
          <div className="card-body" style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
            <strong>{isAdmin ? "Administrator" : "Standard User"}</strong>
            <br />
            {isAdmin
              ? "You can add, edit, and delete configurations."
              : "Configurations are read-only for you."}
          </div>
        </div>
      </div>
    </>
  );
}