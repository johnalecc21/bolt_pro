import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search, Gavel, ArrowRight } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { fetchRequerimientos } from "@/lib/api/requerimientos";

export function Licitaciones() {
  const { data: requerimientos, loading } = useApiData(fetchRequerimientos);
  const [query, setQuery] = useState("");

  const abiertas = (requerimientos ?? []).filter((r) => r.estado === "en_licitacion");
  const filtradas = abiertas.filter((r) => `${r.id} ${r.titulo}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Licitaciones</h1>
        <p className="text-sm text-muted-foreground">Procesos abiertos, recibiendo ofertas de proveedores</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por ID o título..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtradas.length === 0 ? (
        <EmptyState icon={Gavel} title="Sin licitaciones abiertas" description="Cuando un requerimiento pase a licitación, aparecerá aquí." />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {filtradas.map((r) => (
              <Link
                key={r.id}
                to={`/cliente/licitaciones/${r.id}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                    <StatusBadge estado={r.estado} />
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">{r.titulo}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{r.categoria}</span>
                    <span>•</span>
                    <span>${(r.montoEstimado / 1000).toFixed(0)}K</span>
                    <span>•</span>
                    <span>{r.proveedoresInvitados} invitados · {r.ofertasRecibidas} ofertas</span>
                    <span>•</span>
                    <span>Vence {r.fechaLimite}</span>
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
