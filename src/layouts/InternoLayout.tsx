import {
  LayoutDashboard, ClipboardCheck,
  Scale, Building2, Database,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { PortalShellLayout, type PortalNavItem } from "@/components/layout/PortalShellLayout";

const navItems: PortalNavItem[] = [
  { to: "dashboard", label: "Casos Activos", icon: LayoutDashboard },
  { to: "homologacion", label: "Cola Homologación", icon: ClipboardCheck, roles: ["compliance_ops"] },
  { to: "mediacion", label: "Mediación Disputas", icon: Scale, roles: ["compliance_ops"] },
  { to: "clientes", label: "Admin Clientes", icon: Building2, roles: ["compliance_ops"] },
  { to: "benchmark", label: "Benchmark Datos", icon: Database, roles: ["compliance_ops"] },
];

export function InternoLayout() {
  const { currentUser } = useAuth();

  return (
    <PortalShellLayout
      portal="interno"
      navItems={navItems}
      badge={{ label: "Panel Interno", className: "bg-warning/15 text-warning-foreground" }}
      avatarClassName="bg-primary/20 text-primary"
      identityPrimary={currentUser?.nombre}
      identitySecondary={currentUser?.cargo}
    />
  );
}
