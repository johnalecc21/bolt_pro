import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTADO_EVENTO_LABEL, fetchEstadoErp, type EstadoDocumentoErp, type EstadoEventoErp, type TipoEventoErp } from "@/lib/api/integraciones";

const ESTILO: Record<EstadoEventoErp, { icon: typeof Clock; clase: string }> = {
  PENDIENTE: { icon: Clock, clase: "bg-muted text-muted-foreground" },
  ENVIADO: { icon: CheckCircle2, clase: "bg-success/15 text-success" },
  ERROR: { icon: RefreshCw, clase: "bg-warning/15 text-warning-foreground" },
  FALLIDO: { icon: AlertTriangle, clase: "bg-destructive/10 text-destructive" },
  DESCARTADO: { icon: XCircle, clase: "bg-muted text-muted-foreground" },
};

/** Sync state as icon + words (never color alone). */
export function EstadoErpBadge({ estado }: { estado: EstadoEventoErp }) {
  const e = ESTILO[estado];
  return (
    <Badge variant="secondary" className={cn("gap-1 whitespace-nowrap font-medium", e.clase)}>
      <e.icon className="h-3 w-3" aria-hidden="true" /> {ESTADO_EVENTO_LABEL[estado]}
    </Badge>
  );
}

/** Sync state of a few documents; empty when the company has no integration. */
export function useEstadoErp(ids: string[]) {
  const [estados, setEstados] = useState<EstadoDocumentoErp[]>([]);
  const clave = ids.join(",");
  useEffect(() => {
    let vivo = true;
    fetchEstadoErp(clave ? clave.split(",") : [])
      .then((r) => vivo && setEstados(r))
      .catch(() => vivo && setEstados([]));
    return () => {
      vivo = false;
    };
  }, [clave]);
  return (id: string, tipo: TipoEventoErp) => estados.find((e) => e.entidadId === id && e.tipo === tipo) ?? null;
}

/** One-line "ERP: …" for a document header. */
export function LineaErp({ estado, sistema = "ERP" }: { estado: EstadoDocumentoErp | null; sistema?: string }) {
  if (!estado) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {sistema}: <EstadoErpBadge estado={estado.estado} />
      {estado.idExterno && <code>{estado.idExterno}</code>}
      {estado.ultimoError && (estado.estado === "ERROR" || estado.estado === "FALLIDO") && <span className="text-destructive">{estado.ultimoError.slice(0, 120)}</span>}
    </span>
  );
}
