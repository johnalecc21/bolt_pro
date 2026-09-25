import {
  Cable, Receipt, LayoutDashboard, FileText, Gavel, Handshake, Award, FileCheck, Truck, Building2, BarChart3,
  ShieldCheck, Scale, Users, SlidersHorizontal, Rocket, Landmark, FileSignature, ShoppingCart, Wallet, Settings,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { PortalShellLayout, type PortalNavEntry } from "@/components/layout/PortalShellLayout";
import { AceptarTerminosGate } from "@/components/legal/AceptarTerminosGate";

/**
 * Grouped by the stage of the purchase, not by when each screen was built.
 * Each role only sees its own items; a group left with one item shows flat.
 */
const navItems: PortalNavEntry[] = [
  { to: "dashboard", label: "Inicio", icon: LayoutDashboard },
  {
    to: "onboarding",
    label: "Primeros pasos",
    icon: Rocket,
    roles: ["admin_cliente"],
    // Leaves the menu once the required setup steps are done.
    oculto: (c) => c.onboardingCompleto === true,
  },
  {
    grupo: "compras",
    label: "Compras",
    icon: ShoppingCart,
    items: [
      { to: "requerimientos", label: "Requerimientos", icon: FileText },
      { to: "licitaciones", label: "Licitaciones", icon: Gavel, roles: ["comprador", "admin_cliente", "aprobador_cfo"] },
      { to: "negociacion", label: "Negociación", icon: Handshake, roles: ["comprador", "admin_cliente"] },
      { to: "adjudicacion", label: "Adjudicación", icon: Award, roles: ["comprador", "admin_cliente", "aprobador_cfo"] },
      { to: "aprobaciones", label: "Aprobaciones", icon: ShieldCheck, roles: ["comprador", "aprobador_cfo", "admin_cliente"], contador: "aprobaciones", contadorTitulo: "por aprobar" },
    ],
  },
  {
    grupo: "contratos",
    label: "Contratos",
    icon: FileCheck,
    items: [
      { to: "contratos", label: "Contratos / POs", icon: FileCheck },
      { to: "seguimiento", label: "Seguimiento de entregas", icon: Truck, roles: ["comprador", "admin_cliente"] },
      { to: "disputas", label: "Disputas", icon: Scale, roles: ["comprador", "admin_cliente"] },
    ],
  },
  {
    grupo: "finanzas",
    label: "Finanzas",
    icon: Wallet,
    items: [
      { to: "pagos", label: "Cuentas por pagar", icon: Receipt, roles: ["comprador", "admin_cliente", "aprobador_cfo"], contador: "cuentasPorPagar", contadorTitulo: "facturas o pronto pagos por revisar" },
      { to: "analitica", label: "Analítica", icon: BarChart3, roles: ["aprobador_cfo", "admin_cliente"] },
      { to: "estructura", label: "Estructura y presupuestos", icon: Landmark, roles: ["admin_cliente", "aprobador_cfo"] },
    ],
  },
  { to: "directorio", label: "Directorio de proveedores", icon: Building2, roles: ["comprador", "admin_cliente"] },
  {
    grupo: "configuracion",
    label: "Configuración",
    icon: Settings,
    separado: true,
    items: [
      { to: "usuarios", label: "Usuarios y roles", icon: Users, roles: ["admin_cliente"] },
      { to: "matriz-aprobacion", label: "Matriz de aprobación", icon: SlidersHorizontal, roles: ["admin_cliente"] },
      { to: "plantillas", label: "Plantillas y documentos", icon: FileSignature, roles: ["admin_cliente"] },
      { to: "integraciones", label: "Integración ERP", icon: Cable, roles: ["admin_cliente", "aprobador_cfo"] },
    ],
  },
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
