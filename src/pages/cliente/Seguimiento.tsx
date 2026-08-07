import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CheckCircle2, Circle, Clock, AlertTriangle, Truck, MessageSquareWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { fetchSeguimiento, confirmarRecepcion as apiConfirmarRecepcion } from "@/lib/api/seguimiento";
import { apiErrorMessage } from "@/lib/api/http";

const semaforoConfig = {
  completado: { label: "A tiempo", color: "text-success", bg: "bg-success/15" },
  en_riesgo: { label: "En riesgo", color: "text-warning-foreground", bg: "bg-warning/15" },
  atrasado: { label: "Atrasado", color: "text-destructive", bg: "bg-destructive/15" },
  pendiente: { label: "Pendiente", color: "text-muted-foreground", bg: "bg-muted" },
};

export function Seguimiento() {
  const navigate = useNavigate();
  const { data: seguimiento, loading, reload } = useApiData(fetchSeguimiento);

  async function confirmarRecepcion(hitoId: string) {
    try {
      await apiConfirmarRecepcion(hitoId);
      toast.success("Recepción confirmada", { description: "Esto alimenta el score de desempeño del proveedor." });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Seguimiento de Pedidos</h1>
        <p className="text-sm text-muted-foreground">Monitorea el cumplimiento post-PO de tus proveedores</p>
      </div>

      {loading ? <CardGridSkeleton count={2} /> : <div className="space-y-6">
        {(seguimiento ?? []).map((s) => {
          const peorEstado = s.hitos.some((h) => h.estado === "atrasado") ? "atrasado" : s.hitos.some((h) => h.estado === "en_riesgo") ? "en_riesgo" : "completado";
          return (
            <Card key={s.poId} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{s.poId}</h2>
                    <Badge variant="secondary" className="text-xs">{s.categoria}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.proveedor}</p>
                </div>
                <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", semaforoConfig[peorEstado].bg, semaforoConfig[peorEstado].color)}>
                  <Truck className="h-3.5 w-3.5" /> {semaforoConfig[peorEstado].label}
                </span>
              </div>

              <div className="space-y-4">
                {s.hitos.map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", semaforoConfig[h.estado].bg, semaforoConfig[h.estado].color)}>
                      {h.estado === "completado" ? <CheckCircle2 className="h-4 w-4" /> : h.estado === "atrasado" ? <AlertTriangle className="h-4 w-4" /> : h.estado === "en_riesgo" ? <Clock className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{h.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Comprometido {h.comprometido}{h.real && ` · Real ${h.real}`}</span>
                          {h.estado !== "completado" && h.estado !== "pendiente" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => confirmarRecepcion(h.id)}>
                              Confirmar recepción
                            </Button>
                          )}
                        </div>
                      </div>
                      {h.estado === "atrasado" && (
                        <p className="mt-1 text-xs text-destructive">Hito atrasado — considera aplicar penalidad contractual o escalar el caso.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t pt-4">
                <ConfirmDialog
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
                      <MessageSquareWarning className="h-4 w-4" /> Reportar incidencia
                    </Button>
                  }
                  title="Reportar incidencia"
                  description={`Se abrirá un caso de disputa referenciando ${s.poId} con ${s.proveedor}.`}
                  confirmLabel="Abrir caso"
                  onConfirm={() => navigate(`/cliente/disputas?po=${s.poId}`)}
                />
              </div>
            </Card>
          );
        })}
      </div>}
    </div>
  );
}
