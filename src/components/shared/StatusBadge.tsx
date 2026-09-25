import { cn } from "@/lib/utils";

const config: Record<string, { label: string; className: string }> = {
  borrador: { label: "Borrador", className: "bg-muted text-muted-foreground border-border" },
  pendiente_aprobacion: { label: "Pendiente", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  en_licitacion: { label: "En Licitación", className: "bg-info/15 text-info border-info/30" },
  en_negociacion: { label: "En Negociación", className: "bg-primary/15 text-primary border-primary/30" },
  adjudicado: { label: "Adjudicado", className: "bg-primary/20 text-primary border-primary/40" },
  en_cumplimiento: { label: "En Cumplimiento", className: "bg-success/15 text-success border-success/30" },
  cerrado: { label: "Cerrado", className: "bg-muted text-muted-foreground border-border" },
  atrasado: { label: "Atrasado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  en_revision: { label: "En Revisión", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  Activo: { label: "Activo", className: "bg-success/15 text-success border-success/30" },
  "Por vencer": { label: "Por vencer", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  Vencido: { label: "Vencido", className: "bg-destructive/15 text-destructive border-destructive/30" },
  "En renovación": { label: "En renovación", className: "bg-info/15 text-info border-info/30" },
  Pagado: { label: "Pagado", className: "bg-success/15 text-success border-success/30" },
  "Por pagar": { label: "Por pagar", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  Terminado: { label: "Terminado", className: "bg-muted text-muted-foreground border-border" },
  Abierta: { label: "Abierta", className: "bg-destructive/15 text-destructive border-destructive/30" },
  Resuelta: { label: "Resuelta", className: "bg-success/15 text-success border-success/30" },
  Pendiente: { label: "Pendiente", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  aprobado: { label: "Aprobado", className: "bg-success/15 text-success border-success/30" },
  rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  zona_gris: { label: "Zona gris", className: "bg-warning/15 text-warning-foreground border-warning/30" },
};

export function StatusBadge({ estado, className }: { estado: string; className?: string }) {
  const c = config[estado] ?? { label: estado, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", c.className, className)}>
      {c.label}
    </span>
  );
}
