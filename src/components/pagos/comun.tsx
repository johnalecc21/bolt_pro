import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, FileDown, FileWarning, FileX, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { fechaLocal } from "@/lib/fecha";
import { formatMoney } from "@/lib/moneda";
import { apiErrorMessage } from "@/lib/api/http";
import { ETAPA_LABEL, type EtapaPago, type Factura, type PagoPO } from "@/lib/api/pagos";

const ETAPA_ESTILO: Record<EtapaPago, { icon: typeof Clock; clase: string }> = {
  sin_factura: { icon: Receipt, clase: "bg-muted text-muted-foreground" },
  factura_rechazada: { icon: FileX, clase: "bg-destructive/10 text-destructive" },
  factura_en_revision: { icon: Clock, clase: "bg-info/10 text-info" },
  por_pagar: { icon: Clock, clase: "bg-warning/15 text-warning-foreground" },
  vencido: { icon: AlertTriangle, clase: "bg-destructive/10 text-destructive" },
  pagado: { icon: CheckCircle2, clase: "bg-success/10 text-success" },
};

/** State as icon + word, never color alone. */
export function EtapaBadge({ etapa }: { etapa: EtapaPago }) {
  const { icon: Icon, clase } = ETAPA_ESTILO[etapa];
  return (
    <Badge variant="secondary" className={cn("gap-1 whitespace-nowrap font-medium", clase)}>
      <Icon className="h-3 w-3" aria-hidden="true" /> {ETAPA_LABEL[etapa]}
    </Badge>
  );
}

export const fecha = (iso: string | null | undefined) => (iso ? fechaLocal(iso) : "—");

export async function abrirEnlace(obtener: () => Promise<{ url: string }>) {
  try {
    const { url } = await obtener();
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (err) {
    toast.error(apiErrorMessage(err, "No se pudo abrir el archivo."));
  }
}

const ESTADO_FACTURA: Record<Factura["estado"], { label: string; icon: typeof Clock; clase: string }> = {
  radicada: { label: "En revisión", icon: Clock, clase: "text-info" },
  aprobada: { label: "Aprobada", icon: CheckCircle2, clase: "text-success" },
  rechazada: { label: "Rechazada", icon: FileWarning, clase: "text-destructive" },
};

/** Every invoice filed for a payment, newest first, with how each was decided. */
export function HistorialFacturas({ pago, onDescargar }: { pago: PagoPO; onDescargar: (f: Factura) => void }) {
  if (pago.facturas.length === 0) return <p className="text-sm text-muted-foreground">Aún no se ha radicado factura.</p>;
  return (
    <ul className="space-y-2">
      {pago.facturas.map((f) => {
        const e = ESTADO_FACTURA[f.estado];
        return (
          <li key={f.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">Factura {f.numero}</p>
                <p className="text-xs text-muted-foreground">
                  Emitida {fecha(f.fechaEmision)} · radicada {fecha(f.radicada)} · {formatMoney(f.monto, pago.moneda)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1 text-xs font-medium", e.clase)}>
                  <e.icon className="h-3.5 w-3.5" aria-hidden="true" /> {e.label}
                </span>
                <Button size="sm" variant="ghost" className="gap-1" onClick={() => onDescargar(f)} aria-label={`Descargar factura ${f.numero}`}>
                  <FileDown className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{f.archivoNombre.length > 24 ? `${f.archivoNombre.slice(0, 23)}…` : f.archivoNombre}</span>
                </Button>
              </div>
            </div>
            {f.estado === "rechazada" && f.motivoRechazo && (
              <p className="mt-2 rounded bg-destructive/5 px-2 py-1 text-xs text-destructive">Motivo: {f.motivoRechazo}</p>
            )}
            {f.revisadaPor && (
              <p className="mt-1 text-xs text-muted-foreground">Revisada por {f.revisadaPor} el {fecha(f.revisadaAt)}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Dates as the input wants them (local YYYY-MM-DD). */
export const hoyISO = () => fechaLocal(new Date().toISOString());
