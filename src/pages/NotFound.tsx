import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="card" style={{ textAlign: "center", padding: 48 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>404 — Not Found</h1>
      <p style={{ color: "#64748b", marginBottom: 20 }}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}