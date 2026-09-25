import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { PaginationBar } from "@/components/shared/PaginationBar";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useDebounced } from "@/hooks/useDebounced";
import { useApiData } from "@/hooks/useApiData";
import { fetchCategoriasContratos, fetchContratosPagina, fetchContratosVigentes } from "@/lib/api/contratos";
import type { EstadoContratoApi } from "@/lib/api/seguimiento";
import { Calendar, ChevronRight, FileCheck, FileUp } from "lucide-react";
import { formatMoney } from "@/lib/moneda";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { Incrustado } from "@/components/layout/Incrustado";
import { Seguimiento } from "@/pages/cliente/Seguimiento";

const ESTADOS: { valor: "" | EstadoContratoApi; label: string }[] = [
  { valor: "", label: "Todos los estados" },
  { valor: "ACTIVO", label: "Activos" },
  { valor: "POR_VENCER", label: "Por vencer" },
  { valor: "VENCIDO", label: "Vencidos" },
  { valor: "TERMINADO", label: "Terminados" },
];

/**
 * Everything signed, and its deliveries. Delivery follow-up used to be its own
 * menu entry; it is the "Entregas" view of the same contracts.
 */
export function Contratos() {
  const [params, setParams] = useSearchParams();
  const { currentUser } = useAuth();
  const puedeEntregas = currentUser?.role === "comprador" || currentUser?.role === "admin_cliente";
  const vista = puedeEntregas && params.get("vista") === "entregas" ? "entregas" : "contratos";

  function cambiar(v: "contratos" | "entregas") {
    setParams(v === "entregas" ? { vista: "entregas" } : {}, { replace: true });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Contratos / Órdenes de Compra</h1>
        <p className="text-sm text-muted-foreground">
          {vista === "entregas"
            ? "Entregas de cada contrato: los hitos se marcan solos en riesgo 3 días antes y atrasados al pasar su fecha. Recibir un hito con % libera su pago."
            : "Todo lo firmado, con sus entregas, pagos, modificaciones y versiones del documento. Abre un contrato para ver su ficha."}
        </p>
      </div>
      {puedeEntregas && (
        <nav className="flex gap-1 border-b border-border" aria-label="Vista de contratos">
          {([["contratos", "Contratos"], ["entregas", "Entregas"]] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-current={vista === v ? "page" : undefined}
              onClick={() => cambiar(v)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                vista === v ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {vista === "entregas" ? (
        <Incrustado>
          <Seguimiento />
        </Incrustado>
      ) : (
        <ListaContratos />
      )}
    </div>
  );
}

function ListaContratos() {
  const navigate = useNavigate();
  const { data: vigentes } = useApiData(fetchContratosVigentes);
  const { data: categoriasApi } = useApiData(fetchCategoriasContratos);
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [estado, setEstado] = useState<"" | EstadoContratoApi>("");
  const [page, setPage] = useState(1);
  const q = useDebounced(query.trim());
  useEffect(() => setPage(1), [q, categoria, estado]);
  const { data: pagina, loading } = useApiData(
    () => fetchContratosPagina({ page, q: q || undefined, categoria, estado: estado || undefined }),
    [page, q, categoria, estado],
  );
  const categorias = ["Todas", ...(categoriasApi ?? [])];
  const filas = pagina?.items ?? [];

  const hoyMs = Date.now();
  const diasHastaVencer = (fecha: string) => Math.ceil((new Date(`${fecha}T23:59:59`).getTime() - hoyMs) / 86_400_000);
  const proximosAVencer = [60, 30, 15].map((umbral) => ({
    dias: umbral,
    contratos: (vigentes ?? []).filter((c) => {
      const restantes = diasHastaVencer(c.vigenciaFin);
      return restantes >= 0 && restantes <= umbral;
    }),
  }));

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap gap-3">
        <SearchInput placeholder="Buscar por código, proveedor o categoría..." value={query} onChange={setQuery} />
        <select aria-label="Categoría" className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => <option key={c} value={c}>{c === "Todas" ? "Todas las categorías" : c}</option>)}
        </select>
        <select aria-label="Estado" className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={estado} onChange={(e) => setEstado(e.target.value as "" | EstadoContratoApi)}>
          {ESTADOS.map((e) => <option key={e.valor} value={e.valor}>{e.label}</option>)}
        </select>
      </div>

      {loading && !pagina ? <TableSkeleton /> : (
        <Card className="overflow-hidden">
          {filas.length === 0 ? (
            <EmptyState icon={FileCheck} title="No se encontraron contratos" description="Ajusta la búsqueda o los filtros." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                    <th className="p-4 font-medium">Documento</th>
                    <th className="p-4 font-medium">Proveedor</th>
                    <th className="p-4 font-medium">Categoría</th>
                    <th className="p-4 text-right font-medium">Valor</th>
                    <th className="p-4 font-medium">Vigencia</th>
                    <th className="p-4 font-medium">Estado</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                      onClick={() => navigate(`/cliente/contratos/${c.id}`)}
                    >
                      <td className="p-4">
                        <Link to={`/cliente/contratos/${c.id}`} className="text-sm font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{c.codigo}</Link>
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          {c.esMarco ? "Contrato Marco" : c.padreCodigo ? `PO bajo ${c.padreCodigo}` : c.tipo === "PO" ? "Orden de compra" : c.tipo}
                          {c.archivoNombre && (
                            <span className="flex items-center gap-0.5 text-info" title={c.archivoNombre}>
                              <FileUp className="h-3 w-3" aria-hidden="true" /> Documento firmado
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="p-4 text-sm">{c.proveedor}</td>
                      <td className="p-4 text-sm text-muted-foreground">{c.categoria}</td>
                      <td className="p-4 text-right text-sm font-medium tabular-nums">
                        {formatMoney(c.monto, c.moneda)}
                        {c.esMarco && c.saldoMarco != null && (
                          <span className="block text-xs font-normal text-muted-foreground">saldo {formatMoney(c.saldoMarco, c.moneda)}</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {c.vigenciaInicio} — {c.vigenciaFin}
                        </div>
                      </td>
                      <td className="p-4"><StatusBadge estado={c.estado} /></td>
                      <td className="p-4 text-right"><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden="true" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagina && <PaginationBar page={pagina.page} totalPages={pagina.totalPages} total={pagina.total} onPage={setPage} label="contratos" />}
        </Card>
      )}

      <Card className="p-5">
        <h2 className="mb-1 font-semibold">Próximos vencimientos</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Un proceso diario avisa a compradores y administradores a 60, 30 y 15 días del fin de cada contrato vigente. Desde la ficha puedes prorrogarlo.
        </p>
        <div className="flex flex-wrap gap-3">
          {proximosAVencer.map(({ dias, contratos: c }) => (
            <span
              key={dias}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${c.length > 0 ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {dias} días · {c.length === 0 ? "sin pendientes" : `${c.length} contrato${c.length === 1 ? "" : "s"}`}
            </span>
          ))}
        </div>
        {proximosAVencer[1].contratos.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {proximosAVencer[1].contratos.map((c) => (
              <li key={c.id}>
                <Link to={`/cliente/contratos/${c.id}`} className="font-medium text-primary hover:underline">{c.codigo}</Link>
                <span className="text-muted-foreground"> ({c.proveedor}) vence en {diasHastaVencer(c.vigenciaFin)} días — {c.vigenciaFin}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Trazabilidad — registro de auditoría</h2>
        <AuditLogTable limit={5} showPagination={false} />
      </div>
    </div>
  );
}
