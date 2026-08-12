import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Check, Clock, Circle, ArrowLeft, MessageSquare, Paperclip, Download, ChevronDown, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopilotoPanel } from "@/components/shared/CopilotoPanel";
import { useApiData } from "@/hooks/useApiData";
import { fetchRequerimiento, addComentario, type AprobacionRequerimiento } from "@/lib/api/requerimientos";
import { aprobarSolicitud, rechazarSolicitud } from "@/lib/api/aprobaciones";
import { ROLE_LABELS, type RoleCode } from "@/lib/api/matrizAprobacion";
import { apiErrorMessage } from "@/lib/api/http";
import { useAuth } from "@/lib/auth/AuthContext";
import type { EstadoReq } from "@/lib/mockData";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";

function esElegible(aprobacion: AprobacionRequerimiento, role: RoleCode) {
  if (aprobacion.tipoRegla === "SECUENCIAL") {
    return aprobacion.rolesRequeridos[aprobacion.pasoActual] === role;
  }
  return aprobacion.rolesRequeridos.includes(role);
}

function etiquetaRoles(roles: string[]) {
  return roles.map((r) => ROLE_LABELS[r as RoleCode] ?? r).join(" o ");
}

const ETAPA_ORDER: EstadoReq[] = [
  "borrador", "pendiente_aprobacion", "en_licitacion", "en_negociacion", "adjudicado", "en_cumplimiento", "cerrado",
];

const ETAPA_LABELS: Record<EstadoReq, string> = {
  borrador: "Borrador",
  pendiente_aprobacion: "Pendiente de aprobación",
  en_licitacion: "En Licitación",
  en_negociacion: "En Negociación",
  adjudicado: "Adjudicado",
  en_cumplimiento: "En Cumplimiento",
  cerrado: "Cerrado",
};

export function DetalleRequerimiento() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { data: req, loading, reload } = useApiData(() => fetchRequerimiento(id!), [id]);
  const [comentario, setComentario] = useState("");
  const [sending, setSending] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState(true);
  const [resolviendo, setResolviendo] = useState(false);

  async function handleAprobar(aprobacionId: string) {
    setResolviendo(true);
    try {
      await aprobarSolicitud(aprobacionId);
      toast.success("Aprobación registrada");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo aprobar."));
    } finally {
      setResolviendo(false);
    }
  }

  async function handleRechazar(aprobacionId: string, motivo?: string) {
    setResolviendo(true);
    try {
      await rechazarSolicitud(aprobacionId, motivo ?? "");
      toast.info("Solicitud rechazada");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo rechazar."));
    } finally {
      setResolviendo(false);
    }
  }

  async function enviarComentario() {
    if (!comentario.trim() || !id) return;
    setSending(true);
    try {
      await addComentario(id, comentario.trim());
      setComentario("");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  function descargar(doc: string) {
    toast.success("Descarga iniciada", { description: doc });
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando requerimiento...</div>;
  }

  if (!req) {
    return (
      <div className="p-6">
        <EmptyState icon={FileText} title="Requerimiento no encontrado" description={`No existe un requerimiento con id ${id}.`} />
      </div>
    );
  }

  const currentIdx = ETAPA_ORDER.indexOf(req.estado);
  const aprobacionPendiente = req.aprobaciones.find((a) => a.estado === "PENDIENTE");
  const rolActual = currentUser?.role.toUpperCase() as RoleCode | undefined;
  const puedeResolver = !!aprobacionPendiente && !!rolActual && esElegible(aprobacionPendiente, rolActual);
  const todosLosPasos = req.aprobaciones.flatMap((a) => a.pasos.map((p) => ({ ...p, aprobacionId: a.id })));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link to="/cliente/requerimientos">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{req.id}</h1>
            <StatusBadge estado={req.estado} />
          </div>
          <p className="text-sm text-muted-foreground">{req.titulo}</p>
        </div>
        <Link to={`/cliente/requerimientos/${id}/shortlist`}>
          <Button variant="outline">Ver Shortlist</Button>
        </Link>
        <Link to={`/cliente/licitaciones/${id}/comparativo`}>
          <Button className="gradient-brand text-white">Ver Comparativo</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <Collapsible open={detalleAbierto} onOpenChange={setDetalleAbierto}>
              <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
                <h2 className="font-semibold">Descripción y especificaciones</h2>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", detalleAbierto && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {req.descripcion ? (
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{req.descripcion}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin descripción registrada para este requerimiento.</p>
                )}
                {req.especificaciones.length > 0 && (
                  <div className="space-y-2">
                    {req.especificaciones.map((spec, i) => (
                      <div key={i} className="flex justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        <span className="text-muted-foreground">{spec.name}</span>
                        <span className="font-medium">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Card>

          <Card className="p-6">
            <h2 className="mb-6 font-semibold">Línea de tiempo del proceso</h2>
            <div className="relative space-y-6">
              {ETAPA_ORDER.map((estado, i) => {
                const done = i < currentIdx || i === currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={estado} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                        done && !active ? "border-success bg-success text-success-foreground" :
                        active ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20" :
                        "border-border bg-muted text-muted-foreground"
                      )}>
                        {done && !active ? <Check className="h-4 w-4" /> : active ? <Clock className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                      </div>
                      {i < ETAPA_ORDER.length - 1 && (
                        <div className={cn("mt-1 h-12 w-0.5", done ? "bg-success" : "bg-border")} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={cn("text-sm font-medium", active && "text-primary")}>{ETAPA_LABELS[estado]}</p>
                      {active && <p className="mt-1 text-xs text-primary">En progreso — {req.ofertasRecibidas} de {req.proveedoresInvitados} ofertas recibidas</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Activity */}
            <div className="mt-8 border-t pt-6">
              <h3 className="mb-4 font-semibold text-sm">Actividad y comentarios</h3>
              <div className="space-y-4">
                {req.comentarios.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin comentarios todavía.</p>
                )}
                {req.comentarios.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm">{c.autor}: {c.texto}</p>
                      <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Escribe un comentario..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviarComentario()}
                />
                <Button size="sm" onClick={enviarComentario} disabled={!comentario.trim() || sending}>Enviar</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {(aprobacionPendiente || todosLosPasos.length > 0 || req.aprobaciones.some((a) => a.estado === "RECHAZADA")) && (
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm"><ShieldCheck className="h-4 w-4" /> Aprobación</h3>

              {aprobacionPendiente && (
                <div className="mb-3 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {aprobacionPendiente.tipoRegla === "SECUENCIAL" && aprobacionPendiente.rolesRequeridos.length > 1
                      ? `Paso ${aprobacionPendiente.pasoActual + 1} de ${aprobacionPendiente.rolesRequeridos.length} — requiere `
                      : "Requiere aprobación de "}
                    <strong>{ROLE_LABELS[aprobacionPendiente.rolesRequeridos[aprobacionPendiente.pasoActual] as RoleCode] ?? etiquetaRoles(aprobacionPendiente.rolesRequeridos)}</strong>.
                  </p>
                  {puedeResolver ? (
                    <div className="flex gap-2">
                      <ConfirmDialog
                        trigger={<Button size="sm" className="gradient-success text-white"><Check className="h-4 w-4" /> Aprobar</Button>}
                        title="Aprobar solicitud"
                        description={`Vas a aprobar: "${req.titulo}". Esta acción queda registrada en el log de auditoría.`}
                        confirmLabel="Aprobar"
                        onConfirm={() => handleAprobar(aprobacionPendiente.id)}
                      />
                      <ConfirmDialog
                        trigger={<Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /> Rechazar</Button>}
                        title="Rechazar solicitud"
                        description="La justificación es obligatoria y será visible para el solicitante."
                        confirmLabel="Confirmar rechazo"
                        destructive
                        requireReason
                        onConfirm={(motivo) => handleRechazar(aprobacionPendiente.id, motivo)}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tu rol actual no puede resolver este paso.</p>
                  )}
                  {resolviendo && <p className="text-xs text-muted-foreground">Procesando...</p>}
                </div>
              )}

              {req.aprobaciones.filter((a) => a.estado === "RECHAZADA").map((a) => (
                <div key={a.id} className="mb-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                  Rechazado por {a.resueltoPor?.nombre ?? "—"}: {a.motivoRechazo}
                </div>
              ))}

              {todosLosPasos.length > 0 && (
                <div className="space-y-1.5 border-t border-border pt-3 text-xs">
                  {todosLosPasos.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-muted-foreground">
                      <span>{ROLE_LABELS[p.rol as RoleCode] ?? p.rol}: <span className="font-medium text-foreground">{p.aprobadoPor.nombre}</span></span>
                      <span>{new Date(p.aprobadoAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-sm">Detalles del requerimiento</h3>
            <div className="space-y-2 text-sm">
              {([
                ["Categoría", req.categoria],
                ["Presupuesto", `$${req.montoEstimado.toLocaleString()}`],
                ["Fecha límite", req.fechaLimite],
                ["Proveedores", `${req.proveedoresInvitados} invitados`],
                ["Ofertas recibidas", String(req.ofertasRecibidas)],
                ["Solicitante", req.solicitante],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-sm">Consultor asignado</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">AC</div>
              <div>
                <p className="text-sm font-medium">Ana Consultora</p>
                <p className="text-xs text-muted-foreground">Sourcing Expert</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast.info("Solicitud de contacto enviada a Ana Consultora")}>
              <MessageSquare className="mr-2 h-3.5 w-3.5" /> Contactar
            </Button>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-sm">Documentos</h3>
            <div className="space-y-2">
              {req.documentos.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin documentos adjuntos.</p>
              )}
              {req.documentos.map((doc) => (
                <button key={doc.id} onClick={() => descargar(doc.nombre)} className="flex w-full items-center gap-2 rounded-lg border border-border p-2 text-left text-sm hover:bg-muted/30 cursor-pointer">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{doc.nombre}</span>
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <CopilotoPanel context="detalle-requerimiento" />
    </div>
  );
}
