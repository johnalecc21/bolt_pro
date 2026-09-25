import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Activity, CheckCircle2, Eye, FileEdit, MailQuestion, Network, Send, ThumbsUp, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api/http";
import { abrirARed, fetchTablero, type EtapaTablero, type Tablero } from "@/lib/api/red";

const CADA_MS = 15_000;

const ETAPA: Record<EtapaTablero, { label: string; icon: typeof Eye; clase: string }> = {
  SIN_ABRIR: { label: "Sin abrir", icon: MailQuestion, clase: "bg-muted text-muted-foreground" },
  VIO: { label: "Vio el requerimiento", icon: Eye, clase: "bg-info/15 text-info" },
  ACEPTO: { label: "Aceptó participar", icon: ThumbsUp, clase: "bg-info/15 text-info" },
  PREPARANDO: { label: "Preparando oferta", icon: FileEdit, clase: "bg-warning/15 text-warning-foreground" },
  OFERTA_ENVIADA: { label: "Oferta enviada", icon: CheckCircle2, clase: "bg-success/15 text-success" },
  DECLINO: { label: "Declinó", icon: XCircle, clase: "bg-destructive/10 text-destructive" },
};

/** "hace 5 min", "hace 2 h", "hace 3 d". */
function hace(iso: string, ahora: number) {
  const s = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 1000));
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86_400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86_400)} d`;
}

const hora = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

/**
 * Live view of the tender: who opened it, accepted, is preparing or sent an
 * offer, and when they last did something. Refreshes every 15 seconds while
 * the tender is open. Never shows prices.
 */
export function TableroLicitacion({ requerimientoId, abierta, puedeGestionar }: { requerimientoId: string; abierta: boolean; puedeGestionar: boolean }) {
  const [t, setT] = useState<Tablero | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    let vivo = true;
    const cargar = () =>
      fetchTablero(requerimientoId)
        .then((r) => {
          if (!vivo) return;
          setT(r);
          setAhora(Date.now());
        })
        .catch(() => undefined);
    void cargar();
    if (!abierta) return () => { vivo = false; };
    const i = setInterval(cargar, CADA_MS);
    return () => {
      vivo = false;
      clearInterval(i);
    };
  }, [requerimientoId, abierta]);

  async function cambiarRed(v: boolean) {
    setCambiando(true);
    try {
      const r = await abrirARed(requerimientoId, v);
      toast.success(v ? "Proceso abierto a la red" : "Proceso cerrado a la red", {
        description: v ? `${r.avisados} proveedor(es) homologado(s) de la categoría recibieron la convocatoria.` : "Ya no aparece en Oportunidades; quienes ya se unieron siguen participando.",
      });
      setT((prev) => (prev ? { ...prev, abiertoRed: r.abiertoRed } : prev));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setCambiando(false);
    }
  }

  if (!t) return <Card className="p-5 text-sm text-muted-foreground">Cargando el seguimiento…</Card>;
  const r = t.resumen;
  const embudo: [string, number, typeof Eye][] = [
    ["Participantes", r.participantes, Activity],
    ["Vieron", r.vieron, Eye],
    ["Aceptaron", r.aceptaron, ThumbsUp],
    ["Preparando", r.preparando, FileEdit],
    ["Enviaron oferta", r.enviaron, Send],
    ["Declinaron", r.declinaron, XCircle],
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Seguimiento de la licitación</h2>
          {abierta ? (
            <Badge variant="secondary" className="gap-1.5 bg-success/15 text-success">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              En vivo
            </Badge>
          ) : (
            <Badge variant="secondary">Cerrada</Badge>
          )}
          <span className="text-xs text-muted-foreground">Actualizado {hace(new Date(ahora).toISOString(), Date.now())}</span>
        </div>
        {puedeGestionar && abierta && (
          <label className="flex items-center gap-2 text-sm">
            <Network className="h-4 w-4 text-primary" aria-hidden="true" />
            Abierto a la red
            <Switch checked={t.abiertoRed} disabled={cambiando} onCheckedChange={cambiarRed} aria-label="Abierto a la red de proveedores" />
          </label>
        )}
        {!(puedeGestionar && abierta) && t.abiertoRed && <Badge variant="secondary" className="gap-1"><Network className="h-3 w-3" aria-hidden="true" /> Abierto a la red</Badge>}
      </div>

      <div className="grid grid-cols-3 gap-px bg-border sm:grid-cols-6">
        {embudo.map(([label, n, Icon]) => (
          <div key={label} className="bg-card p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}</p>
            <p className="text-2xl font-bold tabular-nums">{n}</p>
          </div>
        ))}
      </div>
      {(r.desdeRed > 0 || r.preguntas > 0) && (
        <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
          {r.desdeRed > 0 && `${r.desdeRed} se unieron desde la red. `}
          {r.preguntas > 0 && `${r.preguntas} pregunta(s) de proveedores.`}
        </p>
      )}

      {t.filas.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          {t.abiertoRed ? "Aún nadie participa. Los proveedores homologados de la categoría ya recibieron la convocatoria." : "Sin proveedores invitados todavía."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Proveedor</th>
                <th className="p-3 font-medium">Etapa</th>
                <th className="hidden p-3 font-medium md:table-cell">Vio</th>
                <th className="hidden p-3 font-medium md:table-cell">Respondió</th>
                <th className="hidden p-3 font-medium lg:table-cell">Oferta enviada</th>
                <th className="p-3 font-medium">Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {t.filas.map((f) => {
                const e = ETAPA[f.etapa];
                return (
                  <tr key={f.proveedorId} className="border-t border-border">
                    <td className="p-3">
                      <p className="font-medium">{f.proveedor}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.origen === "RED" ? "Se unió desde la red" : "Invitado"} · score {f.score}
                        {f.preguntas > 0 && ` · ${f.preguntas} pregunta(s)`}
                      </p>
                    </td>
                    <td className="p-3">
                      <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", e.clase)}>
                        <e.icon className="h-3 w-3" aria-hidden="true" /> {e.label}
                      </span>
                    </td>
                    <td className="hidden p-3 text-xs text-muted-foreground md:table-cell">{hora(f.vistaAt)}</td>
                    <td className="hidden p-3 text-xs text-muted-foreground md:table-cell">{hora(f.respondidaAt)}</td>
                    <td className="hidden p-3 text-xs text-muted-foreground lg:table-cell">{hora(f.enviadaAt)}</td>
                    <td className="p-3 text-xs" title={hora(f.ultimaActividad)}>{hace(f.ultimaActividad, ahora)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
