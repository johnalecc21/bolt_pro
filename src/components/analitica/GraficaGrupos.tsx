import { useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Table2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { EmptyState } from "@/components/shared/EmptyState";
import { METRICAS, plegar, type Grupo, type Metrica } from "@/lib/analitica/agregador";
import { formatoValor } from "@/lib/analitica/formato";
import type { TipoGrafica } from "@/lib/api/analitica";
import type { Moneda } from "@/lib/moneda";

interface Props {
  titulo: string;
  descripcion?: string;
  grupos: Grupo[];
  metrica: Metrica;
  moneda: Moneda;
  tipo?: TipoGrafica;
  /** Label for the grouping column in the table view. */
  dimension: string;
  acciones?: ReactNode;
  alto?: number;
}

const SERIE = "var(--viz-1)";
const GRID = "var(--viz-grid)";
const EJE = { tickLine: false, axisLine: false, fontSize: 11 } as const;

function Tip({ active, payload, metrica, moneda }: { active?: boolean; payload?: { payload: Grupo }[]; metrica: Metrica; moneda: Moneda }) {
  if (!active || !payload?.length) return null;
  const g = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{g.etiqueta}</p>
      <p className="mt-0.5 flex items-center gap-2 text-muted-foreground">
        <span className="h-2 w-2 rounded-sm" style={{ background: SERIE }} />
        {METRICAS[metrica].etiqueta}: <span className="font-medium text-foreground tabular-nums">{formatoValor(metrica, g.valor, moneda)}</span>
      </p>
      <p className="mt-0.5 text-muted-foreground">{g.n} registro(s)</p>
    </div>
  );
}

/**
 * One metric broken down by one dimension. Single series → a single color
 * (slot 1). Every chart has a table twin (the accessible, exact view) and
 * folds anything past 8 bars into "Otros".
 */
export function GraficaGrupos({ titulo, descripcion, grupos, metrica, moneda, tipo = "barras", dimension, acciones, alto = 260 }: Props) {
  const [verTabla, setVerTabla] = useState(false);
  // Months/quarters are a continuous axis: never fold them into "Otros".
  const ejeTemporal = grupos.length > 0 && grupos.every((g) => /^\d{4}-(\d{2}|Q\d)$/.test(g.clave));
  const datos = ejeTemporal || tipo === "lineas" || tipo === "area" ? grupos : plegar(grupos, metrica);
  const vacio = grupos.every((g) => g.n === 0);
  const fmtEje = (v: number) => formatoValor(metrica, v, moneda, true);
  const tooltip = <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<Tip metrica={metrica} moneda={moneda} />} />;

  let grafica: ReactNode;
  if (tipo === "barrasHorizontales") {
    grafica = (
      <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 16 }} barCategoryGap={4}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" {...EJE} tickFormatter={fmtEje} />
        <YAxis type="category" dataKey="etiqueta" {...EJE} width={150} tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)} />
        <ReferenceLine x={0} stroke="var(--border)" />
        {tooltip}
        <Bar dataKey="valor" fill={SERIE} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
      </BarChart>
    );
  } else if (tipo === "lineas") {
    grafica = (
      <LineChart data={datos} margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="etiqueta" {...EJE} />
        <YAxis {...EJE} tickFormatter={fmtEje} width={72} />
        {tooltip}
        <Line dataKey="valor" stroke={SERIE} strokeWidth={2} dot={{ r: 4, fill: SERIE, stroke: "var(--card)", strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
      </LineChart>
    );
  } else if (tipo === "area") {
    grafica = (
      <AreaChart data={datos} margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="etiqueta" {...EJE} />
        <YAxis {...EJE} tickFormatter={fmtEje} width={72} />
        {tooltip}
        <Area dataKey="valor" stroke={SERIE} strokeWidth={2} fill={SERIE} fillOpacity={0.12} isAnimationActive={false} />
      </AreaChart>
    );
  } else {
    grafica = (
      <BarChart data={datos} margin={{ left: 8, right: 16, top: 8 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="etiqueta" {...EJE} interval={ejeTemporal ? "preserveStartEnd" : 0} tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)} />
        <YAxis {...EJE} tickFormatter={fmtEje} width={72} />
        <ReferenceLine y={0} stroke="var(--border)" />
        {tooltip}
        <Bar dataKey="valor" fill={SERIE} radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false} />
      </BarChart>
    );
  }

  const altoGrafica = tipo === "barrasHorizontales" ? Math.max(alto, datos.length * 30 + 40) : alto;

  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold">{titulo}</h3>
          {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
        </div>
        <div className="flex items-center gap-1">
          {acciones}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setVerTabla((v) => !v)}
            aria-pressed={verTabla}
            aria-label={verTabla ? "Ver como gráfica" : "Ver como tabla"}
          >
            {verTabla ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{verTabla ? "Gráfica" : "Tabla"}</span>
          </Button>
        </div>
      </div>
      {vacio ? (
        <EmptyState icon={BarChart3} title="Sin datos en este período" description="Amplía el período o quita filtros." />
      ) : verTabla ? (
        <div className="max-h-[360px] overflow-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{dimension}</th>
                <th className="px-3 py-2 text-right font-medium">{METRICAS[metrica].etiqueta}</th>
                <th className="px-3 py-2 text-right font-medium">Registros</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <tr key={g.clave} className="border-t border-border">
                  <td className="px-3 py-1.5">{g.etiqueta}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatoValor(metrica, g.valor, moneda)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{g.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ChartContainer config={{ valor: { label: METRICAS[metrica].etiqueta, color: SERIE } }} className="aspect-auto w-full" style={{ height: altoGrafica }}>
          {grafica as never}
        </ChartContainer>
      )}
    </Card>
  );
}
