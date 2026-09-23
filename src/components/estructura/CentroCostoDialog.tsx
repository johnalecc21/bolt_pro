import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiErrorMessage } from "@/lib/api/http";
import { guardarCentro, type CentroCosto, type UnidadNegocio } from "@/lib/api/estructura";

export function CentroCostoDialog({
  open,
  centro,
  unidades,
  onClose,
  onSaved,
}: {
  open: boolean;
  centro: CentroCosto | null;
  unidades: UnidadNegocio[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [responsable, setResponsable] = useState("");
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCodigo(centro?.codigo ?? "");
    setNombre(centro?.nombre ?? "");
    setUnidadId(centro?.unidadNegocioId ?? "");
    setResponsable(centro?.responsable ?? "");
    setActivo(centro?.activo ?? true);
  }, [open, centro]);

  async function guardar() {
    setGuardando(true);
    try {
      await guardarCentro(centro?.id ?? null, { codigo, nombre, unidadNegocioId: unidadId, responsable, activo });
      toast.success(centro ? "Centro de costo actualizado" : "Centro de costo creado");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar el centro de costo."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{centro ? "Editar centro de costo" : "Nuevo centro de costo"}</DialogTitle>
          <DialogDescription>Los requerimientos se cargan a un centro de costo y consumen su presupuesto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc-codigo">Código</Label>
              <Input id="cc-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="MTO-01" maxLength={20} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cc-nombre">Nombre</Label>
              <Input id="cc-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Mantenimiento planta" maxLength={80} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc-unidad">Sede o unidad de negocio</Label>
            <NativeSelect id="cc-unidad" className="w-full" value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
              <NativeSelectOption value="">Sin asignar</NativeSelectOption>
              {unidades.filter((u) => u.activa || u.id === unidadId).map((u) => (
                <NativeSelectOption key={u.id} value={u.id}>{u.codigo} — {u.nombre}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc-responsable">Responsable</Label>
            <Input id="cc-responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Jefe de mantenimiento" maxLength={80} />
          </div>
          {centro && (
            <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span>
                <span className="block font-medium">Activo</span>
                <span className="text-xs text-muted-foreground">Uno inactivo no aparece al crear requerimientos; su historial se conserva.</span>
              </span>
              <Switch checked={activo} onCheckedChange={setActivo} />
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
