import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClipboardCheck, Check, X, HelpCircle, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { fetchColaHomologacion, resolverHomologacion as apiResolver, obtenerUrlDescarga } from "@/lib/api/homologacion";
import { apiErrorMessage } from "@/lib/api/http";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

const estadoDocMap: Record<string, string> = { validado: "Activo", subido: "pendiente_aprobacion", pendiente: "pendiente_aprobacion", vencido: "Vencido" };

export function ColaHomologacion() {
  const { data, loading, reload } = useApiData(fetchColaHomologacion);
  const cola = (data ?? []).filter((r) => r.estado === "zona_gris" || r.estado === "en_revision");

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
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Resultado de validación automática (OCR + OFAC)</p>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>{r.alertas.some((a) => a.includes("NIT/RUT")) ? "⚠" : "✓"} {r.nitDetectado ? `NIT/RUT detectado: ${r.nitDetectado}` : "NIT/RUT no detectado en el documento"}</p>
                    <p>{r.alertas.some((a) => a.includes("OFAC")) ? "⚠" : "✓"} {r.alertas.some((a) => a.includes("OFAC")) ? "Posible coincidencia en lista OFAC/SDN" : "Sin coincidencias en lista OFAC/SDN"}</p>
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
