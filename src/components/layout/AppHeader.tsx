import { useEffect, useState } from "react";
import { Search, ChevronRight, User, Settings, LogOut, Building2, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { useAuth } from "@/lib/auth/AuthContext";
import { requerimientos, proveedores } from "@/lib/mockData";

type Portal = "cliente" | "proveedor" | "interno";

const destinationsByPortal: Record<Portal, { label: string; to: string }[]> = {
  cliente: [
    { label: "Dashboard", to: "dashboard" },
    { label: "Nuevo requerimiento", to: "requerimientos/nuevo" },
    { label: "Licitaciones", to: "licitaciones" },
    { label: "Negociación", to: "negociacion" },
    { label: "Adjudicación", to: "adjudicacion" },
    { label: "Contratos / POs", to: "contratos" },
    { label: "Seguimiento", to: "seguimiento" },
    { label: "Disputas", to: "disputas" },
    { label: "Directorio de proveedores", to: "directorio" },
    { label: "Analítica CFO", to: "analitica" },
    { label: "Aprobaciones", to: "aprobaciones" },
  ],
  proveedor: [
    { label: "Dashboard", to: "dashboard" },
    { label: "Homologación", to: "homologacion" },
    { label: "Invitaciones", to: "invitaciones" },
    { label: "Mis ofertas", to: "ofertas" },
    { label: "Subasta en vivo", to: "subasta" },
    { label: "Historial", to: "historial" },
    { label: "Pagos / Factoring", to: "pagos" },
    { label: "Perfil empresa", to: "perfil" },
  ],
  interno: [
    { label: "Casos activos", to: "dashboard" },
    { label: "Cola de homologación", to: "homologacion" },
    { label: "Editor RFP", to: "editor-rfp" },
    { label: "Auditoría de ahorro", to: "auditoria" },
    { label: "Mediación de disputas", to: "mediacion" },
    { label: "Admin clientes", to: "clientes" },
    { label: "Benchmark de mercado", to: "benchmark" },
  ],
};

export function AppHeader({ breadcrumbs = [], portal = "cliente" }: { breadcrumbs?: string[]; portal?: Portal }) {
  const routeBase = `/${portal}`;
  const navigate = useNavigate();
  const { currentUser, activeCompany, switchCompany, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function go(path: string) {
    setSearchOpen(false);
    navigate(`${routeBase}/${path}`);
  }

  function handleLogout() {
    logout();
    navigate(`${routeBase}/login`, { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm">
        <Link to={`${routeBase}/dashboard`} className="text-muted-foreground hover:text-foreground">Inicio</Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}>{crumb}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setSearchOpen(true)}>
          <Search className="h-4 w-4" />
        </Button>

        <NotificationDropdown portal={portal} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>
              <Avatar className="h-9 w-9 border-2 border-primary/20 cursor-pointer">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {currentUser?.iniciales ?? "?"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{currentUser?.nombre}</p>
              <p className="text-xs font-normal text-muted-foreground">{currentUser?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`${routeBase}/configuracion`}>
                <User className="h-4 w-4" /> Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`${routeBase}/configuracion`}>
                <Settings className="h-4 w-4" /> Configuración
              </Link>
            </DropdownMenuItem>
            {currentUser && currentUser.companies.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Cambiar de empresa</DropdownMenuLabel>
                {currentUser.companies.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => switchCompany(c.id)}>
                    <Building2 className="h-4 w-4" />
                    {c.nombre}
                    {activeCompany?.id === c.id && <Check className="ml-auto h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Buscar" description="Navega rápidamente por ProcureOS">
        <CommandInput placeholder="Buscar pantallas, requerimientos, proveedores..." />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Ir a">
            {destinationsByPortal[portal].map((d) => (
              <CommandItem key={d.to} onSelect={() => go(d.to)}>{d.label}</CommandItem>
            ))}
          </CommandGroup>
          {portal === "cliente" && (
            <>
              <CommandGroup heading="Requerimientos">
                {requerimientos.slice(0, 5).map((r) => (
                  <CommandItem key={r.id} onSelect={() => go(`requerimientos/${r.id}`)}>{r.id} · {r.titulo}</CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Proveedores">
                {proveedores.slice(0, 5).map((p) => (
                  <CommandItem key={p.id} onSelect={() => go("directorio")}>{p.nombre}</CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  );
}
