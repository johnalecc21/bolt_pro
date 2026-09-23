import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiErrorMessage } from "@/lib/api/http";
import { fijarPresupuesto, type CentroCosto } from "@/lib/api/estructura";
import { MONEDAS, type Moneda } from "@/lib/moneda";
import { useMonedaBase } from "@/hooks/useMonedaBase";

export function PresupuestoDialog({
  centro,
  anio,
  onClose,
  onSaved,
}: {
  centro: CentroCosto | null;
  anio: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const monedaBase = useMonedaBase();
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<Moneda>(monedaBase);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!centro) return;
    setMonto(centro.presupuesto ? String(centro.presupuesto.monto) : "");
    setMoneda(centro.presupuesto?.moneda ?? monedaBase);
  }, [centro, monedaBase]);

  const valido = monto.trim() !== "" && Number.isInteger(Number(monto)) && Number(monto) >= 0;

  async function guardar() {
    if (!centro) return;
    setGuardando(true);
    try {
      await fijarPresupuesto(centro.id, anio, Number(monto), moneda);
      toast.success("Presupuesto guardado");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar el presupuesto."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={!!centro} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Presupuesto {anio}</DialogTitle>
          <DialogDescription>{centro?.codigo} — {centro?.nombre}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ppto-monto">Monto anual</Label>
            <div className="flex gap-2">
              <Input id="ppto-monto" type="number" min={0} step={1} value={monto} onChange={(e) => setMonto(e.target.value)} aria-invalid={monto !== "" && !valido} />
              <div className="w-28 shrink-0">
                <NativeSelect aria-label="Moneda" className="w-full" value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)}>
                  {MONEDAS.map((m) => <NativeSelectOption key={m.value} value={m.value}>{m.value}</NativeSelectOption>)}
                </NativeSelect>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Solo se controlan requerimientos y contratos en esta misma moneda.</p>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={guardar} disabled={!valido || guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
