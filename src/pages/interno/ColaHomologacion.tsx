import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClipboardCheck, Check, X, HelpCircle, AlertTriangle, Copy, ExternalLink, ShieldAlert, ShieldCheck, FileCheck } from "lucide-react";
import {
  fetchColaHomologacion,
  resolverHomologacion as apiResolver,
  obtenerUrlDescarga,
  registrarVerificacion,
  validarDocumento,
  CATEGORIA_LABEL,
  LISTA_LABEL,
  type ColaHomologacionItem,
  type VerificacionLista,
} from "@/lib/api/homologacion";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api/http";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

const estadoDocMap: Record<string, string> = { validado: "Activo", subido: "pendiente_aprobacion", pendiente: "pendiente_aprobacion", vencido: "Vencido" };

const RESULTADO_LABEL: Record<VerificacionLista["resultado"], string> = {
  sin_coincidencia: "Sin coincidencia",
  coincidencia: "Posible coincidencia",
  no_disponible: "Lista no disponible",
  pendiente_manual: "Consulta manual pendiente",
};

/** Manual lists carry "Consultar en <url>" as their detalle — pull the link out for a button. */
function urlConsulta(v: VerificacionLista): string | null {
  const m = v.detalle?.match(/https?:\/\/\S+/);
  return m ? m[0] : null;
}

function VerificacionesListas({ item, onChange }: { item: ColaHomologacionItem; onChange: () => void }) {
  async function registrar(lista: string, resultado: "SIN_COINCIDENCIA" | "COINCIDENCIA", nota?: string) {
    try {
      await registrarVerificacion(item.proveedorId, lista, resultado, nota);
      toast.success("Verificación registrada", { description: `${LISTA_LABEL[lista] ?? lista}: ${resultado === "COINCIDENCIA" ? "coincidencia" : "sin coincidencia"}` });
      onChange();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (item.verificaciones.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin verificaciones en listas registradas para este envío.</p>;
  }
  return (
    <div className="space-y-1.5">
      {item.verificaciones.map((v) => {
        const url = urlConsulta(v);
        const requiereAccion = v.resultado !== "sin_coincidencia";
        return (
          <div key={v.lista} className={cn("rounded-lg border p-2 text-sm", requiereAccion ? "border-warning/40 bg-warning/5" : "border-border")}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                {requiereAccion ? <ShieldAlert className="h-4 w-4 text-warning-foreground" /> : <ShieldCheck className="h-4 w-4 text-success" />}
                {LISTA_LABEL[v.lista] ?? v.lista}
              </span>
              <span className="text-xs text-muted-foreground">{RESULTADO_LABEL[v.resultado]}</span>
            </div>
            {v.detalle && !url && <p className="mt-1 text-xs text-muted-foreground">{v.detalle}</p>}
            {v.verificadoPor && <p className="mt-1 text-xs text-muted-foreground">Registrado por {v.verificadoPor}</p>}
            {requiereAccion && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Consultar en el sitio oficial
                  </a>
                )}
                <ConfirmDialog
                  trigger={<Button size="sm" variant="outline" className="h-7 text-xs">Sin coincidencia</Button>}
                  title={`Registrar ${LISTA_LABEL[v.lista] ?? v.lista}: sin coincidencia`}
                  description="Queda en el log de auditoría con tu usuario. Si era una coincidencia automática, explica por qué es un homónimo."
                  requireReason
                  reasonLabel="Soporte de la consulta (número de certificado, homónimo, etc.)"
                  confirmLabel="Registrar"
                  onConfirm={(nota) => registrar(v.lista, "SIN_COINCIDENCIA", nota)}
                />
                <ConfirmDialog
                  trigger={<Button size="sm" variant="outline" className="h-7 border-destructive/30 text-xs text-destructive">Coincidencia confirmada</Button>}
                  title={`Registrar ${LISTA_LABEL[v.lista] ?? v.lista}: coincidencia`}
                  description="La homologación no podrá aprobarse mientras esta coincidencia siga registrada."
                  requireReason
                  confirmLabel="Registrar"
                  destructive
                  onConfirm={(nota) => registrar(v.lista, "COINCIDENCIA", nota)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ColaHomologacion() {
  const { data, loading, reload } = useApiData(fetchColaHomologacion);
  const cola = (data ?? []).filter((r) => r.estado === "zona_gris" || r.estado === "en_revision");
  // Approved proveedores that uploaded an optional document afterwards —
  // reviewed one document at a time, without reopening the homologación.
  const documentosSueltos = (data ?? [])
    .filter((r) => r.estado === "aprobado")
    .flatMap((r) => r.documentos.filter((d) => d.estado === "subido").map((d) => ({ ...d, proveedor: r.proveedorNombre })));

  async function resolverDocumento(docId: string, valido: boolean, motivo?: string) {
    try {
      await validarDocumento(docId, valido, motivo);
      toast.success(valido ? "Documento validado" : "Documento rechazado");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function aprobar(proveedorId: string, proveedor: string) {
    try {
      await apiResolver(proveedorId, "APROBADO", 85);
      toast.success("Proveedor homologado", { description: proveedor });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function rechazar(proveedorId: string, proveedor: string, motivo?: string) {
    try {
      await apiResolver(proveedorId, "RECHAZADO", 0, motivo);
      toast.info("Homologación rechazada", { description: proveedor });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function pedirInfo(proveedor: string) {
    toast.info("Solicitud enviada al proveedor", { description: proveedor });
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
        <p className="text-sm text-muted-foreground">Revisión manual de proveedores en zona gris de scoring automático</p>
      </div>

      {!loading && documentosSueltos.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><FileCheck className="h-4 w-4" /> Documentos por validar de proveedores ya homologados</h2>
          <p className="mb-3 text-sm text-muted-foreground">Documentos opcionales (HSE, sostenibilidad, centrales de riesgo, SARLAFT) cargados después de la aprobación. Algunos clientes los exigen para invitar.</p>
          <div className="space-y-2">
            {documentosSueltos.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{d.nombre}</p>
                  <p className="text-xs text-muted-foreground">{d.proveedor} · {CATEGORIA_LABEL[d.categoria]}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => verDocumento(d.id)}>Ver</Button>
                  <Button size="sm" className="gap-1.5" onClick={() => resolverDocumento(d.id, true)}><Check className="h-4 w-4" /> Validar</Button>
                  <ConfirmDialog
                    trigger={<Button size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive"><X className="h-4 w-4" /> Rechazar</Button>}
                    title="Rechazar documento"
                    requireReason
                    confirmLabel="Rechazar"
                    destructive
                    onConfirm={(motivo) => resolverDocumento(d.id, false, motivo)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? <TableSkeleton /> : cola.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Sin casos pendientes de revisión" />
      ) : (
        <div className="space-y-4">
          {cola.map((r) => (
            <Card key={r.proveedorId} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{r.proveedorNombre}</h2>
                  <p className="text-xs text-muted-foreground">Solicitado {r.fechaSolicitud} · Score preliminar: {r.score || "—"}</p>
                </div>
                <StatusBadge estado={r.estado === "zona_gris" ? "en_revision" : r.estado} />
              </div>

              {r.alertas.length > 0 && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <ul>{r.alertas.map((a, i) => <li key={i}>• {a}</li>)}</ul>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Documentos del proveedor</p>
                  <div className="space-y-1.5">
                    {r.documentos.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                        <span>
                          {d.nombre}
                          {!d.obligatorio && <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>}
                        </span>
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
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Resultado de validación automática (OCR)</p>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>{r.alertas.some((a) => a.includes("NIT/RUT")) ? "⚠" : "✓"} {r.nitDetectado ? `NIT/RUT detectado: ${r.nitDetectado}` : "NIT/RUT no detectado en el documento"}</p>
                    <p>{r.score >= 70 ? "✓" : "⚠"} Score automático: {r.score || "pendiente"}/100</p>
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

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Listas restrictivas (razón social y representante legal)</p>
                <VerificacionesListas item={r} onChange={reload} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                <ConfirmDialog
                  trigger={<Button size="sm" className="gap-1.5 gradient-success text-white"><Check className="h-4 w-4" /> Aprobar</Button>}
                  title="Aprobar homologación"
                  description={`${r.proveedorNombre} quedará disponible para ser invitado a licitaciones.`}
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
                  requireReason
                  reasonLabel="¿Qué información falta?"
                  confirmLabel="Enviar solicitud"
                  onConfirm={() => pedirInfo(r.proveedorNombre)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
