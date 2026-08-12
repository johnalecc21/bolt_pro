import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileEdit, Sparkles, Send, History } from "lucide-react";
import { generateId } from "@/lib/mock/simulate";
import { logAudit } from "@/lib/mock/auditLog";
import { useAuth } from "@/lib/auth/AuthContext";

const plantillas = ["TI · Migración cloud", "Materia Prima · Embalaje", "Servicios Generales · Limpieza", "Logística · Flota"];

const comparablesHistoricos = [
  { id: "RFP-2024-0021", titulo: "Infraestructura cloud (proceso similar)", precio: "$168,000", proveedorGanador: "NovaTech Consulting" },
  { id: "RFP-2023-0087", titulo: "Consultoría de seguridad TI", precio: "$67,000", proveedorGanador: "AuditTrust Asociados" },
];

const criteriosSugeridos = ["Precio total (40%)", "Plazo de entrega (25%)", "Calidad / certificaciones (20%)", "Condiciones de pago (15%)"];

export function AsistenteRFP() {
  const { currentUser } = useAuth();
  const [plantilla, setPlantilla] = useState(plantillas[0]);
  const [contenido, setContenido] = useState("");
  const [cliente, setCliente] = useState("Acme S.A.");

  function enviarParaValidacion() {
    const id = generateId("RFP");
    logAudit({ usuario: currentUser?.nombre ?? "—", accion: "RFP enviado a validación del cliente", detalle: `${id} → ${cliente}` });
    toast.success("RFP enviado al cliente para validación", { description: id });
    setContenido("");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Asistente de Redacción de RFP</h1>
        <p className="text-sm text-muted-foreground">Estructura un RFP profesional cuando el cliente necesita apoyo experto</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <input className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm" value={cliente} onChange={(e) => setCliente(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Plantilla por industria/categoría</Label>
                <select className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm" value={plantilla} onChange={(e) => setPlantilla(e.target.value)}>
                  {plantillas.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Contenido del RFP</Label>
                <Button
                  size="sm" variant="outline" className="gap-1.5"
                  onClick={() => setContenido((prev) => `${prev}${prev ? "\n\n" : ""}[Plantilla: ${plantilla}]\nAlcance, especificaciones técnicas, cronograma y condiciones comerciales sugeridas según procesos exitosos anteriores.`)}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Usar plantilla
                </Button>
              </div>
              <Textarea rows={10} value={contenido} onChange={(e) => setContenido(e.target.value)} placeholder="Redacta o genera el contenido del RFP..." />
            </div>
            <ConfirmDialog
              trigger={<Button className="mt-4 gap-2" disabled={!contenido.trim()}><Send className="h-4 w-4" /> Enviar al cliente para validación</Button>}
              title="Enviar RFP al cliente"
              description={`El RFP aparecerá en el portal de ${cliente} para su aprobación final antes de publicarse.`}
              confirmLabel="Enviar"
              onConfirm={enviarParaValidacion}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><History className="h-4 w-4" /> Comparables históricos</h2>
            <div className="space-y-2">
              {comparablesHistoricos.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground">{c.id} · Ganó {c.proveedorGanador} · {c.precio}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><FileEdit className="h-4 w-4" /> Criterios sugeridos</h2>
            <div className="flex flex-wrap gap-1.5">
              {criteriosSugeridos.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Basado en RFPs exitosos previos de categorías similares.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
