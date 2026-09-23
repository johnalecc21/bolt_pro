import { Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useApiData } from "@/hooks/useApiData";
import { fetchUsoPlan } from "@/lib/api/empresa";
import { cn } from "@/lib/utils";

function Medidor({ label, usado, limite, unidad }: { label: string; usado: number; limite: number | null; unidad?: string }) {
  const pct = limite ? Math.min(100, (usado / limite) * 100) : 0;
  const alto = limite !== null && pct >= 85;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className={cn("font-medium", alto && "text-warning-foreground")}>
          {usado.toLocaleString("es-CO")}{unidad} {limite === null ? "· ilimitado" : `de ${limite.toLocaleString("es-CO")}${unidad ?? ""}`}
        </span>
      </div>
      {limite !== null && (
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
          <div className={cn("h-full rounded-full", alto ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

/** Current plan and how much of it this company is using this month. */
export function PlanUsoCard() {
  const { data } = useApiData(fetchUsoPlan);
  if (!data) return null;
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold"><Gauge className="h-4 w-4" /> Plan y uso</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Plan {data.planNombre}</span>
      </div>
      <Medidor label="Usuarios activos" usado={data.uso.usuarios} limite={data.limites.usuarios} />
      <Medidor label="Requerimientos este mes" usado={data.uso.requerimientosMes} limite={data.limites.requerimientosMes} />
      <Medidor label="Almacenamiento" usado={data.uso.almacenamientoMb} limite={data.limites.almacenamientoMb} unidad=" MB" />
      <p className="text-xs text-muted-foreground">¿Necesitas más capacidad? Escríbenos para cambiar de plan.</p>
    </Card>
  );
}
