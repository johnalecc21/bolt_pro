import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import { describirExcluidos, fetchRequerimientos, invitarProveedores } from "@/lib/api/requerimientos";
import { formatMoney } from "@/lib/moneda";
import { cn } from "@/lib/utils";

/**
 * Invites one proveedor to a requerimiento that's already out to bid. Only
 * EN_LICITACION ones are offered: before approval the invitation would skip
 * the approval matrix, and after the bid closes there's nothing to join.
 */
export function InvitarProveedorDialog({ proveedorId, proveedorNombre }: { proveedorId: string; proveedorNombre: string }) {
  const [open, setOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { data: requerimientos, loading } = useApiData(() => (open ? fetchRequerimientos() : Promise.resolve([])), [open]);
  const abiertos = (requerimientos ?? []).filter((r) => r.estado === "en_licitacion");

  async function invitar() {
    if (!seleccionado) return;
    setEnviando(true);
    try {
      const { excluidos } = await invitarProveedores(seleccionado, [proveedorId]);
      if (excluidos.length > 0) {
        toast.warning("No se pudo invitar", { description: describirExcluidos(excluidos) });
      } else {
        toast.success("Invitación enviada", { description: `${proveedorNombre} fue invitado y ya recibió la notificación.` });
        setOpen(false);
        setSeleccionado(null);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo enviar la invitación."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5"><Send className="h-4 w-4" /> Invitar a un requerimiento</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invitar a {proveedorNombre}</DialogTitle>
          <DialogDescription>Elige un requerimiento en licitación. El proveedor recibe la invitación de inmediato.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando requerimientos...</p>
        ) : abiertos.length === 0 ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>No tienes requerimientos en licitación en este momento.</p>
            <Button variant="outline" size="sm" asChild><Link to="/cliente/requerimientos/nuevo">Crear requerimiento</Link></Button>
          </div>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto" role="radiogroup" aria-label="Requerimientos en licitación">
            {abiertos.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={seleccionado === r.id}
                onClick={() => setSeleccionado(r.id)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left text-sm transition-colors",
                  seleccionado === r.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{r.titulo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{r.codigo}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.categoria} · {formatMoney(r.montoEstimado, r.moneda)} · cierra {r.fechaLimite}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={invitar} disabled={!seleccionado || enviando}>{enviando ? "Enviando..." : "Enviar invitación"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
