import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Gavel, ArrowRight } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { cn } from "@/lib/utils";
import { fetchRequerimientos } from "@/lib/api/requerimientos";
import { formatMoneyCompact } from "@/lib/moneda";

/** Stages after approval: from the open tender to the closed process. */
const FILTROS = [
  { clave: "curso", label: "En curso", estados: ["en_licitacion", "en_negociacion", "adjudicado"] },
  { clave: "en_licitacion", label: "En licitación", estados: ["en_licitacion"] },
  { clave: "en_negociacion", label: "En negociación", estados: ["en_negociacion"] },
  { clave: "adjudicado", label: "Adjudicados", estados: ["adjudicado"] },
  { clave: "en_cumplimiento", label: "En cumplimiento", estados: ["en_cumplimiento"] },
  { clave: "cerrado", label: "Cerrados", estados: ["cerrado"] },
  { clave: "todos", label: "Todos", estados: ["en_licitacion", "en_negociacion", "adjudicado", "en_cumplimiento", "cerrado"] },
] as const;

/**
 * Every purchase process once it leaves approval. Each row opens one page
 * with the whole process: live tender, comparison, negotiation and award.
 * Requerimientos (drafting and approval) stay apart: another area writes them.
 */
export function ProcesosCompra() {
  const { data: requerimientos, loading } = useApiData(fetchRequerimientos);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const clave = FILTROS.some((f) => f.clave === params.get("etapa")) ? params.get("etapa")! : "curso";
  const filtro = FILTROS.find((f) => f.clave === clave)!;

  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTROS) c[f.clave] = (requerimientos ?? []).filter((r) => (f.estados as readonly string[]).includes(r.estado)).length;
    return c;
  }, [requerimientos]);

  const filtradas = (requerimientos ?? [])
    .filter((r) => (filtro.estados as readonly string[]).includes(r.estado))
    .filter((r) => `${r.codigo} ${r.titulo} ${r.categoria}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Procesos de compra</h1>
        <p className="text-sm text-muted-foreground">Cada requerimiento aprobado, de la licitación a la adjudicación. Ábrelo para ver todo el proceso en un solo lugar.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Etapa del proceso">
        {FILTROS.map((f) => (
          <button
            key={f.clave}
            type="button"
            role="tab"
            aria-selected={clave === f.clave}
            onClick={() => setParams(f.clave === "curso" ? {} : { etapa: f.clave }, { replace: true })}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium shadow-sm transition-colors",
              clave === f.clave ? "border-primary bg-primary text-primary-foreground" : "border-foreground/15 bg-card text-foreground hover:border-primary hover:text-primary",
            )}
          >
            {f.label}
            {!loading && <span className={cn("ml-1.5 rounded-full px-1.5 text-xs tabular-nums", clave === f.clave ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>{conteo[f.clave]}</span>}
          </button>
        ))}
      </div>

      <SearchInput placeholder="Buscar por código, título o categoría..." value={query} onChange={setQuery} className="max-w-md" />

      {loading ? (
        <TableSkeleton />
      ) : filtradas.length === 0 ? (
        <EmptyState icon={Gavel} title="Sin procesos en esta etapa" description="Cuando un requerimiento se apruebe y salga a licitación, aparecerá aquí." />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {filtradas.map((r) => (
              <Link key={r.id} to={`/cliente/procesos/${r.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{r.codigo}</span>
                    <StatusBadge estado={r.estado} />
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">{r.titulo}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{r.categoria}</span>
                    <span>•</span>
                    <span>{formatMoneyCompact(r.montoEstimado, r.moneda)}</span>
                    <span>•</span>
                    <span>{r.proveedoresInvitados} invitados · {r.ofertasRecibidas} ofertas</span>
                    {r.estado === "en_licitacion" && (<><span>•</span><span>Cierra {r.fechaLimite}</span></>)}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
