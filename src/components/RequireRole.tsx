import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireRole({ role }: { role: "admin" | "user" }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;

  if (role === "admin" && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}