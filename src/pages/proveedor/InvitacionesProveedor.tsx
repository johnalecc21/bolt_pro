import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { fetchInvitaciones, fetchRequerimientoInvitado, aceptarInvitacion, declinarInvitacion, type Invitacion, type RequerimientoInvitado } from "@/lib/api/invitaciones";
import { apiErrorMessage } from "@/lib/api/http";
import { fechaLocal } from "@/lib/fecha";
import { Inbox, Check, X, Calendar, Eye, ListChecks, Loader2 } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { RequerimientoInvitadoDetalle } from "@/components/proveedor/RequerimientoInvitadoDetalle";

const estadoMap: Record<Invitacion["estado"], string> = {
  nueva: "pendiente_aprobacion",
  vista: "en_licitacion",
  respondida: "Activo",
  vencida: "Vencido",
  declinada: "cerrado",
};

export function InvitacionesProveedor() {
  const navigate = useNavigate();
  const { data: invitaciones, loading, reload } = useApiData(fetchInvitaciones);
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

  async function aceptar(inv: Invitacion) {
    setProcesando(true);
    try {
      await aceptarInvitacion(inv.id);
      toast.success("Invitación aceptada");
      navigate(`/proveedor/ofertas/${inv.requerimientoId}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setProcesando(false);
    }
  }

  async function declinar(inv: Invitacion) {
    setProcesando(true);
    try {
      await declinarInvitacion(inv.id);
      toast.info("Invitación declinada");
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
        <>
          <Button size="sm" variant="outline" disabled={procesando} className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => declinar(inv)}>
            <X className="h-4 w-4" aria-hidden="true" /> Declinar
          </Button>
          <Button size="sm" disabled={procesando} onClick={() => aceptar(inv)}>
            <Check className="h-4 w-4" aria-hidden="true" /> Aceptar participar
          </Button>
        </>
      )}
      {(inv.estado === "vista" || inv.estado === "respondida") && (
        <Button size="sm" variant={enDialogo ? "default" : "outline"} onClick={() => navigate(`/proveedor/ofertas/${inv.requerimientoId}`)}>
          {inv.estado === "vista" ? "Continuar oferta" : "Ver mi oferta"}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Bandeja de Invitaciones</h1>
        <p className="text-sm text-muted-foreground">Revisa cada requerimiento antes de aceptar participar. Las más recientes aparecen primero.</p>
      </div>

      {loading ? <TableSkeleton /> : (invitaciones ?? []).length === 0 ? (
        <EmptyState icon={Inbox} title="No tienes invitaciones activas" />
      ) : (
        <div className="space-y-3">
          {(invitaciones ?? []).map((inv) => (
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
              <DialogDescription>{abierta.cliente} te invita a cotizar. Revisa el alcance antes de decidir.</DialogDescription>
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
