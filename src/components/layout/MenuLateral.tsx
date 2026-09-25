import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/mock/users";
import type { ContadoresNav } from "@/lib/api/navegacion";

export interface PortalNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
  /** Key in the counters response whose value is shown as a badge. */
  contador?: string;
  /** What the badge means, for the tooltip ("por aprobar"). */
  contadorTitulo?: string;
  /** Hide it when this returns true (e.g. setup done). */
  oculto?: (c: ContadoresNav) => boolean;
}

export interface PortalNavGroup {
  grupo: string;
  label: string;
  icon: LucideIcon;
  items: PortalNavItem[];
  /** Rendered apart at the bottom (settings). */
  separado?: boolean;
}

export type PortalNavEntry = PortalNavItem | PortalNavGroup;

export const esGrupo = (e: PortalNavEntry): e is PortalNavGroup => "grupo" in e;

/** Every destination, groups flattened — for titles and breadcrumbs. */
export function hojas(entries: PortalNavEntry[]): PortalNavItem[] {
  return entries.flatMap((e) => (esGrupo(e) ? e.items : [e]));
}

/**
 * What this user sees: items filtered by role and by `oculto`; empty groups
 * disappear and a group left with one item shows as that item.
 */
export function visibles(entries: PortalNavEntry[], role: Role | undefined, c: ContadoresNav): PortalNavEntry[] {
  const ok = (i: PortalNavItem) => (!i.roles || (!!role && i.roles.includes(role))) && !i.oculto?.(c);
  return entries.flatMap<PortalNavEntry>((e) => {
    if (!esGrupo(e)) return ok(e) ? [e] : [];
    const items = e.items.filter(ok);
    if (items.length === 0) return [];
    if (items.length === 1 && !e.separado) return [items[0]];
    return [{ ...e, items }];
  });
}

const valor = (c: ContadoresNav, k?: string) => (k && typeof c[k] === "number" ? (c[k] as number) : 0);

function Contador({ n, titulo, compacto }: { n: number; titulo?: string; compacto?: boolean }) {
  if (n <= 0) return null;
  const texto = n > 99 ? "99+" : String(n);
  if (compacto)
    return <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" aria-label={`${n} ${titulo ?? "pendientes"}`} />;
  return (
    <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground" title={`${n} ${titulo ?? "pendientes"}`}>
      {texto}
      <span className="sr-only"> {titulo ?? "pendientes"}</span>
    </span>
  );
}

const claseItem = (activo: boolean, compacto: boolean) =>
  cn(
    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    compacto && "w-full justify-center px-0 py-2.5",
    activo ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

function Enlace({ item, c, compacto, sangria, onNavegar }: { item: PortalNavItem; c: ContadoresNav; compacto: boolean; sangria?: boolean; onNavegar?: () => void }) {
  return (
    <NavLink to={item.to} title={compacto ? item.label : undefined} onClick={onNavegar} className={({ isActive }) => cn(claseItem(isActive, compacto), sangria && !compacto && "pl-9")}>
      {!sangria || compacto ? <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      {!compacto && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      <Contador n={valor(c, item.contador)} titulo={item.contadorTitulo} compacto={compacto} />
    </NavLink>
  );
}

/** The group holding the given section of the portal, if any. */
function grupoDe(entries: PortalNavEntry[], seccion: string): PortalNavGroup | undefined {
  return entries.find((e): e is PortalNavGroup => esGrupo(e) && e.items.some((i) => i.to.split("/")[0] === seccion));
}

const CLAVE = (portal: string) => `procurex_menu_grupos_${portal}`;

function leerAbiertos(portal: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE(portal)) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * The side menu: plain items and collapsible groups. Entering a page opens
 * its group, but any group (the current one too) can be collapsed; open
 * groups are remembered. A collapsed group holding the current page stays
 * highlighted so the user still sees where they are.
 * With the sidebar collapsed, a group becomes an icon that opens its items.
 */
export function MenuLateral({
  portal, entries, contadores, compacto, onNavegar,
}: {
  portal: string;
  entries: PortalNavEntry[];
  contadores: ContadoresNav;
  compacto: boolean;
  /** Called after following a link (closes the mobile drawer). */
  onNavegar?: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const seccion = pathname.split("/")[2] ?? "";
  const [abiertos, setAbiertos] = useState<string[]>(() => {
    const guardados = leerAbiertos(portal);
    const inicial = grupoDe(entries, seccion)?.grupo;
    return inicial && !guardados.includes(inicial) ? [...guardados, inicial] : guardados;
  });
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE(portal), JSON.stringify(abiertos));
    } catch {
      // Private mode: the menu just won't remember.
    }
  }, [abiertos, portal]);

  const actual = useMemo(() => grupoDe(entries, seccion), [entries, seccion]);
  // Open the current page's group when arriving at a new section, not on every render.
  const grupoActual = actual?.grupo;
  useEffect(() => {
    if (grupoActual) setAbiertos((a) => (a.includes(grupoActual) ? a : [...a, grupoActual]));
  }, [grupoActual, seccion]);
  const principales = entries.filter((e) => !(esGrupo(e) && e.separado));
  const abajo = entries.filter((e) => esGrupo(e) && e.separado) as PortalNavGroup[];

  const grupo = (g: PortalNavGroup) => {
    const activo = actual?.grupo === g.grupo;
    const abierto = abiertos.includes(g.grupo);
    const total = g.items.reduce((s, i) => s + valor(contadores, i.contador), 0);
    if (compacto) {
      return (
        <DropdownMenu key={g.grupo}>
          <DropdownMenuTrigger asChild>
            <button type="button" className={claseItem(activo, true)} title={g.label} aria-label={g.label}>
              <g.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <Contador n={total} compacto />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel>{g.label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {g.items.map((i) => (
              <DropdownMenuItem key={i.to} onSelect={() => navigate(`/${portal}/${i.to}`)} className={cn(i.to.split("/")[0] === seccion && "font-semibold")}>
                <i.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                <span className="flex-1">{i.label}</span>
                <Contador n={valor(contadores, i.contador)} titulo={i.contadorTitulo} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <div key={g.grupo}>
        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbiertos((a) => (a.includes(g.grupo) ? a.filter((x) => x !== g.grupo) : [...a, g.grupo]))}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activo && !abierto
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : activo
                ? "text-sidebar-foreground hover:bg-sidebar-accent"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <g.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left">{g.label}</span>
          {!abierto && <Contador n={total} />}
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 opacity-60 transition-transform", !abierto && "-rotate-90")} aria-hidden="true" />
        </button>
        {abierto && (
          <div className="mt-0.5 space-y-0.5">
            {g.items.map((i) => (
              <Enlace key={i.to} item={i} c={contadores} compacto={false} sangria onNavegar={onNavegar} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const entrada = (e: PortalNavEntry) => (esGrupo(e) ? grupo(e) : <Enlace key={e.to} item={e} c={contadores} compacto={compacto} onNavegar={onNavegar} />);

  return (
    <nav aria-label="Menú principal" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2">
      <div className="space-y-1">{principales.map(entrada)}</div>
      {abajo.length > 0 && <div className="mt-auto space-y-1 border-t border-sidebar-border pt-2">{abajo.map(entrada)}</div>}
    </nav>
  );
}
