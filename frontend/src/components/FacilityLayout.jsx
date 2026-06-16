import Sidebar from "./Sidebar";
import { useAuth } from "../hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

export default function FacilityLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="text-text-muted font-mono text-sm animate-pulse">Loading...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
