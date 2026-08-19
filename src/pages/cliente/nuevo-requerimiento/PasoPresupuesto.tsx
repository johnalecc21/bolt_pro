import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasoPresupuestoProps {
  presupuesto: string;
  onPresupuestoChange: (value: string) => void;
  fechaLimite: string;
  onFechaLimiteChange: (value: string) => void;
}

export function PasoPresupuesto({ presupuesto, onPresupuestoChange, fechaLimite, onFechaLimiteChange }: PasoPresupuestoProps) {
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
          <Input type="number" placeholder="185000" value={presupuesto} onChange={(e) => onPresupuestoChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Fecha requerida</Label>
          <Input type="date" value={fechaLimite} onChange={(e) => onFechaLimiteChange(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
