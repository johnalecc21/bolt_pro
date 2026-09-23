import { useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import { crearEvaluacion, fetchEvaluacionesContrato } from "@/lib/api/evaluaciones";
import { calcularPuntaje, CRITERIOS_EVALUACION, UMBRAL_PLAN_MEJORA, type Criterios } from "@/lib/evaluacion";

const INICIAL: Criterios = { calidad: 0, plazos: 0, servicio: 0, hse: 0 };

function Historial({ contratoId }: { contratoId: string }) {
  const { data } = useApiData(() => fetchEvaluacionesContrato(contratoId), [contratoId]);
  if (!data || data.length === 0) return null;
  return (
    <div className="space-y-1.5 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground">Evaluaciones anteriores de este contrato</p>
      {data.map((e) => (
        <div key={e.id} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {e.createdAt.slice(0, 10)} · {e.evaluador.nombre}
          </span>
          <span className={cn("font-semibold", e.requierePlanMejora ? "text-destructive" : "text-success")}>{e.puntaje}/100</span>
        </div>
      ))}
    </div>
  );
}

/** Buyer rates the proveedor on one contract — feeds its network-wide performance average. */
export function EvaluarDesempenoDialog({
  contratoId,
  codigo,
  proveedor,
  onDone,
}: {
  contratoId: string;
  codigo: string;
  proveedor: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [criterios, setCriterios] = useState<Criterios>(INICIAL);
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);
  const completo = CRITERIOS_EVALUACION.every(({ key }) => criterios[key] > 0);
  const puntaje = completo ? calcularPuntaje(criterios) : null;

  async function guardar() {
    if (!completo) return;
    setSaving(true);
    try {
      const evaluacion = await crearEvaluacion({ contratoId, ...criterios, comentario: comentario.trim() || undefined });
      toast.success("Evaluación registrada", {
        description: evaluacion.requierePlanMejora
          ? `${evaluacion.puntaje}/100 — se notificó al proveedor que debe presentar un plan de mejora.`
          : `${evaluacion.puntaje}/100 — ya cuenta en el desempeño del proveedor.`,
      });
      setOpen(false);
      setCriterios(INICIAL);
      setComentario("");
      onDone?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo registrar la evaluación."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ClipboardCheck className="h-4 w-4" /> Evaluar desempeño
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Evaluar desempeño</DialogTitle>
          <DialogDescription>
            {codigo} · {proveedor}. Califica de 1 (muy malo) a 5 (excelente).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {CRITERIOS_EVALUACION.map(({ key, label, ayuda, peso }) => (
            <div key={key}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <p className="text-sm font-medium">
                  {label} <span className="text-xs font-normal text-muted-foreground">({Math.round(peso * 100)}%)</span>
                </p>
                <p className="text-xs text-muted-foreground">{ayuda}</p>
              </div>
              <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={criterios[key] === n}
                    onClick={() => setCriterios((c) => ({ ...c, [key]: n }))}
                    className={cn(
                      "h-9 flex-1 rounded-md border text-sm font-medium transition-colors",
                      criterios[key] === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Textarea
            placeholder="Comentario (opcional): qué salió bien, qué debe mejorar"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={1000}
          />
          {puntaje !== null && (
            <div
              className={cn(
                "flex items-center justify-between rounded-lg p-3 text-sm",
                puntaje < UMBRAL_PLAN_MEJORA ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
              )}
            >
              <span className="flex items-center gap-1.5">
                {puntaje < UMBRAL_PLAN_MEJORA && <AlertTriangle className="h-4 w-4" />}
                {puntaje < UMBRAL_PLAN_MEJORA ? "Requerirá plan de mejora" : "Puntaje ponderado"}
              </span>
              <strong>{puntaje}/100</strong>
            </div>
          )}
          <Button className="w-full" onClick={guardar} disabled={!completo || saving}>
            {saving ? "Guardando..." : "Registrar evaluación"}
          </Button>
          <Historial contratoId={contratoId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
