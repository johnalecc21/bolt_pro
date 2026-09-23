import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatMoney, MONEDAS, type Moneda } from "@/lib/moneda";
import type { CentroCosto } from "@/lib/api/estructura";

interface PasoPresupuestoProps {
  presupuesto: string;
  onPresupuestoChange: (value: string) => void;
  moneda: Moneda;
  onMonedaChange: (value: Moneda) => void;
  centroCostoId: string;
  onCentroCostoChange: (value: string) => void;
  centrosCosto: CentroCosto[];
  exigeCentroCosto: boolean;
  fechaLimite: string;
  onFechaLimiteChange: (value: string) => void;
}

export function PasoPresupuesto({
  presupuesto,
  onPresupuestoChange,
  moneda,
  onMonedaChange,
  centroCostoId,
  onCentroCostoChange,
  centrosCosto,
  exigeCentroCosto,
  fechaLimite,
  onFechaLimiteChange,
}: PasoPresupuestoProps) {
  const centro = centrosCosto.find((c) => c.id === centroCostoId);
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
        {centrosCosto.length > 0 && (
          <div className="col-span-2 space-y-2">
            <Label htmlFor="centro-costo">Centro de costo{exigeCentroCosto ? "" : " (opcional)"}</Label>
            <NativeSelect id="centro-costo" className="w-full" value={centroCostoId} onChange={(e) => onCentroCostoChange(e.target.value)}>
              <NativeSelectOption value="">{exigeCentroCosto ? "Selecciona un centro de costo" : "Sin centro de costo"}</NativeSelectOption>
              {centrosCosto.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.codigo} — {c.nombre}{c.unidadNegocio ? ` (${c.unidadNegocio.nombre})` : ""}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {centro?.presupuesto && (
              <p className="text-xs text-muted-foreground">
                Presupuesto {centro.presupuesto.anio}: {formatMoney(centro.presupuesto.monto, centro.presupuesto.moneda)}. Si el requerimiento supera lo disponible, se aprueba como excepción con el CFO.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
