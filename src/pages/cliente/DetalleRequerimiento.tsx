import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowLeft, FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDetalleRequerimiento } from "@/pages/cliente/detalle-requerimiento/useDetalleRequerimiento";
import { DescripcionEspecificaciones } from "@/pages/cliente/detalle-requerimiento/DescripcionEspecificaciones";
import { ProcesoTimeline } from "@/pages/cliente/detalle-requerimiento/ProcesoTimeline";
import { AprobacionCard } from "@/pages/cliente/detalle-requerimiento/AprobacionCard";
import { DocumentosPanel } from "@/pages/cliente/detalle-requerimiento/DocumentosPanel";
import { DevueltoCard } from "@/pages/cliente/detalle-requerimiento/DevueltoCard";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/badge";

import { formatMoney } from "@/lib/moneda";
export function DetalleRequerimiento() {
  const { id } = useParams();
  const {
    req, loading, reload,
    comentario, setComentario, sending, enviarComentario,
    resolviendo, handleAprobar, handleRechazar,
    subiendo, descargando, fileInputRef, abrirSelectorArchivo, onFileSelected, descargar,
    aprobacionPendiente, puedeResolver, todosLosPasos,
  } = useDetalleRequerimiento(id);
  const { currentUser } = useAuth();

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
        <Button asChild variant="ghost" size="icon" aria-label="Volver a requerimientos">
          <Link to="/cliente/requerimientos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{req.codigo}</h1>
            <StatusBadge estado={req.estado} />
            {req.prioridad !== "normal" && (
              <Badge variant="outline" className={req.prioridad === "urgente" ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning-foreground"}>
                Prioridad {req.prioridad}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{req.titulo}</p>
        </div>
        {req.estado === "en_licitacion" && (
          <>
            <Button asChild variant="outline">
              <Link to={`/cliente/requerimientos/${id}/shortlist`}>Agregar proveedores</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/cliente/licitaciones/${id}`}>Ver licitación</Link>
            </Button>
          </>
        )}
        {["en_licitacion", "en_negociacion"].includes(req.estado) && (
          <Button asChild>
            <Link to={`/cliente/licitaciones/${id}/comparativo`}>Ver comparativo</Link>
          </Button>
        )}
        {["adjudicado", "en_cumplimiento", "cerrado"].includes(req.estado) && (
          <Button asChild>
            <Link to={`/cliente/adjudicacion/${id}`}>Ver adjudicación</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DescripcionEspecificaciones descripcion={req.descripcion} especificaciones={req.especificaciones} items={req.items} />
          <ProcesoTimeline
            req={req}
            comentario={comentario}
            onComentarioChange={setComentario}
            onEnviarComentario={enviarComentario}
            sending={sending}
          />
        </div>

        <div className="space-y-4">
          {req.estado === "borrador" && (
            <DevueltoCard
              req={req}
              puedeEditar={currentUser?.role === "comprador" || currentUser?.role === "admin_cliente"}
              onReenviado={reload}
            />
          )}
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
                ["Cierre de licitación", req.fechaLimite],
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
    </div>
  );
}
