import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { type Contrato } from "@/lib/mockData";
import { fetchContratos } from "@/lib/api/contratos";
import { Search, Download, FileCheck, Calendar } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

export function Contratos() {
  const { data: contratos, loading } = useApiData(() => fetchContratos());
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const categorias = ["Todas", ...Array.from(new Set((contratos ?? []).map((c) => c.categoria)))];

  const filtrados = (contratos ?? []).filter((c: Contrato) => {
    const matchQuery = `${c.id} ${c.proveedor}`.toLowerCase().includes(query.toLowerCase());
    const matchCat = categoria === "Todas" || c.categoria === categoria;
    return matchQuery && matchCat;
  });

  function descargar(c: Contrato) {
    toast.success("Descarga iniciada", { description: `${c.id}.pdf` });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Contratos / Órdenes de Compra</h1>
        <p className="text-sm text-muted-foreground">Archivo central y versionado de todo lo firmado</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por ID o proveedor..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <TableSkeleton /> : (
      <Card className="overflow-hidden">
        {filtrados.length === 0 ? (
          <EmptyState icon={FileCheck} title="No se encontraron documentos" description="Ajusta los filtros de búsqueda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Documento</th>
                  <th className="p-4 font-medium">Proveedor</th>
                  <th className="p-4 font-medium">Categoría</th>
                  <th className="p-4 font-medium">Monto</th>
                  <th className="p-4 font-medium">Vigencia</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-4">
                      <p className="text-sm font-medium">{c.id}</p>
                      <p className="text-xs text-muted-foreground">{c.tipo}</p>
                    </td>
                    <td className="p-4 text-sm">{c.proveedor}</td>
                    <td className="p-4 text-sm text-muted-foreground">{c.categoria}</td>
                    <td className="p-4 text-sm font-medium">${c.monto.toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {c.vigenciaInicio} — {c.vigenciaFin}
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge estado={c.estado} /></td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => descargar(c)}><Download className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      )}

      <Card className="p-5">
        <h2 className="mb-1 font-semibold">Recordatorios de vencimiento</h2>
        <p className="mb-3 text-sm text-muted-foreground">Se notifica automáticamente a los responsables en estos plazos antes del vencimiento.</p>
        <div className="flex gap-2">
          {["60 días", "30 días", "15 días"].map((d) => (
            <span key={d} className="rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">{d}</span>
          ))}
        </div>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Trazabilidad — registro de auditoría</h2>
        <AuditLogTable limit={5} />
      </div>

      <p className="text-xs text-muted-foreground">
        Cada documento enlaza con su requerimiento original. Por ejemplo: <Link to="/cliente/requerimientos/RFP-2024-0032" className="text-primary hover:underline">RFP-2024-0032</Link>.
      </p>
    </div>
  );
}
