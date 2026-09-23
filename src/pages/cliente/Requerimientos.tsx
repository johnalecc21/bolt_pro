import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { type EstadoReq } from "@/lib/types";
import { Plus, FileText, ArrowRight } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { fetchRequerimientosPagina } from "@/lib/api/requerimientos";
import { fetchEstructura } from "@/lib/api/estructura";
import { PaginationBar } from "@/components/shared/PaginationBar";
import { useDebounced } from "@/hooks/useDebounced";

import { formatMoneyCompact } from "@/lib/moneda";
const estados: { value: EstadoReq | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "borrador", label: "Borrador" },
  { value: "pendiente_aprobacion", label: "Pendiente" },
  { value: "en_licitacion", label: "En Licitación" },
  { value: "en_negociacion", label: "En Negociación" },
  { value: "adjudicado", label: "Adjudicado" },
  { value: "en_cumplimiento", label: "En Cumplimiento" },
  { value: "cerrado", label: "Cerrado" },
];

export function Requerimientos() {
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<EstadoReq | "todos">("todos");
  const [centroCostoId, setCentroCostoId] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(query.trim());

  // A new filter starts from the first page again.
  useEffect(() => setPage(1), [q, estado, centroCostoId]);

  // Compradores only get their own requerimientos — the API scopes that by role.
  const { data, loading } = useApiData(
    () => fetchRequerimientosPagina({ page, q: q || undefined, estado: estado === "todos" ? undefined : estado, centroCostoId: centroCostoId || undefined }),
    [page, q, estado, centroCostoId],
  );
  const { data: estructura } = useApiData(() => fetchEstructura());
  const centros = (estructura?.centros ?? []).filter((c) => c.activo);
  const filtrados = data?.items ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requerimientos</h1>
          <p className="text-sm text-muted-foreground">Todos tus procesos de compra, en cualquier etapa</p>
        </div>
        <Link to="/cliente/requerimientos/nuevo">
          <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Requerimiento</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput placeholder="Buscar por código (REQ-0012), título o categoría..." value={query} onChange={setQuery} />
        <select className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={estado} onChange={(e) => setEstado(e.target.value as EstadoReq | "todos")}>
          {estados.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        {centros.length > 0 && (
          <select aria-label="Centro de costo" className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={centroCostoId} onChange={(e) => setCentroCostoId(e.target.value)}>
            <option value="">Todos los centros de costo</option>
            {centros.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
          </select>
        )}
      </div>

      {loading && !data ? <TableSkeleton /> : (
      <Card className="overflow-hidden">
        {filtrados.length === 0 ? (
          <EmptyState icon={FileText} title="No se encontraron requerimientos" description="Ajusta los filtros o crea un nuevo requerimiento." actionLabel="Nuevo requerimiento" onAction={() => window.location.assign("/cliente/requerimientos/nuevo")} />
        ) : (
          <div className="divide-y divide-border">
            {filtrados.map((r) => (
              <Link
                key={r.id}
                to={`/cliente/requerimientos/${r.id}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{r.codigo}</span>
                    <StatusBadge estado={r.estado} />
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">{r.titulo}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{r.categoria}</span>
                    <span>•</span>
                    <span>{formatMoneyCompact(r.montoEstimado, r.moneda)}</span>
                    <span>•</span>
                    <span>Vence {r.fechaLimite}</span>
                    <span>•</span>
                    <span>Solicitante: {r.solicitante}</span>
                    {r.centroCosto && (
                      <>
                        <span>•</span>
                        <span>{r.centroCosto}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="hidden w-32 shrink-0 sm:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full gradient-brand" style={{ width: `${r.progreso}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs text-muted-foreground">{r.progreso}%</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
        {data && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} label="requerimientos" />}
      </Card>
      )}
    </div>
  );
}
