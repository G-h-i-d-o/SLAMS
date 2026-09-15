import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", color: "#64748b" }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}