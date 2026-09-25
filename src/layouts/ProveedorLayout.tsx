import { Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, Wallet, User, FileCheck2, BarChart3, Target, Building,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiPerfil } from "@/lib/api/proveedores";
import { PortalShellLayout, type PortalNavEntry } from "@/components/layout/PortalShellLayout";

const navItems: PortalNavEntry[] = [
  { to: "dashboard", label: "Inicio", icon: LayoutDashboard },
  // One list for every process: new (invited or open in the network),
  // participating (offers and live auctions) and finished.
  { to: "procesos", label: "Procesos", icon: Target, contador: "procesos", contadorTitulo: "nuevos por responder" },
  {
    grupo: "contratos",
    label: "Contratos y pagos",
    icon: FileCheck2,
    items: [
      { to: "contratos", label: "Mis contratos", icon: FileCheck2 },
      { to: "pagos", label: "Pagos", icon: Wallet, contador: "pagos", contadorTitulo: "por facturar" },
    ],
  },
  {
    grupo: "empresa",
    label: "Mi empresa",
    icon: Building,
    items: [
      { to: "perfil", label: "Perfil y vitrina", icon: User },
      { to: "homologacion", label: "Homologación", icon: ShieldCheck },
      { to: "desempeno", label: "Mi desempeño", icon: BarChart3 },
    ],
  },
];

export function ProveedorLayout() {
  const location = useLocation();
  const { currentUser, activeCompany } = useAuth();
  const { data: perfil } = useApiData(fetchMiPerfil);

  if (perfil && !perfil.onboardingCompletado && location.pathname !== "/proveedor/onboarding") {
    return <Navigate to="/proveedor/onboarding" replace />;
  }

  return (
    <PortalShellLayout
      portal="proveedor"
      navItems={navItems}
      badge={{ label: "Portal Proveedores", className: "bg-info/15 text-info" }}
      avatarClassName="bg-success/20 text-success"
      identityPrimary={activeCompany?.nombre}
      identitySecondary={currentUser?.nombre}
    />
  );
}
