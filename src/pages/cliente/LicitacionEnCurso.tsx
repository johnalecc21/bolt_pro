import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MessageSquare, Plus, Calendar } from "lucide-react";
import { proveedores } from "@/lib/mockData";

const estadosProveedor: Record<string, string> = {
  "P-001": "Oferta enviada",
  "P-004": "Oferta enviada",
  "P-007": "Oferta enviada",
  "P-010": "Oferta enviada",
  "P-008": "Visto",
  "P-012": "Oferta enviada",
  "P-002": "Invitado",
  "P-005": "Sin respuesta",
};

const qaItems = [
  { q: "¿El servicio incluye migración de bases de datos?", a: "Sí, incluye migración completa de hasta 5 bases de datos relacionales.", autor: "Proveedor anónimo" },
  { q: "¿Qué SLA de soporte técnico ofrecen?", a: "SLA 24/7 con respuesta en menos de 2 horas para incidentes críticos.", autor: "Proveedor anónimo" },
];

export function LicitacionEnCurso() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">RFP-2024-0032</h1>
          <Badge className="bg-info/15 text-info border-info/30">Licitación Abierta</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Servicios de nube y migración AWS · Acme S.A.</p>
      </div>

      {/* Countdown */}
      <Card className="overflow-hidden">
        <div className="gradient-hero p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Tiempo restante para cierre</p>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-center">
                  <p className="text-4xl font-bold">3</p>
                  <p className="text-xs text-white/60">días</p>
                </div>
                <span className="text-3xl text-white/40">:</span>
                <div className="text-center">
                  <p className="text-4xl font-bold">14</p>
                  <p className="text-xs text-white/60">horas</p>
                </div>
                <span className="text-3xl text-white/40">:</span>
                <div className="text-center">
                  <p className="text-4xl font-bold">22</p>
                  <p className="text-xs text-white/60">min</p>
                </div>
              </div>
            </div>
            <Clock className="h-16 w-16 text-white/20" />
          </div>
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> 5 de 8 proveedores han respondido</span>
            <span className="font-medium text-success">62%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full gradient-success rounded-full" style={{ width: "62%" }} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Providers */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Estado de proveedores invitados</h2>
          <div className="space-y-2">
            {proveedores.slice(0, 8).map((p) => {
              const estado = estadosProveedor[p.id] ?? "Invitado";
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
                    <p className="text-xs text-muted-foreground">Invitado 2024-07-25</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>{estado}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Q&A */}
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4" /> Preguntas y respuestas (Q&A)
          </h2>
          <div className="space-y-4">
            {qaItems.map((qa, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{qa.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{qa.a}</p>
                <p className="mt-2 text-xs text-muted-foreground">— {qa.autor}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Escribe una respuesta..." />
            <Button size="sm"><Plus className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" /> Extender plazo
        </Button>
        <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
          Cerrar anticipadamente
        </Button>
      </div>
    </div>
  );
}
