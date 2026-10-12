import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Forbidden() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Signed-in users go to the dashboard; anonymous visitors get bounced to login.
  const destination = user ? "/dashboard" : "/login";
  const label = user ? "Back to Dashboard" : "Sign in";

  return (
    <div className="card" style={{ textAlign: "center", padding: 48 }}>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          marginBottom: 8,
          letterSpacing: "-.4px",
        }}
      >
        403 — Access Denied
      </h1>
      <p style={{ color: "#64748b", marginBottom: 20 }}>
        You don't have permission to view that page.
      </p>

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
          type="button"
        >
          Go back
        </button>
        <Link to={destination} className="btn btn-primary">
          {label}
        </Link>
      </div>
    </div>
  );
}