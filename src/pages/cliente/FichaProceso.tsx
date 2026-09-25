import { Link, Navigate, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Incrustado } from "@/components/layout/Incrustado";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApiData } from "@/hooks/useApiData";
import { cn } from "@/lib/utils";
import { fetchRequerimiento } from "@/lib/api/requerimientos";
import type { EstadoReq } from "@/lib/types";

export type EtapaProceso = "seguimiento" | "comparativo" | "negociacion" | "adjudicacion";

const ADJUDICADO: EstadoReq[] = ["adjudicado", "en_cumplimiento", "cerrado"];

/** The tab a process opens on, by its stage. */
export function etapaInicial(estado: EstadoReq): EtapaProceso {
  if (estado === "en_negociacion") return "negociacion";
  if (ADJUDICADO.includes(estado)) return "adjudicacion";
  return "seguimiento";
}

/**
 * One page for the whole purchase process once approved: live tender,
 * comparison, negotiation and award, as tabs of the same process.
 */
export function FichaProceso() {
  const { id = "" } = useParams();
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  // Refetch when the tab changes: awarding or starting a round moves the stage.
  const { data: r, loading, error } = useApiData(() => fetchRequerimiento(id), [id, pathname]);
  const actual = pathname.split("/")[4] as EtapaProceso | undefined;

  if (!r) {
    if (loading) return <div className="p-6 text-sm text-muted-foreground">Cargando proceso…</div>;
    return (
      <div className="p-6">
        <EmptyState icon={FileText} title="Proceso no encontrado" description={error ?? "Verifica el enlace o vuelve a la lista de procesos."} />
      </div>
    );
  }
  if (!actual) return <Navigate to={`/cliente/procesos/${id}/${etapaInicial(r.estado)}`} replace />;

  const cfo = currentUser?.role === "aprobador_cfo";
  const pestanas: { etapa: EtapaProceso; label: string; visible: boolean }[] = [
    { etapa: "seguimiento", label: "Seguimiento", visible: true },
    { etapa: "comparativo", label: "Comparativo", visible: true },
    { etapa: "negociacion", label: "Negociación", visible: !cfo && (["en_licitacion", "en_negociacion"].includes(r.estado) || actual === "negociacion") },
    { etapa: "adjudicacion", label: "Adjudicación", visible: ADJUDICADO.includes(r.estado) || actual === "adjudicacion" },
  ];

  return (
    <div className="space-y-5 p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/cliente/procesos"><ArrowLeft className="h-4 w-4" /> Procesos de compra</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{r.codigo}</h1>
            <StatusBadge estado={r.estado} />
          </div>
          <p className="text-sm text-muted-foreground">{r.titulo} · {r.categoria}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to={`/cliente/requerimientos/${id}`}><FileText className="h-4 w-4" /> Ver requerimiento</Link>
        </Button>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Etapas del proceso">
        {pestanas.filter((p) => p.visible).map((p) => (
          <NavLink
            key={p.etapa}
            to={`/cliente/procesos/${id}/${p.etapa}`}
            className={({ isActive }) =>
              cn(
                "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )
            }
          >
            {p.label}
          </NavLink>
        ))}
      </nav>

      <Incrustado>
        <Outlet />
      </Incrustado>
    </div>
  );
}

/** Old links (/cliente/licitaciones/:id, /negociacion/:id…) land on the right tab. */
export function RedirigirProceso({ etapa }: { etapa?: EtapaProceso }) {
  const { id } = useParams();
  if (!id) return <Navigate to="/cliente/procesos" replace />;
  return <Navigate to={`/cliente/procesos/${id}${etapa ? `/${etapa}` : ""}`} replace />;
}
