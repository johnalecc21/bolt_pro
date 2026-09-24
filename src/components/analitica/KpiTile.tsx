import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { variacion } from "@/lib/analitica/agregador";
import { cn } from "@/lib/utils";

interface Props {
  titulo: string;
  valor: string;
  detalle?: string;
  actual: number | null;
  anterior: number | null;
  /** Whether an increase is good news (savings) or bad news (cycle time, spend). */
  subirEsBueno?: boolean;
  /** For "as of today" figures that have no previous period: shown instead of the delta. */
  nota?: string;
}

/** Stat tile: the number is the chart. The delta carries an arrow + words, never color alone. */
export function KpiTile({ titulo, valor, detalle, actual, anterior, subirEsBueno = true, nota }: Props) {
  const delta = variacion(actual, anterior);
  const bueno = delta == null || delta === 0 ? null : delta > 0 === subirEsBueno;
  const Icono = delta == null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="gap-1 p-4">
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <p className="text-2xl font-bold leading-tight">{valor}</p>
      {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
      {nota ? (
        <p className="mt-1 text-xs text-muted-foreground">{nota}</p>
      ) : (
      <p
        className={cn(
          "mt-1 flex items-center gap-1 text-xs",
          bueno === null ? "text-muted-foreground" : bueno ? "text-success" : "text-destructive",
        )}
      >
        <Icono className="h-3.5 w-3.5" aria-hidden />
        {delta == null
          ? "Sin base de comparación"
          : `${delta > 0 ? "+" : ""}${(delta * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })}% vs. período anterior`}
      </p>
      )}
    </Card>
  );
}
