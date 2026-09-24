import { Link } from "react-router-dom";
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Insight, NivelInsight } from "@/lib/analitica/insights";
import { cn } from "@/lib/utils";

const ESTILO: Record<NivelInsight, { icon: typeof Info; etiqueta: string; clase: string }> = {
  critico: { icon: AlertOctagon, etiqueta: "Crítico", clase: "text-destructive" },
  atencion: { icon: AlertTriangle, etiqueta: "Atención", clase: "text-warning-foreground" },
  positivo: { icon: CheckCircle2, etiqueta: "Positivo", clase: "text-success" },
  info: { icon: Info, etiqueta: "Información", clase: "text-info" },
};

/** Findings: status is always icon + label, never color alone. */
export function Hallazgos({ insights }: { insights: Insight[] }) {
  return (
    <Card className="gap-3 p-5">
      <div>
        <h3 className="font-semibold">Hallazgos</h3>
        <p className="text-sm text-muted-foreground">Calculados con los datos y filtros actuales.</p>
      </div>
      {insights.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">Nada que destacar con los filtros actuales.</p>
      ) : (
        <ul className="divide-y divide-border">
          {insights.map((ins) => {
            const e = ESTILO[ins.nivel];
            return (
              <li key={ins.titulo} className="flex gap-3 py-3">
                <e.icon className={cn("mt-0.5 h-4 w-4 shrink-0", e.clase)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    <span className={cn("mr-2 text-xs font-semibold uppercase tracking-wide", e.clase)}>{e.etiqueta}</span>
                    {ins.titulo}
                  </p>
                  <p className="text-sm text-muted-foreground">{ins.detalle}</p>
                  {ins.enlace && (
                    <Link to={ins.enlace.to} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      {ins.enlace.texto} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
