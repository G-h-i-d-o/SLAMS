import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="card" style={{ textAlign: "center", padding: 48 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>403 — Access Denied</h1>
      <p style={{ color: "#64748b", marginBottom: 20 }}>
        You don't have permission to view that page.
      </p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}