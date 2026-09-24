import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { LogOut, Settings, ChevronsLeft, ChevronsRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { LogoFull, LogoIcon } from "@/components/shared/Logo";
import { AppErrorBoundary } from "@/components/shared/ErrorBoundary";
import type { Role } from "@/lib/mock/users";
import { usePageMeta } from "@/hooks/usePageMeta";

export interface PortalNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

interface PortalShellLayoutProps {
  portal: "cliente" | "proveedor" | "interno";
  navItems: PortalNavItem[];
  /** Small colored pill under the logo — omit for portals that don't show one. */
  badge?: { label: string; className: string };
  avatarClassName: string;
  identityPrimary?: string;
  identitySecondary?: string;
  /** Rendered as the shell's first child — e.g. a blocking dialog like AceptarTerminosGate. */
  topSlot?: ReactNode;
  /** Cliente-only today: a sidebar-footer shortcut to Configuración, in addition
   * to the one already in AppHeader's avatar menu on every portal. */
  showConfigLink?: boolean;
  /** Forces a remount of the outlet content, e.g. activeCompany?.id on company switch —
   * otherwise every already-mounted page keeps its previous company's cached data until
   * the user happens to navigate away and back. */
  remountKey?: string;
}

/**
 * The sidebar/header shell shared by ClienteLayout, ProveedorLayout and
 * InternoLayout — was ~85% identical copy-paste across the three (sidebar,
 * collapse toggle, breadcrumb-from-pathname, avatar/logout block), with only
 * nav items, badge, avatar color and the identity block's two lines actually
 * differing. Portal-specific behavior that isn't just markup (ProveedorLayout's
 * onboarding redirect, ClienteLayout's AceptarTerminosGate) stays in each
 * portal's own thin Layout component — this only owns the shape.
 */
export function PortalShellLayout({
  portal,
  navItems,
  badge,
  avatarClassName,
  identityPrimary,
  identitySecondary,
  topSlot,
  remountKey,
  showConfigLink,
}: PortalShellLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { collapsed, toggle } = useSidebarCollapsed();
  const segments = location.pathname.split("/").filter(Boolean);
  // Record ids (cuids like "cmuel…", seed codes like "P-001") read as noise in
  // the breadcrumb — show them as "Detalle" instead.
  const crumbs = segments
    .slice(2)
    .map((s) => (/^c[a-z0-9]{20,}$/.test(s) || /^[A-Z]+-\d+$/.test(s) ? "Detalle" : s.charAt(0).toUpperCase() + s.slice(1)));
  const visibleItems = navItems.filter((item) => !item.roles || (currentUser && item.roles.includes(currentUser.role)));
  const section = navItems.find((item) => segments[1] === item.to.split("/")[0])?.label;
  usePageMeta({ title: section ?? crumbs.at(-1) ?? portal.charAt(0).toUpperCase() + portal.slice(1), noindex: true });

  function handleLogout() {
    logout();
    navigate(`/${portal}/login`, { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {topSlot}
      <aside className={cn("flex shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-200", collapsed ? "w-16" : "w-64")}>
        <div className={cn("flex h-16 items-center gap-2", collapsed ? "justify-center px-2" : "px-6")}>
          {collapsed ? <LogoIcon className="h-8 w-8" /> : <LogoFull className="h-7" />}
        </div>
        {badge && !collapsed && (
          <div className="px-6 py-2">
            <span className={cn("rounded-md px-2 py-1 text-xs font-medium", badge.className)}>{badge.label}</span>
          </div>
        )}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
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
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold", avatarClassName)}>
              {currentUser?.iniciales}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{identityPrimary}</p>
                  <p className="truncate text-xs text-muted-foreground">{identitySecondary}</p>
                </div>
                {showConfigLink && (
                  <NavLink to="configuracion" className="text-muted-foreground hover:text-foreground" title="Configuración de cuenta">
                    <Settings className="h-4 w-4" />
                  </NavLink>
                )}
                <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive" title="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader breadcrumbs={crumbs} portal={portal} />
        <main key={remountKey} className="flex-1 overflow-y-auto">
          <AppErrorBoundary fullScreen={false}>
            <Outlet />
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}
