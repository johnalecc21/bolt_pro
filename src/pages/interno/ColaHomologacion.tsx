import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClipboardCheck, Check, X, HelpCircle, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import {
  fetchColaHomologacion,
  resolverHomologacion as apiResolver,
  solicitarInfoHomologacion,
  obtenerUrlDescarga,
  NIVEL_RIESGO_INFO,
  PESOS_SCORE,
  type ColaHomologacionItem,
  type ScoreDesglose,
} from "@/lib/api/homologacion";
import { apiErrorMessage } from "@/lib/api/http";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { cn } from "@/lib/utils";

const estadoDocMap: Record<string, string> = { validado: "Activo", subido: "pendiente_aprobacion", pendiente: "pendiente_aprobacion", vencido: "Vencido" };

const CATEGORIA_LABEL: Record<keyof ScoreDesglose, string> = {
  financiero: "Financiero",
  legal: "Legal",
  compliance: "Compliance",
  tecnico: "Técnico",
  operacional: "Operacional",
  comercial: "Comercial",
};

const RIESGO_COLOR: Record<string, string> = {
  bajo: "bg-success/10 text-success border-success/30",
  medio: "bg-warning/10 text-warning-foreground border-warning/30",
  alto: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  critico: "bg-destructive/10 text-destructive border-destructive/30",
};

export function ColaHomologacion() {
  const { data, loading, reload } = useApiData(fetchColaHomologacion);
  const cola = (data ?? []).filter((r) => r.estado === "zona_gris" || r.estado === "en_revision");

  async function aprobar(proveedorId: string, proveedor: string) {
    try {
      // No score override — the backend uses the weighted score computed at submit time.
      await apiResolver(proveedorId, "APROBADO");
      toast.success("Proveedor homologado", { description: proveedor });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function rechazar(proveedorId: string, proveedor: string, motivo?: string) {
    try {
      await apiResolver(proveedorId, "RECHAZADO", undefined, motivo);
      toast.info("Homologación rechazada", { description: proveedor });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function pedirInfo(proveedorId: string, proveedor: string, mensaje?: string) {
    try {
      await solicitarInfoHomologacion(proveedorId, mensaje ?? "");
      toast.info("Solicitud enviada al proveedor", { description: proveedor });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function copiarNit(nit: string) {
    await navigator.clipboard.writeText(nit);
    toast.success("NIT copiado", { description: nit });
  }

  function verificarEnRues() {
    window.open("https://rues.org.co/busqueda-avanzada", "_blank", "noopener,noreferrer");
  }

  async function verDocumento(docId: string) {
    const tab = window.open("", "_blank", "noopener,noreferrer");
    try {
      const url = await obtenerUrlDescarga(docId);
      if (tab) tab.location.href = url;
    } catch (err) {
      tab?.close();
      toast.error(apiErrorMessage(err, "No se pudo abrir el documento."));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Cola de Homologación</h1>
        <p className="text-sm text-muted-foreground">Revisión de proveedores por scoring ponderado y clasificación de riesgo</p>
      </div>

      {loading ? <TableSkeleton /> : cola.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Sin casos pendientes de revisión" />
      ) : (
        <div className="space-y-4">
          {cola.map((r) => (
            <Card key={r.proveedorId} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{r.proveedorNombre}</h2>
                  <p className="text-xs text-muted-foreground">Solicitado {r.fechaSolicitud} · Score ponderado: {r.score || "—"}/100</p>
                </div>
                <StatusBadge estado={r.estado === "zona_gris" ? "en_revision" : r.estado} />
              </div>

              <RiesgoPanel registro={r} />

              {r.alertas.length > 0 && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <ul>{r.alertas.map((a, i) => <li key={i}>• {a}</li>)}</ul>
                </div>
              )}

              <CuestionarioResumen registro={r} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Documentos del proveedor</p>
                  <div className="space-y-1.5">
                    {r.documentos.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                        <span>{d.nombre}</span>
                        <div className="flex items-center gap-2">
                          {d.estado !== "pendiente" && (
                            <button onClick={() => verDocumento(d.id)} className="text-xs text-primary hover:underline">Ver</button>
                          )}
                          <StatusBadge estado={estadoDocMap[d.estado]} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Validación automática (OCR + OFAC)</p>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>{r.alertas.some((a) => a.includes("NIT/RUT")) ? "⚠" : "✓"} {r.nitDetectado ? `NIT/RUT detectado: ${r.nitDetectado}` : "NIT/RUT no detectado en el documento"}</p>
                    <p>{r.alertas.some((a) => a.includes("OFAC")) ? "⚠" : "✓"} {r.alertas.some((a) => a.includes("OFAC")) ? "Posible coincidencia en lista OFAC/SDN" : "Sin coincidencias en lista OFAC/SDN"}</p>
                    <p>{r.score >= 70 ? "✓" : "⚠"} Score ponderado: {r.score || "pendiente"}/100</p>
                  </div>
                  {r.nitDetectado && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-border p-2">
                      <span className="font-mono text-xs">{r.nitDetectado}</span>
                      <button onClick={() => copiarNit(r.nitDetectado!)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Copy className="h-3 w-3" /> Copiar
                      </button>
                      <button onClick={verificarEnRues} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> Verificar en RUES
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                <ConfirmDialog
                  trigger={<Button size="sm" className="gap-1.5 gradient-success text-white"><Check className="h-4 w-4" /> Aprobar</Button>}
                  title="Aprobar homologación"
                  description={`${r.proveedorNombre} quedará homologado con score ${r.score}/100${r.nivelRiesgo ? ` (riesgo ${NIVEL_RIESGO_INFO[r.nivelRiesgo].label.toLowerCase()})` : ""} y disponible para invitaciones.`}
                  confirmLabel="Aprobar"
                  onConfirm={() => aprobar(r.proveedorId, r.proveedorNombre)}
                />
                <ConfirmDialog
                  trigger={<Button size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /> Rechazar</Button>}
                  title="Rechazar homologación"
                  requireReason
                  confirmLabel="Rechazar"
                  destructive
                  onConfirm={(motivo) => rechazar(r.proveedorId, r.proveedorNombre, motivo)}
                />
                <ConfirmDialog
                  trigger={<Button size="sm" variant="ghost" className="gap-1.5"><HelpCircle className="h-4 w-4" /> Pedir más información</Button>}
                  title="Solicitar información adicional"
                  description="La homologación volverá a borrador para que el proveedor la corrija y reenvíe."
                  requireReason
                  reasonLabel="¿Qué información o documentos faltan?"
                  confirmLabel="Enviar solicitud"
                  onConfirm={(mensaje) => pedirInfo(r.proveedorId, r.proveedorNombre, mensaje)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RiesgoPanel({ registro }: { registro: ColaHomologacionItem }) {
  const { nivelRiesgo, scoreDesglose } = registro;
  if (!nivelRiesgo && !scoreDesglose) return null;
  const info = nivelRiesgo ? NIVEL_RIESGO_INFO[nivelRiesgo] : null;

  return (
    <div className="mb-4 rounded-lg border border-border p-3">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {nivelRiesgo && info && (
          <span className={cn("rounded-md border px-2.5 py-1 text-xs font-semibold uppercase", RIESGO_COLOR[nivelRiesgo])}>
            Riesgo {info.label}
          </span>
        )}
        {info && (
          <>
            <span className="text-xs text-muted-foreground">
              Aprobaciones requeridas: <strong className="text-foreground">{info.aprobacionesRequeridas.join(" + ")}</strong>
            </span>
            <span className="text-xs text-muted-foreground">
              Reevaluación: <strong className="text-foreground">{info.reevaluacion}</strong>
            </span>
          </>
        )}
      </div>
      {scoreDesglose && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(scoreDesglose) as (keyof ScoreDesglose)[]).map((k) => (
            <div key={k} className="rounded-md bg-muted/40 p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{CATEGORIA_LABEL[k]} · {Math.round(PESOS_SCORE[k] * 100)}%</span>
                <span className="font-semibold">{scoreDesglose[k]}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full", scoreDesglose[k] >= 70 ? "bg-success" : scoreDesglose[k] >= 40 ? "bg-warning" : "bg-destructive")}
                  style={{ width: `${scoreDesglose[k]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CuestionarioResumen({ registro }: { registro: ColaHomologacionItem }) {
  const c = registro.cuestionario;
  if (!c || Object.keys(c).length === 0) return null;

  const flag = (v: boolean | undefined) => (v === undefined ? "—" : v ? "Sí" : "No");
  const filas: { label: string; valor: string; alerta?: boolean }[] = [
    { label: "Razón social", valor: c.razonSocial ?? "—" },
    { label: "NIT / RUT", valor: c.nitRut ?? "—" },
    { label: "Representante legal", valor: c.representanteLegal ?? "—" },
    { label: "Tipo", valor: c.tipoProveedor ?? "—" },
    { label: "PEP", valor: flag(c.esPep), alerta: c.esPep },
    { label: "Sancionado (5 años)", valor: flag(c.sancionado), alerta: c.sancionado },
    { label: "Litigios en curso", valor: flag(c.litigios), alerta: c.litigios },
    { label: "Listas restrictivas", valor: flag(c.listaRestrictiva), alerta: c.listaRestrictiva },
    { label: "EEFF auditados", valor: flag(c.tieneEstadosFinancierosAuditados) },
    { label: "Anticorrupción", valor: flag(c.politicaAnticorrupcion), alerta: c.politicaAnticorrupcion === false },
    { label: "Protección de datos", valor: flag(c.politicaProteccionDatos), alerta: c.politicaProteccionDatos === false },
    { label: "Incidentes graves", valor: flag(c.incidentesGraves), alerta: c.incidentesGraves },
  ];

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Cuestionario de homologación</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-border p-3 text-sm sm:grid-cols-3">
        {filas.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <span className={cn("font-medium", f.alerta && "text-destructive")}>{f.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
