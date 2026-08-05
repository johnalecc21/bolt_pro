import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Role } from "@/lib/mock/users";
import { PermissionDenied } from "@/components/shared/PermissionDenied";

export type PermissionMode = "full" | "readonly";

const PermissionModeContext = createContext<PermissionMode>("full");

export function usePermissionMode(): PermissionMode {
  return useContext(PermissionModeContext);
}

export function RequireRole({ allow, readonly = [], children }: {
  allow: Role[];
  readonly?: Role[];
  children: ReactNode;
}) {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  if (role && allow.includes(role)) {
    return <PermissionModeContext.Provider value="full">{children}</PermissionModeContext.Provider>;
  }
  if (role && readonly.includes(role)) {
    return <PermissionModeContext.Provider value="readonly">{children}</PermissionModeContext.Provider>;
  }
  return <PermissionDenied />;
}
