import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { type EstadoReq } from "@/lib/mockData";
import { useAuth } from "@/lib/auth/AuthContext";
import { Search, Plus, FileText, ArrowRight } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { fetchRequerimientos } from "@/lib/api/requerimientos";

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
  const { currentUser } = useAuth();
  const { data: requerimientos, loading } = useApiData(fetchRequerimientos);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<EstadoReq | "todos">("todos");

  const base = currentUser?.role === "comprador"
    ? (requerimientos ?? []).filter((r) => r.solicitante === currentUser.nombre)
    : (requerimientos ?? []);

  const filtrados = base.filter((r) => {
    const matchQuery = `${r.codigo} ${r.titulo}`.toLowerCase().includes(query.toLowerCase());
    const matchEstado = estado === "todos" || r.estado === estado;
    return matchQuery && matchEstado;
  });

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
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por ID o título..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={estado} onChange={(e) => setEstado(e.target.value as EstadoReq | "todos")}>
          {estados.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>

      {loading ? <TableSkeleton /> : (
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
                    <span>${(r.montoEstimado / 1000).toFixed(0)}K</span>
                    <span>•</span>
                    <span>Vence {r.fechaLimite}</span>
                    <span>•</span>
                    <span>Solicitante: {r.solicitante}</span>
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
      </Card>
      )}
    </div>
  );
}
