import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowLeft, MessageSquare, FileText } from "lucide-react";
import { CopilotoPanel } from "@/components/shared/CopilotoPanel";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDetalleRequerimiento } from "@/pages/cliente/detalle-requerimiento/useDetalleRequerimiento";
import { DescripcionEspecificaciones } from "@/pages/cliente/detalle-requerimiento/DescripcionEspecificaciones";
import { ProcesoTimeline } from "@/pages/cliente/detalle-requerimiento/ProcesoTimeline";
import { AprobacionCard } from "@/pages/cliente/detalle-requerimiento/AprobacionCard";
import { DocumentosPanel } from "@/pages/cliente/detalle-requerimiento/DocumentosPanel";

import { formatMoney } from "@/lib/moneda";
export function DetalleRequerimiento() {
  const { id } = useParams();
  const {
    req, loading,
    comentario, setComentario, sending, enviarComentario,
    resolviendo, handleAprobar, handleRechazar,
    subiendo, descargando, fileInputRef, abrirSelectorArchivo, onFileSelected, descargar,
    aprobacionPendiente, puedeResolver, todosLosPasos,
  } = useDetalleRequerimiento(id);

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link to="/cliente/requerimientos">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{req.codigo}</h1>
            <StatusBadge estado={req.estado} />
          </div>
          <p className="text-sm text-muted-foreground">{req.titulo}</p>
        </div>
        {req.estado === "en_licitacion" && (
          <Link to={`/cliente/requerimientos/${id}/shortlist`}>
            <Button variant="outline">Agregar proveedores</Button>
          </Link>
        )}
        <Link to={`/cliente/licitaciones/${id}/comparativo`}>
          <Button>Ver Comparativo</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DescripcionEspecificaciones descripcion={req.descripcion} especificaciones={req.especificaciones} />
          <ProcesoTimeline
            req={req}
            comentario={comentario}
            onComentarioChange={setComentario}
            onEnviarComentario={enviarComentario}
            sending={sending}
          />
        </div>

        <div className="space-y-4">
          <AprobacionCard
            req={req}
            aprobacionPendiente={aprobacionPendiente}
            puedeResolver={puedeResolver}
            resolviendo={resolviendo}
            todosLosPasos={todosLosPasos}
            onAprobar={handleAprobar}
            onRechazar={handleRechazar}
          />

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-sm">Detalles del requerimiento</h3>
            <div className="space-y-2 text-sm">
              {([
                ["Categoría", req.categoria],
                ["Presupuesto", formatMoney(req.montoEstimado, req.moneda)],
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

          <DocumentosPanel
            documentos={req.documentos}
            descargando={descargando}
            subiendo={subiendo}
            fileInputRef={fileInputRef}
            onDescargar={descargar}
            onAbrirSelectorArchivo={abrirSelectorArchivo}
            onFileSelected={onFileSelected}
          />
        </div>
      </div>
      <CopilotoPanel context="detalle-requerimiento" />
    </div>
  );
}
