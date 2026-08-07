import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { fetchInvitaciones, aceptarInvitacion, declinarInvitacion, type Invitacion } from "@/lib/api/invitaciones";
import { apiErrorMessage } from "@/lib/api/http";
import { Inbox, Check, X, Calendar } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

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

  async function aceptar(inv: Invitacion) {
    try {
      await aceptarInvitacion(inv.id);
      toast.success("Invitación aceptada");
      navigate(`/proveedor/ofertas/${inv.requerimientoId}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function declinar(inv: Invitacion) {
    try {
      await declinarInvitacion(inv.id);
      toast.info("Invitación declinada");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Bandeja de Invitaciones</h1>
        <p className="text-sm text-muted-foreground">Gestiona tus invitaciones a procesos de cotización</p>
      </div>

      {loading ? <TableSkeleton /> : (invitaciones ?? []).length === 0 ? (
        <EmptyState icon={Inbox} title="No tienes invitaciones activas" />
      ) : (
        <div className="space-y-3">
          {(invitaciones ?? []).map((inv) => (
            <Card key={inv.id} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Inbox className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{inv.requerimientoId} · {inv.categoria}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{inv.cliente}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Vence {inv.fechaLimite}</span>
                  </div>
                </div>
                <StatusBadge estado={estadoMap[inv.estado]} className="capitalize" />
                {inv.estado === "nueva" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => declinar(inv)}>
                      <X className="h-4 w-4" /> Declinar
                    </Button>
                    <Button size="sm" className="gradient-brand text-white" onClick={() => aceptar(inv)}>
                      <Check className="h-4 w-4" /> Aceptar participar
                    </Button>
                  </div>
                )}
                {inv.estado === "vista" && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/proveedor/ofertas/${inv.requerimientoId}`)}>Continuar oferta</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
