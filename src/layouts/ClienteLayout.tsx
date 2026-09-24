import {
  Receipt,
  LayoutDashboard, FileText, Gavel, Handshake, Award,
  FileCheck, Truck, Building2, BarChart3,
  ShieldCheck, Scale, Users, SlidersHorizontal, Rocket, Landmark,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { PortalShellLayout, type PortalNavItem } from "@/components/layout/PortalShellLayout";
import { AceptarTerminosGate } from "@/components/legal/AceptarTerminosGate";

const navItems: PortalNavItem[] = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "onboarding", label: "Configurar empresa", icon: Rocket, roles: ["admin_cliente"] },
  { to: "requerimientos", label: "Requerimientos", icon: FileText },
  { to: "licitaciones", label: "Licitaciones", icon: Gavel, roles: ["comprador", "admin_cliente", "aprobador_cfo"] },
  { to: "negociacion", label: "Negociación", icon: Handshake, roles: ["comprador", "admin_cliente"] },
  { to: "adjudicacion", label: "Adjudicación", icon: Award, roles: ["comprador", "admin_cliente", "aprobador_cfo"] },
  { to: "contratos", label: "Contratos / POs", icon: FileCheck },
  { to: "seguimiento", label: "Seguimiento", icon: Truck, roles: ["comprador", "admin_cliente"] },
  { to: "pagos", label: "Cuentas por pagar", icon: Receipt, roles: ["comprador", "admin_cliente", "aprobador_cfo"] },
  { to: "disputas", label: "Disputas", icon: Scale, roles: ["comprador", "admin_cliente"] },
  { to: "directorio", label: "Directorio Proveedores", icon: Building2, roles: ["comprador", "admin_cliente"] },
  { to: "analitica", label: "Analítica CFO", icon: BarChart3, roles: ["aprobador_cfo", "admin_cliente"] },
  { to: "aprobaciones", label: "Aprobaciones", icon: ShieldCheck, roles: ["comprador", "aprobador_cfo", "admin_cliente"] },
  { to: "usuarios", label: "Usuarios y Roles", icon: Users, roles: ["admin_cliente"] },
  { to: "matriz-aprobacion", label: "Matriz de Aprobación", icon: SlidersHorizontal, roles: ["admin_cliente"] },
  { to: "estructura", label: "Estructura y presupuestos", icon: Landmark, roles: ["admin_cliente", "aprobador_cfo"] },
];

export function ClienteLayout() {
  const { currentUser, activeCompany } = useAuth();

  return (
    <PortalShellLayout
      portal="cliente"
      navItems={navItems}
      avatarClassName="bg-primary/20 text-primary"
      identityPrimary={currentUser?.nombre}
      identitySecondary={activeCompany?.nombre}
      showConfigLink
      topSlot={<AceptarTerminosGate />}
      remountKey={activeCompany?.id}
    />
  );
}
