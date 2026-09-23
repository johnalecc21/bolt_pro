import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiErrorMessage } from "@/lib/api/http";
import { guardarUnidad, type TipoUnidad, type UnidadNegocio } from "@/lib/api/estructura";

export function UnidadDialog({
  open,
  unidad,
  onClose,
  onSaved,
}: {
  open: boolean;
  unidad: UnidadNegocio | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoUnidad>("SEDE");
  const [ciudad, setCiudad] = useState("");
  const [activa, setActiva] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCodigo(unidad?.codigo ?? "");
    setNombre(unidad?.nombre ?? "");
    setTipo(unidad?.tipo ?? "SEDE");
    setCiudad(unidad?.ciudad ?? "");
    setActiva(unidad?.activa ?? true);
  }, [open, unidad]);

  async function guardar() {
    setGuardando(true);
    try {
      await guardarUnidad(unidad?.id ?? null, { codigo, nombre, tipo, ciudad, activa });
      toast.success(unidad ? "Actualizada" : "Creada");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{unidad ? "Editar sede o unidad" : "Nueva sede o unidad de negocio"}</DialogTitle>
          <DialogDescription>Agrupa tus centros de costo por sede física o por línea de negocio.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="un-codigo">Código</Label>
              <Input id="un-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="BOG" maxLength={20} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="un-nombre">Nombre</Label>
              <Input id="un-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Planta Bogotá" maxLength={80} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="un-tipo">Tipo</Label>
              <NativeSelect id="un-tipo" className="w-full" value={tipo} onChange={(e) => setTipo(e.target.value as TipoUnidad)}>
                <NativeSelectOption value="SEDE">Sede</NativeSelectOption>
                <NativeSelectOption value="UNIDAD_NEGOCIO">Unidad de negocio</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="un-ciudad">Ciudad</Label>
              <Input id="un-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Bogotá" maxLength={80} />
            </div>
          </div>
          {unidad && (
            <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span className="font-medium">Activa</span>
              <Switch checked={activa} onCheckedChange={setActiva} />
            </label>
          )}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando || codigo.trim().length < 1 || nombre.trim().length < 2}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
