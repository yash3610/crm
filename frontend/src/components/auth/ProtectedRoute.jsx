import { Navigate, Outlet, useLocation } from "react-router-dom";

import { WorkspaceSkeleton } from "@/components/common/LoadingSkeletons";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <WorkspaceSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
