import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  LayoutDashboard, FileText, Gavel, Handshake, Award,
  FileCheck, Truck, Building2, BarChart3, Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "requerimientos", label: "Requerimientos", icon: FileText },
  { to: "licitaciones", label: "Licitaciones", icon: Gavel },
  { to: "negociacion", label: "Negociación", icon: Handshake },
  { to: "adjudicacion", label: "Adjudicación", icon: Award },
  { to: "contratos", label: "Contratos / POs", icon: FileCheck },
  { to: "seguimiento", label: "Seguimiento", icon: Truck },
  { to: "directorio", label: "Directorio Proveedores", icon: Building2 },
  { to: "analitica", label: "Analítica CFO", icon: BarChart3 },
  { to: "aprobaciones", label: "Aprobaciones", icon: ShieldCheck },
];

export function ClienteLayout() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.slice(2).map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-white font-bold text-sm">P</div>
          <span className="text-lg font-bold text-gradient">ProcureOS</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">CM</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Carlos Méndez</p>
              <p className="truncate text-xs text-muted-foreground">Acme S.A.</p>
            </div>
            <NavLink to="configuracion" className="text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
            </NavLink>
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
