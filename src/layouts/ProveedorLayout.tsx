import { Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, Inbox, FileText,
  Trophy, Wallet, User, Gavel, FileCheck2, Store, BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiPerfil } from "@/lib/api/proveedores";
import { PortalShellLayout, type PortalNavItem } from "@/components/layout/PortalShellLayout";

const navItems: PortalNavItem[] = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "homologacion", label: "Homologación", icon: ShieldCheck },
  { to: "invitaciones", label: "Invitaciones", icon: Inbox },
  { to: "ofertas", label: "Mis Ofertas", icon: FileText },
  { to: "subasta", label: "Subasta en Vivo", icon: Gavel },
  { to: "historial", label: "Historial", icon: Trophy },
  { to: "desempeno", label: "Mi desempeño", icon: BarChart3 },
  { to: "contratos", label: "Mis Contratos", icon: FileCheck2 },
  { to: "pagos", label: "Pagos", icon: Wallet },
  { to: "perfil", label: "Perfil Empresa", icon: User },
  { to: "vitrina", label: "Mi Vitrina", icon: Store },
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
