import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { ArrowLeft, Building2, CheckCircle2, Circle } from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { fechaLocal } from "@/lib/fecha";
import { formatMoney } from "@/lib/moneda";
import { cn } from "@/lib/utils";
import { fetchResumenEmpresa, FACTURACION_LABEL, PLAN_LABEL, type ResumenEmpresa } from "@/lib/api/interno";
import { haceCuanto } from "./EmpresasClientes";

const ROL: Record<string, string> = {
  ADMIN_CLIENTE: "Admin",
  COMPRADOR: "Comprador",
  APROBADOR_CFO: "Aprobador / CFO",
};

const ETAPAS: [string, string][] = [
  ["BORRADOR", "Borrador"],
  ["PENDIENTE_APROBACION", "En aprobación"],
  ["EN_LICITACION", "En licitación"],
  ["EN_NEGOCIACION", "En negociación"],
  ["ADJUDICADO", "Adjudicado"],
  ["EN_CUMPLIMIENTO", "En cumplimiento"],
  ["CERRADO", "Cerrado"],
];

const CONTRATOS: [string, string][] = [
  ["ACTIVO", "Activos"],
  ["POR_VENCER", "Por vencer"],
  ["VENCIDO", "Vencidos"],
  ["TERMINADO", "Terminados"],
];

const PAGOS: [string, string][] = [
  ["PENDIENTE", "Por pagar"],
  ["VENCIDO", "Vencidos"],
  ["PAGADO", "Pagados"],
];

const MES = (ym: string) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString("es-CO", { month: "short" });

function Medidor({ label, usado, limite, unidad = "" }: { label: string; usado: number; limite: number | null; unidad?: string }) {
  const pct = limite ? Math.min(100, Math.round((usado / limite) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {usado.toLocaleString("es-CO")}{unidad} {limite ? <span className="text-muted-foreground">de {limite.toLocaleString("es-CO")}{unidad}</span> : <span className="text-muted-foreground">· sin límite</span>}
        </span>
      </div>
      {limite ? (
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
          <div className={cn("h-full rounded-full", pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function Conteos({ titulo, filas, datos }: { titulo: string; filas: [string, string][]; datos: Partial<Record<string, number>> }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{titulo}</h3>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {filas.map(([k, label]) => (
          <div key={k} className="rounded-lg border border-border p-2.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-lg font-bold tabular-nums">{datos[k] ?? 0}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Actividad({ porMes }: { porMes: ResumenEmpresa["actividad"]["porMes"] }) {
  const max = Math.max(1, ...porMes.flatMap((m) => [m.procesos, m.contratos]));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Procesos creados</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-success" /> Contratos firmados</span>
      </div>
      <div className="grid h-40 grid-cols-6 items-end gap-3 border-b border-border">
        {porMes.map((m) => (
          <div key={m.mes} className="flex h-full items-end justify-center gap-1" title={`${MES(m.mes)}: ${m.procesos} procesos, ${m.contratos} contratos`}>
            <div className="w-1/3 rounded-t bg-primary" style={{ height: `${(m.procesos / max) * 100}%`, minHeight: m.procesos ? 4 : 0 }} />
            <div className="w-1/3 rounded-t bg-success" style={{ height: `${(m.contratos / max) * 100}%`, minHeight: m.contratos ? 4 : 0 }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-3 text-center text-xs text-muted-foreground">
        {porMes.map((m) => (
          <span key={m.mes} className="capitalize">{MES(m.mes)} <span className="tabular-nums">{m.procesos}/{m.contratos}</span></span>
        ))}
      </div>
    </div>
  );
}

/**
 * One client company as an account, read only: setup, plan usage, team and
 * aggregate activity. No process titles, offers, prices or suppliers.
 */
export function EmpresaDetalle() {
  const { id = "" } = useParams();
  const { data: r, loading, error } = useApiData(() => fetchResumenEmpresa(id), [id]);

  if (loading) return <div className="p-6"><CardGridSkeleton count={4} /></div>;
  if (error || !r) {
    return (
      <div className="p-6">
        <EmptyState icon={Building2} title="Empresa no encontrada" description={error ?? undefined} />
      </div>
    );
  }

  const { empresa, uso, actividad } = r;
  const obligatorios = r.configuracion.filter((c) => !c.opcional);
  const activos = r.usuarios.filter((u) => u.activo).length;
  const a12 = actividad.ultimos12Meses;

  return (
    <div className="space-y-6 p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link to="/interno/empresas"><ArrowLeft className="h-4 w-4" /> Empresas</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{empresa.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente desde {fechaLocal(empresa.creada)} · {empresa.pais} · moneda {empresa.monedaBase} · última actividad {haceCuanto(actividad.ultimaActividad).toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Plan {PLAN_LABEL[empresa.plan]}</Badge>
          <Badge variant="secondary" className={cn(empresa.facturacion === "AL_DIA" ? "bg-success/15 text-success" : empresa.facturacion === "VENCIDA" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning-foreground")}>
            Facturación: {FACTURACION_LABEL[empresa.facturacion]}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([
          ["Procesos (total)", actividad.procesosTotales.toLocaleString("es-CO")],
          ["Contratos · 12 meses", a12.contratos.toLocaleString("es-CO")],
          ["Contratado · 12 meses", formatMoney(a12.montoContratado, empresa.monedaBase)],
          ["Proveedores contratados", a12.proveedoresContratados.toLocaleString("es-CO")],
        ] as const).map(([label, v]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{v}</p>
          </Card>
        ))}
      </div>
      {a12.contratosEnOtraMoneda > 0 && (
        <p className="-mt-3 text-xs text-muted-foreground">{a12.contratosEnOtraMoneda} contrato(s) en otra moneda no se suman al monto contratado.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-semibold">Configuración</h2>
            <span className="text-xs text-muted-foreground">{obligatorios.filter((c) => c.hecho).length} de {obligatorios.length} pasos básicos</span>
          </div>
          <ul className="space-y-2">
            {r.configuracion.map((c) => (
              <li key={c.clave} className="flex items-center gap-2.5 text-sm">
                {c.hecho ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                <span className={cn(!c.hecho && "text-muted-foreground")}>{c.label}</span>
                {c.opcional && <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">Opcional</span>}
                {c.detalle && <span className="text-xs text-muted-foreground">· {c.detalle}</span>}
                <span className="sr-only">{c.hecho ? "hecho" : "pendiente"}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Uso del plan {uso.planNombre}</h2>
          <Medidor label="Usuarios activos" usado={uso.uso.usuarios} limite={uso.limites.usuarios} />
          <Medidor label="Requerimientos este mes" usado={uso.uso.requerimientosMes} limite={uso.limites.requerimientosMes} />
          <Medidor label="Almacenamiento" usado={uso.uso.almacenamientoMb} limite={uso.limites.almacenamientoMb} unidad=" MB" />
        </Card>
      </div>

      <Card className="space-y-5 p-5">
        <h2 className="font-semibold">Actividad de los últimos 6 meses</h2>
        <Actividad porMes={actividad.porMes} />
        <Conteos titulo="Procesos de compra por etapa" filas={ETAPAS} datos={actividad.procesosPorEstado} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Conteos titulo="Contratos" filas={CONTRATOS} datos={actividad.contratosPorEstado} />
          <Conteos titulo="Pagos a proveedores" filas={PAGOS} datos={actividad.pagosPorEstado} />
        </div>
        <p className="text-xs text-muted-foreground">Solo cifras agregadas. El contenido de cada proceso (títulos, ofertas, precios y proveedores elegidos) es de la empresa y no se muestra.</p>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-baseline justify-between gap-2 p-5 pb-3">
          <h2 className="font-semibold">Equipo</h2>
          <span className="text-xs text-muted-foreground">{activos} activo(s) de {r.usuarios.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Nombre</th>
                <th className="px-5 py-2.5 font-medium">Correo</th>
                <th className="px-5 py-2.5 font-medium">Rol</th>
                <th className="px-5 py-2.5 font-medium">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {r.usuarios.map((u) => (
                <tr key={u.email} className={cn("border-b border-border last:border-0", !u.activo && "text-muted-foreground")}>
                  <td className="px-5 py-2.5 font-medium">{u.nombre}{!u.activo && <span className="ml-2 text-xs font-normal">(inactivo)</span>}</td>
                  <td className="px-5 py-2.5">{u.email}</td>
                  <td className="px-5 py-2.5">{ROL[u.rol] ?? u.rol}</td>
                  <td className="px-5 py-2.5">{haceCuanto(u.ultimoAcceso)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
