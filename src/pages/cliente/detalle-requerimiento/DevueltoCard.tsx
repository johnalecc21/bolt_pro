import { useState } from "react";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { reenviarRequerimiento, type RequerimientoDetalle } from "@/lib/api/requerimientos";
import { apiErrorMessage } from "@/lib/api/http";
import type { Prioridad } from "@/lib/types";
import { ItemsEditor, itemIncompleto, itemsValidos, type ItemBorrador } from "@/pages/cliente/nuevo-requerimiento/ItemsEditor";

/**
 * A rejected requerimiento comes back as a borrador: this shows why and lets
 * the solicitante correct it and send it to approval again.
 */
export function DevueltoCard({ req, puedeEditar, onReenviado }: { req: RequerimientoDetalle; puedeEditar: boolean; onReenviado: () => void }) {
  const rechazo = [...req.aprobaciones].reverse().find((a) => a.estado === "RECHAZADA");
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState(req.titulo);
  const [descripcion, setDescripcion] = useState(req.descripcion ?? "");
  const [monto, setMonto] = useState(String(req.montoEstimado));
  const [fechaLimite, setFechaLimite] = useState(req.fechaLimite);
  const [prioridad, setPrioridad] = useState<Prioridad>(req.prioridad);
  const itemsOriginales: ItemBorrador[] = req.items.map((i) => ({
    descripcion: i.descripcion,
    cantidad: String(i.cantidad),
    unidad: i.unidad,
    especificacion: i.especificacion ?? null,
  }));
  const [items, setItems] = useState<ItemBorrador[]>(itemsOriginales);
  const itemsConError = items.some(itemIncompleto);
  const [enviando, setEnviando] = useState(false);

  async function reenviar() {
    const montoNum = Number(monto);
    if (!titulo.trim() || !Number.isFinite(montoNum) || montoNum < 0) {
      toast.error("Revisa el título y el monto.");
      return;
    }
    if (itemsConError) {
      toast.error("Hay ítems incompletos.");
      return;
    }
    // Only replace the lines when they actually changed.
    const nuevos = itemsValidos(items);
    const cambiaronItems = JSON.stringify(nuevos) !== JSON.stringify(itemsValidos(itemsOriginales));
    setEnviando(true);
    try {
      await reenviarRequerimiento(req.id, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        montoEstimado: Math.round(montoNum),
        fechaLimite,
        prioridad,
        ...(cambiaronItems ? { items: nuevos } : {}),
      });
      toast.success("Requerimiento reenviado a aprobación");
      setOpen(false);
      onReenviado();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo reenviar."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="border-warning/40 bg-warning/5 p-5">
      <div className="flex items-start gap-3">
        <Undo2 className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold">Devuelto por el aprobador</p>
          {rechazo?.motivoRechazo && <p className="text-sm text-muted-foreground">“{rechazo.motivoRechazo}”{rechazo.resueltoPor ? ` — ${rechazo.resueltoPor.nombre}` : ""}</p>}
          <p className="text-xs text-muted-foreground">No cuenta contra el presupuesto hasta que lo reenvíes.</p>
        </div>
      </div>
      {puedeEditar && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 w-full">Corregir y reenviar</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Corregir y reenviar a aprobación</DialogTitle>
              <DialogDescription>Se vuelve a aplicar la matriz de aprobación y el control de presupuesto con los nuevos valores.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rv-titulo">Título</Label>
                <Input id="rv-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rv-desc">Descripción</Label>
                <Textarea id="rv-desc" rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rv-monto">Presupuesto ({req.moneda})</Label>
                  <Input id="rv-monto" type="number" min={0} value={monto} onChange={(e) => setMonto(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rv-fecha">Cierre de licitación</Label>
                  <Input id="rv-fecha" type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rv-prio">Prioridad</Label>
                  <select
                    id="rv-prio"
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as Prioridad)}
                    className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="border-t pt-3">
                <ItemsEditor items={items} onChange={setItems} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={reenviar} disabled={enviando || itemsConError}>{enviando ? "Reenviando..." : "Reenviar a aprobación"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
