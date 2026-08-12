import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  LayoutDashboard, FileText, Gavel, Handshake, Award,
  FileCheck, Truck, Building2, BarChart3, Settings,
  ShieldCheck, Scale, Users, SlidersHorizontal, LogOut,
  ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import type { Role } from "@/lib/mock/users";

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; roles?: Role[] }[] = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "requerimientos", label: "Requerimientos", icon: FileText },
  { to: "licitaciones", label: "Licitaciones", icon: Gavel, roles: ["comprador", "admin_cliente", "aprobador_cfo"] },
  { to: "negociacion", label: "Negociación", icon: Handshake, roles: ["comprador", "admin_cliente"] },
  { to: "adjudicacion", label: "Adjudicación", icon: Award, roles: ["comprador", "admin_cliente", "aprobador_cfo"] },
  { to: "contratos", label: "Contratos / POs", icon: FileCheck },
  { to: "seguimiento", label: "Seguimiento", icon: Truck, roles: ["comprador", "admin_cliente"] },
  { to: "disputas", label: "Disputas", icon: Scale, roles: ["comprador", "admin_cliente"] },
  { to: "directorio", label: "Directorio Proveedores", icon: Building2, roles: ["comprador", "admin_cliente"] },
  { to: "analitica", label: "Analítica CFO", icon: BarChart3, roles: ["aprobador_cfo", "admin_cliente"] },
  { to: "aprobaciones", label: "Aprobaciones", icon: ShieldCheck, roles: ["comprador", "aprobador_cfo", "admin_cliente"] },
  { to: "usuarios", label: "Usuarios y Roles", icon: Users, roles: ["admin_cliente"] },
  { to: "matriz-aprobacion", label: "Matriz de Aprobación", icon: SlidersHorizontal, roles: ["admin_cliente"] },
];

export function ClienteLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, activeCompany, logout } = useAuth();
  const { collapsed, toggle } = useSidebarCollapsed();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.slice(2).map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  const visibleItems = navItems.filter((item) => !item.roles || (currentUser && item.roles.includes(currentUser.role)));

  function handleLogout() {
    logout();
    navigate("/cliente/login", { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={cn("flex shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-200", collapsed ? "w-16" : "w-64")}>
        <div className={cn("flex h-16 items-center gap-2", collapsed ? "justify-center px-2" : "px-6")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-brand text-white font-bold text-sm">P</div>
          {!collapsed && <span className="text-lg font-bold text-gradient">Procurex</span>}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={toggle}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Colapsar</>}
          </button>
          <div className={cn("flex items-center gap-3 rounded-lg bg-sidebar-accent p-3", collapsed && "justify-center p-2")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">{currentUser?.iniciales}</div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{currentUser?.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{activeCompany?.nombre}</p>
                </div>
                <NavLink to="configuracion" className="text-muted-foreground hover:text-foreground" title="Configuración de cuenta">
                  <Settings className="h-4 w-4" />
                </NavLink>
                <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive" title="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader breadcrumbs={crumbs} portal="cliente" />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
