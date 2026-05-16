import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/api";

export function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-muted text-sm">Φόρτωση...</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    // Wrong role for this section — send to their home
    const homeMap: Record<string, string> = {
      federation_admin: "/federation",
      club_admin: "/admin",
      coach: "/coach",
      parent: "/parent",
    };
    return <Navigate to={homeMap[user.role] ?? "/login"} replace />;
  }

  return <>{children}</>;
}
