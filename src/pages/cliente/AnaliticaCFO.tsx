import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { ahorroMensual, tiempoCicloCategoria, concentracionGasto, topProveedoresGasto } from "@/lib/mockData";
import { Download, TrendingUp, Clock, PieChart as PieIcon, Building2, ArrowRight } from "lucide-react";

const ahorroConfig = {
  auditado: { label: "Auditado", color: "var(--chart-1)" },
  reportado: { label: "Reportado", color: "var(--chart-3)" },
} satisfies ChartConfig;

const cicloConfig = { dias: { label: "Días promedio", color: "var(--chart-2)" } } satisfies ChartConfig;
const gastoConfig = { gasto: { label: "Gasto", color: "var(--chart-1)" } } satisfies ChartConfig;

export function AnaliticaCFO() {
  const [periodo, setPeriodo] = useState("6m");

  const totalAuditado = ahorroMensual.reduce((s, m) => s + m.auditado, 0);
  const totalReportado = ahorroMensual.reduce((s, m) => s + m.reportado, 0);
  const brecha = Math.round(((totalReportado - totalAuditado) / totalReportado) * 100);

  function exportar() {
    const rows = [["Mes", "Reportado", "Auditado"], ...ahorroMensual.map((m) => [m.mes, m.reportado, m.auditado])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analitica-cfo.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Reporte exportado");
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Ejecutivo / Analítica CFO</h1>
          <p className="text-sm text-muted-foreground">Visibilidad financiera y de desempeño a nivel gerencial</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="3m">Últimos 3 meses</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="12m">Últimos 12 meses</option>
          </select>
          <Button variant="outline" className="gap-2" onClick={exportar}><Download className="h-4 w-4" /> Exportar reporte</Button>
        </div>
      </div>

      <div className="rounded-lg border border-info/30 bg-info/10 p-4 text-sm text-info">
        <strong>Ahorro reportado (${(totalReportado / 1000).toFixed(0)}K)</strong> vs. <strong>ahorro auditado (${(totalAuditado / 1000).toFixed(0)}K)</strong> — el auditado es {brecha}% menor y es la cifra certificada por el equipo de consultoría.
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold"><TrendingUp className="h-4 w-4 text-success" /> Ahorro acumulado</h2>
            <p className="text-sm text-muted-foreground">Reportado vs. auditado</p>
          </div>
        </div>
        <ChartContainer config={ahorroConfig} className="h-[260px] w-full">
          <AreaChart data={ahorroMensual}>
            <defs>
              <linearGradient id="fillAuditado2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-auditado)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-auditado)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillReportado2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-reportado)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-reportado)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="reportado" type="monotone" stroke="var(--color-reportado)" fill="url(#fillReportado2)" strokeWidth={2} />
            <Area dataKey="auditado" type="monotone" stroke="var(--color-auditado)" fill="url(#fillAuditado2)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-info" /> Ciclo de tiempo promedio por categoría</h2>
          <ChartContainer config={cicloConfig} className="h-[220px] w-full">
            <BarChart data={tiempoCicloCategoria}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="categoria" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}d`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="dias" fill="var(--color-dias)" radius={4} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><PieIcon className="h-4 w-4 text-warning-foreground" /> Concentración de gasto</h2>
          <div className="flex items-center gap-6">
            <ChartContainer config={{}} className="h-[200px] w-[200px]">
              <PieChart>
                <Pie data={concentracionGasto} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={2} isAnimationActive={false}>
                  {concentracionGasto.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="space-y-2">
              {concentracionGasto.map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1">{c.name}</span>
                  <span className="font-medium">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
          {concentracionGasto[0].value > 35 && (
            <p className="mt-3 text-xs text-warning-foreground">⚠ Alta concentración en {concentracionGasto[0].name} — riesgo de dependencia de pocos proveedores.</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-primary" /> Top proveedores por gasto</h2>
        <ChartContainer config={gastoConfig} className="h-[220px] w-full">
          <BarChart data={topProveedoresGasto} layout="vertical">
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey="proveedor" tickLine={false} axisLine={false} width={90} fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="gasto" fill="var(--color-gasto)" radius={4} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </Card>

      <div className="rounded-lg bg-muted/50 p-4 text-sm">
        <strong>Recomendación:</strong> La categoría "Marketing" no se ha licitado en 18 meses y el gasto creció 30% — candidata a re-sourcing.
        {" "}
        <Link to="/cliente/licitaciones/RFP-2024-0032/comparativo" className="inline-flex items-center gap-1 text-primary hover:underline">
          Ver comparativo relacionado <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
