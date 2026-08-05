import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  LayoutDashboard, ShieldCheck, Inbox, FileText,
  Trophy, Wallet, User, Gavel, LogOut,
  ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

const navItems = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "homologacion", label: "Homologación", icon: ShieldCheck },
  { to: "invitaciones", label: "Invitaciones", icon: Inbox },
  { to: "ofertas", label: "Mis Ofertas", icon: FileText },
  { to: "subasta", label: "Subasta en Vivo", icon: Gavel },
  { to: "historial", label: "Historial", icon: Trophy },
  { to: "pagos", label: "Pagos / Factoring", icon: Wallet },
  { to: "perfil", label: "Perfil Empresa", icon: User },
];

export function ProveedorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, activeCompany, logout } = useAuth();
  const { collapsed, toggle } = useSidebarCollapsed();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.slice(2).map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  function handleLogout() {
    logout();
    navigate("/proveedor/login", { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={cn("flex shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-200", collapsed ? "w-16" : "w-64")}>
        <div className={cn("flex h-16 items-center gap-2", collapsed ? "justify-center px-2" : "px-6")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-brand text-white font-bold text-sm">P</div>
          {!collapsed && <span className="text-lg font-bold text-gradient">ProcureOS</span>}
        </div>
        {!collapsed && (
          <div className="px-6 py-2">
            <span className="rounded-md bg-info/15 px-2 py-1 text-xs font-medium text-info">Portal Proveedores</span>
          </div>
        )}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => (
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/20 text-success text-xs font-bold">{currentUser?.iniciales}</div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{activeCompany?.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{currentUser?.nombre}</p>
                </div>
                <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive" title="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader breadcrumbs={crumbs} portal="proveedor" />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
