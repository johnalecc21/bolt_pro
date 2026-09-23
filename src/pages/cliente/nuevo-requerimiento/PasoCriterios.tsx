import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Criterios {
  precio: number;
  tiempo: number;
  calidad: number;
  pago: number;
}

interface PasoCriteriosProps {
  criterios: Criterios;
  onCriteriosChange: (updater: (prev: Criterios) => Criterios) => void;
  total: number;
}

const LABELS: Record<keyof Criterios, string> = {
  precio: "Precio",
  tiempo: "Tiempo de entrega",
  calidad: "Calidad / Referencias",
  pago: "Condiciones de pago",
};

export function PasoCriterios({ criterios, onCriteriosChange, total }: PasoCriteriosProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Criterios de evaluación</h2>
      <p className="text-sm text-muted-foreground">Ajusta los pesos. Deben sumar 100%.</p>
      <div className="space-y-5">
        {(Object.keys(LABELS) as (keyof Criterios)[]).map((key) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{LABELS[key]}</Label>
              <span className={cn("text-sm font-bold", total === 100 ? "text-foreground" : "text-destructive")}>
                {criterios[key]}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={criterios[key]}
              onChange={(e) => onCriteriosChange((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
        ))}
      </div>
      <div className={cn("flex items-center justify-between rounded-lg p-3 text-sm", total === 100 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
        <span>Total</span>
        <span className="font-bold">{total}%</span>
      </div>
    </div>
  );
}
