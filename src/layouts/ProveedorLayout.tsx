import { Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, Inbox, FileText, Trophy, Wallet, User, Gavel, FileCheck2, Store, BarChart3, Target, Building, Network,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiPerfil } from "@/lib/api/proveedores";
import { PortalShellLayout, type PortalNavEntry } from "@/components/layout/PortalShellLayout";

const navItems: PortalNavEntry[] = [
  { to: "dashboard", label: "Inicio", icon: LayoutDashboard },
  {
    grupo: "oportunidades",
    label: "Oportunidades",
    icon: Target,
    items: [
      { to: "oportunidades", label: "Red de oportunidades", icon: Network, contador: "oportunidades", contadorTitulo: "abiertas en tus categorías" },
      { to: "invitaciones", label: "Invitaciones", icon: Inbox, contador: "invitaciones", contadorTitulo: "sin responder" },
      { to: "ofertas", label: "Mis ofertas", icon: FileText },
      { to: "subasta", label: "Subasta en vivo", icon: Gavel },
      { to: "historial", label: "Historial", icon: Trophy },
    ],
  },
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
      { to: "perfil", label: "Perfil", icon: User },
      { to: "homologacion", label: "Homologación", icon: ShieldCheck },
      { to: "vitrina", label: "Mi vitrina", icon: Store },
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
