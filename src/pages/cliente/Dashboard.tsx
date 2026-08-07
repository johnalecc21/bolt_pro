import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Plus, DollarSign, FileText, ShieldCheck, Building2, TrendingUp, ArrowRight, AlertTriangle } from "lucide-react";
import { actividadReciente, ahorroMensual } from "@/lib/mockData";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAuth } from "@/lib/auth/AuthContext";
import { KpiRowSkeleton, TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { fetchRequerimientos } from "@/lib/api/requerimientos";
import { fetchAprobaciones } from "@/lib/api/aprobaciones";
import { fetchProveedores } from "@/lib/api/proveedores";

const chartConfig = {
  auditado: { label: "Auditado", color: "var(--chart-1)" },
  reportado: { label: "Reportado", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function Dashboard() {
  const { currentUser, activeCompany } = useAuth();
  const esAprobador = currentUser?.role === "aprobador_cfo";
  const { data: requerimientos, loading: loadingReq } = useApiData(fetchRequerimientos);
  const { data: aprobaciones } = useApiData(
    () => (esAprobador ? fetchAprobaciones() : Promise.resolve([])),
    [esAprobador],
  );
  const { data: proveedores } = useApiData(fetchProveedores);
  const loading = loadingReq;
  const misRequerimientos = currentUser?.role === "comprador"
    ? (requerimientos ?? []).filter((r) => r.solicitante === currentUser.nombre)
    : (requerimientos ?? []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Buenos días, {currentUser?.nombre?.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{activeCompany?.nombre} · Lunes, 5 de agosto de 2024</p>
        </div>
        {currentUser?.role !== "aprobador_cfo" && (
          <Link to="/cliente/requerimientos/nuevo">
            <Button className="gradient-brand text-white">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Requerimiento
            </Button>
          </Link>
        )}
      </div>

      {esAprobador && (aprobaciones ?? []).length > 0 && (
        <Card className="border-warning/30 bg-warning/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-warning-foreground" /> Requiere tu aprobación</h2>
            <Link to="/cliente/aprobaciones" className="text-sm text-primary hover:underline">Ver bandeja completa</Link>
          </div>
          <div className="space-y-2">
            {(aprobaciones ?? []).slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
                <div>
                  <p className="font-medium">{a.descripcion}</p>
                  <p className="text-xs text-muted-foreground">{a.tipo} · Solicitado por {a.solicitante}</p>
                </div>
                <span className="font-semibold">${a.monto.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* KPIs */}
      {loading ? <KpiRowSkeleton /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard label="Ahorro acumulado del mes" value="$127,500" icon={DollarSign} trend="+18%" trendUp accent="success" />
          <KPICard label="Procesos activos" value="8" icon={FileText} accent="brand" subtitle="3 en licitación" />
          <KPICard label="Aprobaciones pendientes" value="3" icon={ShieldCheck} accent="warning" subtitle="2 urgentes" />
          <KPICard label="Proveedores activos" value="47" icon={Building2} trend="+5" trendUp accent="info" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Requerimientos */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Mis requerimientos</h2>
              <Link to="/cliente/requerimientos" className="text-sm text-primary hover:underline">Ver todos</Link>
            </div>
            {loading ? <TableSkeleton rows={4} /> : <div className="space-y-2">
              {misRequerimientos.slice(0, 6).map((req) => (
                <Link
                  key={req.id}
                  to={`/cliente/requerimientos/${req.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{req.id}</span>
                      <StatusBadge estado={req.estado} />
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{req.titulo}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{req.categoria}</span>
                      <span>•</span>
                      <span>${(req.montoEstimado / 1000).toFixed(0)}K</span>
                      <span>•</span>
                      <span>Vence {req.fechaLimite}</span>
                    </div>
                  </div>
                  <div className="ml-4 w-24 shrink-0">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full gradient-brand" style={{ width: `${req.progreso}%` }} />
                    </div>
                    <p className="mt-1 text-right text-xs text-muted-foreground">{req.progreso}%</p>
                  </div>
                  <ArrowRight className="ml-3 h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>}
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Actividad reciente</h2>
            <div className="space-y-3">
              {actividadReciente.map((act) => (
                <div key={act.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm">{act.texto}</p>
                    <p className="text-xs text-muted-foreground">{act.tiempo}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Proveedores destacados</h2>
            <div className="space-y-3">
              {(proveedores ?? []).slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white text-xs font-bold" style={{ background: p.color }}>
                    {p.iniciales}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">{p.ubicacion}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{p.score}★</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Ahorro mensual</h2>
            <p className="text-sm text-muted-foreground">Reportado vs. auditado (últimos 6 meses)</p>
          </div>
          <TrendingUp className="h-5 w-5 text-success" />
        </div>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={ahorroMensual}>
            <defs>
              <linearGradient id="fillAuditado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-auditado)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-auditado)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillReportado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-reportado)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-reportado)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="reportado" type="monotone" stroke="var(--color-reportado)" fill="url(#fillReportado)" strokeWidth={2} />
            <Area dataKey="auditado" type="monotone" stroke="var(--color-auditado)" fill="url(#fillAuditado)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </Card>
    </div>
  );
}
