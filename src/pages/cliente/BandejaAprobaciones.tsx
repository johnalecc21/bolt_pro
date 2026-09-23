import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { type Aprobacion } from "@/lib/types";
import { fetchAprobaciones, aprobarSolicitud, rechazarSolicitud } from "@/lib/api/aprobaciones";
import { apiErrorMessage } from "@/lib/api/http";
import { Check, X, Clock, AlertTriangle, FileText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

import { formatMoney } from "@/lib/moneda";
const tabs = ["Todos", "Urgentes", "Licitaciones", "Adjudicaciones", "Excepciones"] as const;

function matchesTab(item: Aprobacion, tab: (typeof tabs)[number]) {
  switch (tab) {
    case "Urgentes": return item.urgente;
    case "Licitaciones": return item.tipo === "Salida a licitación";
    case "Adjudicaciones": return item.tipo === "Adjudicación";
    case "Excepciones": return item.tipo === "Excepción de presupuesto";
    default: return true;
  }
}

export function BandejaAprobaciones() {
  const { data: items, loading, reload } = useApiData(fetchAprobaciones);
  const [resolvedToday, setResolvedToday] = useState({ aprobados: 0, rechazados: 0 });
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Todos");
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const filtered = (items ?? []).filter((item) => matchesTab(item, activeTab));

  // Coming from a notification click: make sure the specific request is
  // actually visible (switch off any tab filter that would hide it) and
  // scroll straight to it instead of making the user hunt for it.
  useEffect(() => {
    if (!highlightId || !items) return;
    const target = items.find((i) => i.id === highlightId);
    if (!target) return;
    if (!matchesTab(target, activeTab)) {
      setActiveTab("Todos");
      return;
    }
    document.getElementById(`aprobacion-${highlightId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, items, activeTab]);

  async function handleApprove(item: Aprobacion) {
    try {
      await aprobarSolicitud(item.id);
      setResolvedToday((prev) => ({ ...prev, aprobados: prev.aprobados + 1 }));
      toast.success("Solicitud aprobada", { description: item.descripcion });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleReject(item: Aprobacion, reason?: string) {
    try {
      await rechazarSolicitud(item.id, reason ?? "");
      setResolvedToday((prev) => ({ ...prev, rechazados: prev.rechazados + 1 }));
      toast.info("Solicitud rechazada", { description: "El solicitante fue notificado con tu justificación." });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const stats = [
    { label: "Pendientes", value: (items ?? []).length, color: "text-warning-foreground" },
    { label: "Aprobados hoy", value: resolvedToday.aprobados, color: "text-success" },
    { label: "Rechazados hoy", value: resolvedToday.rechazados, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Bandeja de Aprobaciones</h1>
        <p className="text-sm text-muted-foreground">Gestiona todo lo que requiere tu firma</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? <TableSkeleton /> :
      <div className="space-y-3">
        {filtered.length === 0 && (
          <EmptyState icon={ShieldCheck} title="No hay solicitudes en esta vista" description="Cuando haya nuevas solicitudes que requieran tu firma, aparecerán aquí." />
        )}
        {filtered.map((item) => (
          <Card
            key={item.id}
            id={`aprobacion-${item.id}`}
            className={cn(
              "p-4 transition-shadow",
              item.urgente && "border-warning/40 bg-warning/5",
              item.id === highlightId && "ring-2 ring-primary",
            )}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                item.tipo === "Adjudicación" ? "bg-primary/10 text-primary" :
                item.tipo === "Salida a licitación" ? "bg-info/10 text-info" :
                "bg-warning/10 text-warning-foreground"
              )}>
                {item.tipo === "Adjudicación" ? <Check className="h-5 w-5" /> :
                 item.tipo === "Salida a licitación" ? <FileText className="h-5 w-5" /> :
                 <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.tipo}</span>
                  {item.urgente && <Badge className="bg-destructive text-destructive-foreground text-[10px]">URGENTE</Badge>}
                  {item.totalPasos && item.totalPasos > 1 && (
                    <Badge className="bg-info/15 text-info text-[10px]">Paso {item.pasoActual} de {item.totalPasos}</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm">{item.descripcion}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Solicitado por {item.solicitante}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.fecha}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatMoney(item.monto, item.moneda)}</p>
              </div>
              <div className="flex gap-2">
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                      <X className="h-4 w-4" /> Rechazar
                    </Button>
                  }
                  title="Rechazar solicitud"
                  description="La justificación es obligatoria y será visible para el solicitante."
                  confirmLabel="Confirmar rechazo"
                  destructive
                  requireReason
                  onConfirm={(reason) => handleReject(item, reason)}
                />
                <ConfirmDialog
                  trigger={
                    <Button size="sm" className="gradient-success text-white">
                      <Check className="h-4 w-4" /> Aprobar
                    </Button>
                  }
                  title="Aprobar solicitud"
                  description={`Vas a aprobar: "${item.descripcion}". Esta acción queda registrada en el log de auditoría.`}
                  confirmLabel="Aprobar"
                  onConfirm={() => handleApprove(item)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>}
    </div>
  );
}
