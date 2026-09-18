import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Props = { role: "admin" | "editor" };

export default function RequireRole({ role }: Props) {
  const { isAdmin, isEditor, loading } = useAuth();

  if (loading) return null;

  if (role === "admin" && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }
  if (role === "editor" && !isEditor) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}