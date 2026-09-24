import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiErrorMessage } from "@/lib/api/http";

/**
 * A confirm dialog with its own form body: the action runs on "confirmar",
 * errors stay in the dialog (as a toast) so the user can fix and retry.
 */
export function DialogoAccion({
  trigger, titulo, descripcion, children, confirmar, destructivo, puedeConfirmar = true, onConfirmar, exito,
}: {
  trigger: ReactNode;
  titulo: string;
  descripcion: string;
  children?: ReactNode;
  confirmar: string;
  destructivo?: boolean;
  puedeConfirmar?: boolean;
  onConfirmar: () => Promise<unknown>;
  exito: string;
}) {
  const [open, setOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function ejecutar() {
    setEnviando(true);
    try {
      await onConfirmar();
      toast.success(exito);
      setOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        {children && <div className="space-y-3">{children}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant={destructivo ? "destructive" : "default"} disabled={!puedeConfirmar || enviando} onClick={ejecutar}>
            {enviando ? "Guardando..." : confirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
