import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, Circle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EstadoReq } from "@/lib/types";
import type { RequerimientoDetalle } from "@/lib/api/requerimientos";

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

interface ProcesoTimelineProps {
  req: RequerimientoDetalle;
  comentario: string;
  onComentarioChange: (value: string) => void;
  onEnviarComentario: () => void;
  sending: boolean;
}

export function ProcesoTimeline({ req, comentario, onComentarioChange, onEnviarComentario, sending }: ProcesoTimelineProps) {
  const currentIdx = ETAPA_ORDER.indexOf(req.estado);

  return (
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
            className="flex-1 rounded-md border border-input bg-white px-3 py-2 text-sm"
            placeholder="Escribe un comentario..."
            value={comentario}
            onChange={(e) => onComentarioChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onEnviarComentario()}
          />
          <Button size="sm" onClick={onEnviarComentario} disabled={!comentario.trim() || sending}>Enviar</Button>
        </div>
      </div>
    </Card>
  );
}
