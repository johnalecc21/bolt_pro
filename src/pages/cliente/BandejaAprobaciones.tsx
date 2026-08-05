import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aprobaciones } from "@/lib/mockData";
import { Check, X, Clock, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Pendientes", value: 3, color: "text-warning-foreground" },
  { label: "Aprobados hoy", value: 7, color: "text-success" },
  { label: "Rechazados", value: 1, color: "text-destructive" },
];

const tabs = ["Todos", "Urgentes", "Licitaciones", "Adjudicaciones", "Excepciones"];

export function BandejaAprobaciones() {
  const [activeTab, setActiveTab] = useState("Todos");
  const [showReject, setShowReject] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Bandeja de Aprobaciones</h1>
        <p className="text-sm text-muted-foreground">Gestiona todo lo que requiere tu firma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
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

      {/* Items */}
      <div className="space-y-3">
        {aprobaciones.map((item) => (
          <Card key={item.id} className={cn("p-4", item.urgente && "border-warning/40 bg-warning/5")}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                item.tipo === "Adjudicación" ? "bg-primary/10 text-primary" :
                item.tipo === "Salida a licitación" ? "bg-info/10 text-info" :
                "bg-warning/10 text-warning-foreground"
              )}>
                {item.tipo === "Adjudicación" ? <Check className="h-5 w-5" /> :
                 item.tipo === "Salida a licitación" ? <FileText className="h-5 w-5" /> :
                 <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.tipo}</span>
                  {item.urgente && <Badge className="bg-destructive text-destructive-foreground text-[10px]">URGENTE</Badge>}
                </div>
                <p className="mt-0.5 truncate text-sm">{item.descripcion}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Solicitado por {item.solicitante}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.fecha}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">${item.monto.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setShowReject(true)}>
                  <X className="h-4 w-4" /> Rechazar
                </Button>
                <Button size="sm" className="gradient-success text-white">
                  <Check className="h-4 w-4" /> Aprobar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowReject(false)}>
          <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-semibold">Rechazar solicitud</h2>
            <p className="mb-4 text-sm text-muted-foreground">La justificación es obligatoria y será visible para el solicitante.</p>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={4} placeholder="Motivo del rechazo..." />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => setShowReject(false)}>Confirmar rechazo</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
