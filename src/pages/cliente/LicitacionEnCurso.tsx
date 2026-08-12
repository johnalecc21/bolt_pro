import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Clock, Users, MessageSquare, Plus, Calendar, Eye, FileQuestion } from "lucide-react";
import { usePermissionMode } from "@/components/auth/RequireRole";
import { useApiData } from "@/hooks/useApiData";
import { fetchRequerimiento, extenderPlazo as apiExtenderPlazo } from "@/lib/api/requerimientos";
import { fetchOfertasPorRequerimiento } from "@/lib/api/ofertas";
import { fetchProveedores } from "@/lib/api/proveedores";
import { apiErrorMessage } from "@/lib/api/http";

const qaItems = [
  { q: "¿El servicio incluye migración de bases de datos?", a: "Sí, incluye migración completa de hasta 5 bases de datos relacionales.", autor: "Proveedor anónimo" },
  { q: "¿Qué SLA de soporte técnico ofrecen?", a: "SLA 24/7 con respuesta en menos de 2 horas para incidentes críticos.", autor: "Proveedor anónimo" },
];

function calcularTiempoRestante(fechaLimite: string | undefined) {
  if (!fechaLimite) return { dias: 0, horas: 0, min: 0, vencido: true };
  const objetivo = new Date(`${fechaLimite}T23:59:59`).getTime();
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
  const { data: requerimiento, reload: reloadRequerimiento } = useApiData(
    () => (requerimientoId ? fetchRequerimiento(requerimientoId) : new Promise<never>(() => {})),
    [requerimientoId],
  );
  const { data: ofertas } = useApiData(
    () => (requerimientoId ? fetchOfertasPorRequerimiento(requerimientoId) : Promise.resolve([])),
    [requerimientoId],
  );
  const { data: proveedores } = useApiData(() => fetchProveedores());
  const mode = usePermissionMode();
  const [tiempo, setTiempo] = useState(() => calcularTiempoRestante(requerimiento?.fechaLimite));
  const [cerrada, setCerrada] = useState(false);
  const [qa, setQa] = useState(qaItems);
  const [respuesta, setRespuesta] = useState("");

  useEffect(() => {
    setTiempo(calcularTiempoRestante(requerimiento?.fechaLimite));
    if (!requerimiento?.fechaLimite) return;
    const intervalo = setInterval(() => {
      setTiempo(calcularTiempoRestante(requerimiento.fechaLimite));
    }, 30_000);
    return () => clearInterval(intervalo);
  }, [requerimiento?.fechaLimite]);

  if (!requerimiento) {
    return (
      <div className="p-6">
        <EmptyState icon={FileQuestion} title="Requerimiento no encontrado" description="Verifica el enlace o vuelve a la lista de requerimientos." />
      </div>
    );
  }

  // Providers that already submitted a structured offer for this process,
  // padded with a few more from the same category shown as "invitado"/"sin respuesta" for realism.
  const todosProveedores = proveedores ?? [];
  const respondieron = (ofertas ?? []).filter((o) => o.enviada).map((o) => ({ proveedorId: o.proveedorId, estado: "Oferta enviada" }));
  const idsRespondieron = new Set(respondieron.map((r) => r.proveedorId));
  const otrosInvitados = todosProveedores
    .filter((p) => p.categorias.includes(requerimiento.categoria) && !idsRespondieron.has(p.id))
    .slice(0, Math.max(0, requerimiento.proveedoresInvitados - respondieron.length))
    .map((p, i) => ({ proveedorId: p.id, estado: i === 0 ? "Visto" : "Sin respuesta" }));
  const listaProveedores = [...respondieron, ...otrosInvitados]
    .map((r) => ({ ...r, proveedor: todosProveedores.find((p) => p.id === r.proveedorId) }))
    .filter((r): r is typeof r & { proveedor: NonNullable<typeof r.proveedor> } => !!r.proveedor);

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

  function cerrarAnticipadamente() {
    setCerrada(true);
    toast.success("Licitación cerrada", { description: "Ya puedes revisar el cuadro comparativo." });
    navigate(`/cliente/licitaciones/${requerimientoId}/comparativo`);
  }

  function enviarRespuesta() {
    if (!respuesta.trim()) return;
    setQa((prev) => [...prev, { q: "Pregunta del comprador", a: respuesta.trim(), autor: "Carlos (Comprador)" }]);
    setRespuesta("");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{requerimientoId}</h1>
          <Badge className={cerrada ? "bg-muted text-muted-foreground" : "bg-info/15 text-info border-info/30"}>
            {cerrada ? "Licitación Cerrada" : "Licitación Abierta"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{requerimiento.titulo} · Acme S.A.</p>
      </div>

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
                  ? "Licitación cerrada — no se aceptan nuevas ofertas"
                  : tiempo.vencido
                    ? "Plazo vencido — extiéndelo o cierra la licitación"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Providers */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Estado de proveedores invitados</h2>
          {listaProveedores.length === 0 ? (
            <EmptyState icon={Users} title="Sin proveedores invitados todavía" />
          ) : (
            <div className="space-y-2">
              {listaProveedores.map(({ proveedor: p, estado }) => {
                const colorClass =
                  estado === "Oferta enviada" ? "bg-success/15 text-success" :
                  estado === "Visto" ? "bg-info/15 text-info" :
                  estado === "Sin respuesta" ? "bg-destructive/15 text-destructive" :
                  "bg-muted text-muted-foreground";
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white text-xs font-bold" style={{ background: p.color }}>
                      {p.iniciales}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">Invitado {requerimiento.fechaLimite}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>{estado}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Q&A */}
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4" /> Preguntas y respuestas (Q&A)
          </h2>
          <div className="space-y-4">
            {qa.map((item, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{item.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
                <p className="mt-2 text-xs text-muted-foreground">— {item.autor}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-md border border-input bg-white px-3 py-2 text-sm"
              placeholder="Escribe una respuesta..."
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarRespuesta()}
              disabled={cerrada || mode === "readonly"}
            />
            <Button size="sm" onClick={enviarRespuesta} disabled={cerrada || mode === "readonly" || !respuesta.trim()}><Plus className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>

      {/* Actions */}
      {!cerrada && mode === "full" && (
        <div className="flex gap-3">
          <ConfirmDialog
            trigger={<Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Extender plazo</Button>}
            title="Extender plazo de la licitación"
            requireReason
            reasonLabel="Justificación de la extensión"
            confirmLabel="Extender 2 días"
            onConfirm={(motivo) => extenderPlazo(motivo)}
          />
          <ConfirmDialog
            trigger={<Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">Cerrar anticipadamente</Button>}
            title="Cerrar licitación anticipadamente"
            description="No se aceptarán más ofertas y se generará el cuadro comparativo con las ofertas recibidas hasta ahora."
            destructive
            confirmLabel="Cerrar licitación"
            onConfirm={cerrarAnticipadamente}
          />
        </div>
      )}
    </div>
  );
}
