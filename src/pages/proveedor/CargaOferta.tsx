import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileText, Send, CheckCircle2 } from "lucide-react";
import { ofertaEnCurso, preguntasRFP } from "@/lib/mock/ofertasEstructuradas";

export function CargaOferta() {
  const [oferta, setOferta] = useState(ofertaEnCurso);
  const [preguntas, setPreguntas] = useState(preguntasRFP);
  const [pregunta, setPregunta] = useState("");

  const camposCompletos = oferta.precioTotal > 0 && oferta.plazoEntregaDias > 0;

  function enviarOferta() {
    setOferta((prev) => ({ ...prev, enviada: true }));
    toast.success("Oferta enviada", { description: "No podrás editarla salvo que se habilite una nueva ventana." });
  }

  function enviarPregunta() {
    if (!pregunta.trim()) return;
    setPreguntas((prev) => [...prev, { autor: "Tú", pregunta: pregunta.trim(), respuesta: "" }]);
    setPregunta("");
    toast.info("Pregunta enviada al comprador");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">RFP-2024-0040 — Detalle y carga de oferta</h1>
        <p className="text-sm text-muted-foreground">Cliente anonimizado · Categoría: TI · Software</p>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" /> Especificaciones del RFP</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Se requiere una plataforma de gestión documental con integración a Microsoft 365, soporte para 200 usuarios concurrentes, y SLA de disponibilidad del 99.5%.</p>
          <p>Fecha límite de recepción de ofertas: <strong className="text-foreground">2024-08-22</strong></p>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Preguntas y respuestas</h2>
        <div className="space-y-3">
          {preguntas.map((qa, i) => (
            <div key={i} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{qa.pregunta}</p>
              <p className="text-muted-foreground">{qa.respuesta || "Pendiente de respuesta del comprador."}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">— {qa.autor}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input placeholder="Haz una pregunta sobre este RFP..." value={pregunta} onChange={(e) => setPregunta(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarPregunta()} disabled={oferta.enviada} />
          <Button size="icon" onClick={enviarPregunta} disabled={!pregunta.trim() || oferta.enviada}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Formulario estandarizado de oferta</h2>
        {oferta.enviada ? (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-sm text-success">
            <CheckCircle2 className="h-5 w-5" /> Tu oferta fue enviada y está en revisión. Ya no es editable.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Precio unitario (USD)</Label>
                <Input type="number" value={oferta.precioUnitario || ""} onChange={(e) => setOferta((p) => ({ ...p, precioUnitario: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Precio total (USD)</Label>
                <Input type="number" value={oferta.precioTotal || ""} onChange={(e) => setOferta((p) => ({ ...p, precioTotal: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Plazo de entrega (días)</Label>
                <Input type="number" value={oferta.plazoEntregaDias} onChange={(e) => setOferta((p) => ({ ...p, plazoEntregaDias: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Condiciones de pago (días)</Label>
                <Input type="number" value={oferta.condicionesPagoDias} onChange={(e) => setOferta((p) => ({ ...p, condicionesPagoDias: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Garantía (meses)</Label>
                <Input type="number" value={oferta.garantiaMeses} onChange={(e) => setOferta((p) => ({ ...p, garantiaMeses: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Vigencia de la oferta (días)</Label>
                <Input type="number" value={oferta.vigenciaOfertaDias} onChange={(e) => setOferta((p) => ({ ...p, vigenciaOfertaDias: Number(e.target.value) }))} />
              </div>
            </div>
            <ConfirmDialog
              trigger={<Button className="mt-6 gradient-brand text-white gap-2" disabled={!camposCompletos}><Send className="h-4 w-4" /> Enviar oferta</Button>}
              title="Enviar oferta"
              description="Una vez enviada, no podrás editarla salvo que el comprador habilite una nueva ventana. Esta es la misma estructura que verán todos los proveedores del proceso."
              confirmLabel="Enviar"
              onConfirm={enviarOferta}
            />
          </>
        )}
      </Card>
    </div>
  );
}
