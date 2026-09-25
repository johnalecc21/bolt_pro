import { Building2, ClipboardCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { PortalShellLayout, type PortalNavEntry } from "@/components/layout/PortalShellLayout";

const navItems: PortalNavEntry[] = [
  // Procurex follows each company as an account, homologates suppliers and
  // watches their risk. It does not take part in anyone's purchase processes.
  { to: "empresas", label: "Empresas", icon: Building2 },
  { to: "homologacion", label: "Cola de homologación", icon: ClipboardCheck, roles: ["compliance_ops"], contador: "homologacion", contadorTitulo: "por revisar" },
  { to: "riesgo", label: "Riesgo continuo", icon: ShieldAlert, roles: ["compliance_ops"], contador: "riesgo", contadorTitulo: "alertas abiertas" },
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
