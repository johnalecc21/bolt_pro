import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { MONEDAS, type Moneda } from "@/lib/moneda";

interface PasoPresupuestoProps {
  presupuesto: string;
  onPresupuestoChange: (value: string) => void;
  moneda: Moneda;
  onMonedaChange: (value: Moneda) => void;
  fechaLimite: string;
  onFechaLimiteChange: (value: string) => void;
}

export function PasoPresupuesto({ presupuesto, onPresupuestoChange, moneda, onMonedaChange, fechaLimite, onFechaLimiteChange }: PasoPresupuestoProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Cantidad y presupuesto</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cantidad</Label>
          <Input type="number" placeholder="1" />
        </div>
        <div className="space-y-2">
          <Label>Unidad</Label>
          <Input placeholder="servicio / mes" />
        </div>
        <div className="space-y-2">
          <Label>Presupuesto estimado</Label>
          <div className="flex gap-2">
            <Input type="number" placeholder="185000" value={presupuesto} onChange={(e) => onPresupuestoChange(e.target.value)} />
            <div className="w-28 shrink-0">
              <NativeSelect aria-label="Moneda" className="w-full" value={moneda} onChange={(e) => onMonedaChange(e.target.value as Moneda)}>
                {MONEDAS.map((m) => <NativeSelectOption key={m.value} value={m.value}>{m.value}</NativeSelectOption>)}
              </NativeSelect>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Fecha requerida</Label>
          <Input type="date" value={fechaLimite} onChange={(e) => onFechaLimiteChange(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
