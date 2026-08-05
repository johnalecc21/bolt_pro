import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Portal } from "@/lib/mock/users";

export function ProtectedRoute({ portal, children }: { portal: Portal; children: ReactNode }) {
  const { currentUser, loginStep } = useAuth();
  const location = useLocation();

  if (!currentUser || currentUser.portal !== portal || loginStep !== "done") {
    return <Navigate to={`/${portal}/login`} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
