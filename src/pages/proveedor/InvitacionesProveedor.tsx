import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { fetchInvitaciones, fetchRequerimientoInvitado, declinarInvitacion, type Invitacion, type RequerimientoInvitado } from "@/lib/api/invitaciones";
import { apiErrorMessage } from "@/lib/api/http";
import { fechaLocal } from "@/lib/fecha";
import { Inbox, FileEdit, X, Calendar, Eye, ListChecks, Loader2 } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { RequerimientoInvitadoDetalle } from "@/components/proveedor/RequerimientoInvitadoDetalle";
import { useIncrustado } from "@/components/layout/Incrustado";
import { haVencido } from "@/lib/fecha";

const estadoMap: Record<Invitacion["estado"], string> = {
  nueva: "pendiente_aprobacion",
  vista: "en_licitacion",
  respondida: "Activo",
  vencida: "Vencido",
  declinada: "No participarás",
};

/**
 * Invitations still waiting for an answer. There is no "accept" step:
 * preparing the offer is the answer, and "No participaré" declines.
 * Shown in the "Nuevos" tab of Procesos; ongoing ones live in "Participando".
 */
export function InvitacionesProveedor() {
  const navigate = useNavigate();
  const incrustado = useIncrustado();
  const { data: todas, loading, reload } = useApiData(fetchInvitaciones);
  const invitaciones = (todas ?? []).filter((i) => i.estado === "nueva" || (i.estado === "declinada" && !haVencido(i.cierre)));
  const [abierta, setAbierta] = useState<Invitacion | null>(null);
  const [detalle, setDetalle] = useState<RequerimientoInvitado | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function ver(inv: Invitacion) {
    setAbierta(inv);
    setDetalle(null);
    try {
      setDetalle(await fetchRequerimientoInvitado(inv.requerimientoId));
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo cargar el requerimiento."));
      setAbierta(null);
    }
  }

  async function declinar(inv: Invitacion) {
    setProcesando(true);
    try {
      await declinarInvitacion(inv.id);
      toast.info("Le avisamos al comprador que no participarás", { description: "Puedes cambiar de idea mientras el proceso siga abierto." });
      setAbierta(null);
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setProcesando(false);
    }
  }

  const acciones = (inv: Invitacion, enDialogo = false) => (
    <div className="flex flex-wrap gap-2">
      {!enDialogo && (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => ver(inv)}>
          <Eye className="h-4 w-4" aria-hidden="true" /> Ver requerimiento
        </Button>
      )}
      {inv.estado === "nueva" && (
        <Button size="sm" variant="outline" disabled={procesando} className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => declinar(inv)}>
          <X className="h-4 w-4" aria-hidden="true" /> No participaré
        </Button>
      )}
      <Button size="sm" disabled={procesando} onClick={() => navigate(`/proveedor/ofertas/${inv.requerimientoId}`)}>
        <FileEdit className="h-4 w-4" aria-hidden="true" /> {inv.estado === "declinada" ? "Participar de todas formas" : "Preparar oferta"}
      </Button>
    </div>
  );

  return (
    <div className={incrustado ? "space-y-3" : "space-y-6 p-6"}>
      <div>
        <h2 className={incrustado ? "font-semibold" : "text-2xl font-bold"}>Te invitaron</h2>
        <p className="text-sm text-muted-foreground">Revisa el requerimiento y prepara tu oferta, o avisa que no participarás. Las más recientes primero.</p>
      </div>

      {loading ? <TableSkeleton /> : invitaciones.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">No tienes invitaciones sin responder.</p>
      ) : (
        <div className="space-y-3">
          {invitaciones.map((inv) => (
            <Card key={inv.id} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Inbox className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <button type="button" className="text-left text-sm font-medium hover:text-primary hover:underline" onClick={() => ver(inv)}>
                    <span className="text-muted-foreground">{inv.codigo}</span> · {inv.titulo || inv.categoria}
                  </button>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{inv.cliente}</span>
                    <span>{inv.categoria}</span>
                    {inv.items > 0 && <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" aria-hidden="true" /> {inv.items} ítem(s)</span>}
                    <span>Recibida {fechaLocal(inv.recibida)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden="true" /> Vence {inv.fechaLimite}</span>
                  </div>
                </div>
                <StatusBadge estado={estadoMap[inv.estado]} className="capitalize" />
                {acciones(inv)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!abierta} onOpenChange={(o) => !o && setAbierta(null)}>
        {abierta && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{abierta.titulo || abierta.codigo}</DialogTitle>
              <DialogDescription>{abierta.cliente} te invita a cotizar. Revisa el alcance antes de preparar tu oferta.</DialogDescription>
            </DialogHeader>
            {detalle ? (
              <RequerimientoInvitadoDetalle r={detalle} />
            ) : (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando requerimiento…</div>
            )}
            <DialogFooter className="gap-2 sm:justify-end">{acciones(abierta, true)}</DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
