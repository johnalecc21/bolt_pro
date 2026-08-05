import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  LayoutDashboard, ClipboardCheck, FileEdit,
  TrendingUp, Scale, Building2, Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "dashboard", label: "Casos Activos", icon: LayoutDashboard },
  { to: "homologacion", label: "Cola Homologación", icon: ClipboardCheck },
  { to: "editor-rfp", label: "Editor RFP", icon: FileEdit },
  { to: "auditoria", label: "Auditoría Ahorro", icon: TrendingUp },
  { to: "mediacion", label: "Mediación Disputas", icon: Scale },
  { to: "clientes", label: "Admin Clientes", icon: Building2 },
  { to: "benchmark", label: "Benchmark Datos", icon: Database },
];

export function InternoLayout() {
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
        <div className="px-6 py-2">
          <span className="rounded-md bg-warning/15 px-2 py-1 text-xs font-medium text-warning-foreground">Panel Interno</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">AC</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Ana Consultora</p>
              <p className="truncate text-xs text-muted-foreground">Sourcing Expert</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader breadcrumbs={crumbs} portal="interno" />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
