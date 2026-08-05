import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Check, Clock, Circle, ArrowLeft, MessageSquare, Paperclip, User } from "lucide-react";
import { cn } from "@/lib/utils";

const etapas = [
  { label: "Creado", fecha: "2024-07-20", done: true },
  { label: "Aprobado", fecha: "2024-07-21", done: true },
  { label: "Shortlist definida", fecha: "2024-07-23", done: true },
  { label: "En Licitación", fecha: "2024-07-25", done: true, active: true },
  { label: "En Negociación", fecha: null, done: false },
  { label: "Adjudicado", fecha: null, done: false },
  { label: "PO Emitida", fecha: null, done: false },
  { label: "En Cumplimiento", fecha: null, done: false },
  { label: "Cerrado", fecha: null, done: false },
];

const actividades = [
  { tipo: "system", texto: "CloudSphere envió su oferta", tiempo: "Hace 15 min" },
  { tipo: "comment", texto: "Carlos: Revisar plazos de entrega", tiempo: "Hace 2 h" },
  { tipo: "system", texto: "NovaTech Consulting completó el Q&A", tiempo: "Hace 5 h" },
  { tipo: "system", texto: "8 proveedores invitados", tiempo: "Hace 2 días" },
  { tipo: "comment", texto: "Ana (Consultora): Sugiero ampliar plazo 3 días", tiempo: "Hace 2 días" },
];

export function DetalleRequerimiento() {
  const { id } = useParams();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link to="/cliente/requerimientos">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{id ?? "RFP-2024-0032"}</h1>
            <StatusBadge estado="en_licitacion" />
          </div>
          <p className="text-sm text-muted-foreground">Servicios de nube y migración AWS</p>
        </div>
        <Link to={`/cliente/requerimientos/${id}/shortlist`}>
          <Button variant="outline">Ver Shortlist</Button>
        </Link>
        <Link to={`/cliente/licitaciones/${id}/comparativo`}>
          <Button className="gradient-brand text-white">Ver Comparativo</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-6 font-semibold">Línea de tiempo del proceso</h2>
            <div className="relative space-y-6">
              {etapas.map((etapa, i) => (
                <div key={i} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                      etapa.done && !etapa.active ? "border-success bg-success text-success-foreground" :
                      etapa.active ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20" :
                      "border-border bg-muted text-muted-foreground"
                    )}>
                      {etapa.done && !etapa.active ? <Check className="h-4 w-4" /> : etapa.active ? <Clock className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                    </div>
                    {i < etapas.length - 1 && (
                      <div className={cn("mt-1 h-12 w-0.5", etapa.done ? "bg-success" : "bg-border")} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className={cn("text-sm font-medium", etapa.active && "text-primary")}>{etapa.label}</p>
                    {etapa.fecha && <p className="text-xs text-muted-foreground">{etapa.fecha}</p>}
                    {etapa.active && <p className="mt-1 text-xs text-primary">En progreso — 5 de 8 ofertas recibidas</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div className="mt-8 border-t pt-6">
              <h3 className="mb-4 font-semibold text-sm">Actividad y comentarios</h3>
              <div className="space-y-4">
                {actividades.map((act, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      act.tipo === "system" ? "bg-muted" : "bg-primary/10 text-primary"
                    )}>
                      {act.tipo === "system" ? <Circle className="h-3 w-3" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className="text-sm">{act.texto}</p>
                      <p className="text-xs text-muted-foreground">{act.tiempo}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Escribe un comentario..." />
                <Button size="sm">Enviar</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-sm">Detalles del requerimiento</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Categoría", "Tecnología"],
                ["Presupuesto", "$185,000"],
                ["Fecha límite", "2024-08-12"],
                ["Proveedores", "8 invitados"],
                ["Ofertas recibidas", "5"],
                ["Solicitante", "Carlos Méndez"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-sm">Consultor asignado</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">AC</div>
              <div>
                <p className="text-sm font-medium">Ana Consultora</p>
                <p className="text-xs text-muted-foreground">Sourcing Expert</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              <MessageSquare className="mr-2 h-3.5 w-3.5" /> Contactar
            </Button>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-sm">Documentos</h3>
            <div className="space-y-2">
              {["RFP-0032.pdf", "Specs_tecnicas.docx", "Matriz_criterios.xlsx"].map((doc) => (
                <div key={doc} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:bg-muted/30 cursor-pointer">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{doc}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
