import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Clock, Users, MessageSquare, Send, Calendar, Eye, FileQuestion } from "lucide-react";
import { usePermissionMode } from "@/components/auth/RequireRole";
import { useIncrustado } from "@/components/layout/Incrustado";
import { useApiData } from "@/hooks/useApiData";
import { TableroLicitacion } from "@/components/licitacion/TableroLicitacion";
import { fetchRequerimiento, extenderPlazo as apiExtenderPlazo, cerrarLicitacion } from "@/lib/api/requerimientos";
import { fetchPreguntas, responderPregunta } from "@/lib/api/preguntas";
import { apiErrorMessage } from "@/lib/api/http";
import { CargandoProcurex } from "@/components/shared/CargandoProcurex";

function calcularTiempoRestante(cierre: string | undefined) {
  if (!cierre) return { dias: 0, horas: 0, min: 0, vencido: true };
  const objetivo = new Date(cierre).getTime();
  const diffMs = Math.max(0, objetivo - Date.now());
  return {
    dias: Math.floor(diffMs / 86_400_000),
    horas: Math.floor((diffMs % 86_400_000) / 3_600_000),
    min: Math.floor((diffMs % 3_600_000) / 60_000),
    vencido: diffMs <= 0,
  };
}

export function LicitacionEnCurso() {
  const navigate = useNavigate();
  const { id } = useParams();
  const requerimientoId = id ?? "";
  const { data: requerimiento, loading: cargandoRequerimiento, reload: reloadRequerimiento } = useApiData(
    () => (requerimientoId ? fetchRequerimiento(requerimientoId) : new Promise<never>(() => {})),
    [requerimientoId],
  );
  const { data: preguntas, reload: reloadPreguntas } = useApiData(
    () => (requerimientoId ? fetchPreguntas(requerimientoId) : Promise.resolve([])),
    [requerimientoId],
  );
  const mode = usePermissionMode();
  const incrustado = useIncrustado();
  const [tiempo, setTiempo] = useState(() => calcularTiempoRestante(requerimiento?.cierre));
  const [borradores, setBorradores] = useState<Record<string, string>>({});
  const [respondiendoId, setRespondiendoId] = useState<string | null>(null);

  useEffect(() => {
    setTiempo(calcularTiempoRestante(requerimiento?.cierre));
    if (!requerimiento?.cierre) return;
    const intervalo = setInterval(() => {
      setTiempo(calcularTiempoRestante(requerimiento.cierre));
    }, 30_000);
    return () => clearInterval(intervalo);
  }, [requerimiento?.cierre]);

  if (cargandoRequerimiento) {
    return <CargandoProcurex pagina />;
  }

  if (!requerimiento) {
    return (
      <div className="p-6">
        <EmptyState icon={FileQuestion} title="Requerimiento no encontrado" description="Verifica el enlace o vuelve a la lista de requerimientos." />
      </div>
    );
  }

  // Closed = past the deadline (the API rejects offers from then on) or already
  // moved on to negotiation/adjudication.
  const enLicitacion = requerimiento.estado === "en_licitacion";
  const cerrada = !enLicitacion || tiempo.vencido;

  const pctRespuesta = requerimiento.proveedoresInvitados > 0
    ? Math.round((requerimiento.ofertasRecibidas / requerimiento.proveedoresInvitados) * 100)
    : 0;

  async function extenderPlazo(motivo?: string) {
    try {
      await apiExtenderPlazo(requerimientoId, 2, motivo);
      toast.success("Plazo extendido 2 días", { description: motivo });
      reloadRequerimiento();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo extender el plazo."));
    }
  }

  async function cerrarAnticipadamente() {
    try {
      await cerrarLicitacion(requerimientoId);
      toast.success("Licitación cerrada", { description: "Ya no se reciben ofertas. Revisa el cuadro comparativo." });
      navigate(`/cliente/procesos/${requerimientoId}/comparativo`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo cerrar la licitación."));
    }
  }

  async function responder(preguntaId: string) {
    const texto = (borradores[preguntaId] ?? "").trim();
    if (!texto) return;
    setRespondiendoId(preguntaId);
    try {
      await responderPregunta(preguntaId, texto);
      setBorradores((prev) => ({ ...prev, [preguntaId]: "" }));
      toast.success("Respuesta enviada");
      reloadPreguntas();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo enviar la respuesta."));
    } finally {
      setRespondiendoId(null);
    }
  }

  return (
    <div className={incrustado ? "space-y-6" : "space-y-6 p-6"}>
      {incrustado ? (
        <Badge className={cerrada ? "bg-muted text-muted-foreground" : "bg-info/15 text-info border-info/30"}>
          {cerrada ? "Licitación cerrada" : "Licitación abierta"}
        </Badge>
      ) : (
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{requerimiento.codigo}</h1>
            <Badge className={cerrada ? "bg-muted text-muted-foreground" : "bg-info/15 text-info border-info/30"}>
              {cerrada ? "Licitación Cerrada" : "Licitación Abierta"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{requerimiento.titulo} · {requerimiento.categoria}</p>
        </div>
      )}

      {mode === "readonly" && (
        <div className="flex items-center gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
          <Eye className="h-4 w-4" /> Estás viendo este proceso en modo solo lectura.
        </div>
      )}

      {/* Countdown */}
      <Card className="overflow-hidden">
        <div className="gradient-hero p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">
                {cerrada
                  ? enLicitacion
                    ? "Licitación cerrada — no se aceptan nuevas ofertas. Puedes extender el plazo si necesitas más ofertas."
                    : "Licitación cerrada — el proceso ya avanzó a negociación o adjudicación"
                  : "Tiempo restante para cierre"}
              </p>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-center">
                  <p className="text-4xl font-bold">{cerrada ? 0 : tiempo.dias}</p>
                  <p className="text-xs text-white/60">días</p>
                </div>
                <span className="text-3xl text-white/40">:</span>
                <div className="text-center">
                  <p className="text-4xl font-bold">{cerrada ? 0 : tiempo.horas}</p>
                  <p className="text-xs text-white/60">horas</p>
                </div>
                <span className="text-3xl text-white/40">:</span>
                <div className="text-center">
                  <p className="text-4xl font-bold">{cerrada ? 0 : tiempo.min}</p>
                  <p className="text-xs text-white/60">min</p>
                </div>
              </div>
            </div>
            <Clock className="h-16 w-16 text-white/20" />
          </div>
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {requerimiento.ofertasRecibidas} de {requerimiento.proveedoresInvitados} proveedores han respondido</span>
            <span className="font-medium text-success">{pctRespuesta}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full gradient-success rounded-full" style={{ width: `${pctRespuesta}%` }} />
          </div>
        </div>
      </Card>

      <TableroLicitacion requerimientoId={requerimientoId} abierta={!cerrada} puedeGestionar={mode === "full"} />

      <div className="grid grid-cols-1 gap-6">
        {/* Q&A */}
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4" /> Preguntas y respuestas (Q&A)
          </h2>
          {(preguntas ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Ningún proveedor ha preguntado todavía.</p>
          ) : (
            <div className="space-y-4">
              {(preguntas ?? []).map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{item.pregunta}</p>
                  <p className="mt-1 text-xs text-muted-foreground">— {item.proveedor?.nombre ?? "Proveedor"}</p>
                  {item.respuesta ? (
                    <p className="mt-2 rounded-md bg-muted p-2 text-sm">{item.respuesta}</p>
                  ) : mode === "full" && !cerrada ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        className="flex-1 rounded-md border border-input bg-white px-3 py-2 text-sm"
                        placeholder="Escribe tu respuesta..."
                        value={borradores[item.id] ?? ""}
                        onChange={(e) => setBorradores((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && responder(item.id)}
                      />
                      <Button
                        size="sm"
                        onClick={() => responder(item.id)}
                        disabled={respondiendoId === item.id || !(borradores[item.id] ?? "").trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-warning-foreground">Pendiente de respuesta.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Actions */}
      {enLicitacion && mode === "full" && (
        <div className="flex flex-wrap gap-3">
          <ConfirmDialog
            trigger={<Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Extender plazo</Button>}
            title="Extender plazo de la licitación"
            requireReason
            reasonLabel="Justificación de la extensión"
            confirmLabel="Extender 2 días"
            onConfirm={(motivo) => extenderPlazo(motivo)}
          />
          {!cerrada && (
            <ConfirmDialog
              trigger={<Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">Cerrar anticipadamente</Button>}
              title="Cerrar licitación anticipadamente"
              description="No se aceptarán más ofertas y se generará el cuadro comparativo con las ofertas recibidas hasta ahora."
              destructive
              confirmLabel="Cerrar licitación"
              onConfirm={cerrarAnticipadamente}
            />
          )}
          <Button asChild variant={cerrada ? "default" : "ghost"}>
            <Link to={`/cliente/procesos/${requerimientoId}/comparativo`}>Ver cuadro comparativo</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
