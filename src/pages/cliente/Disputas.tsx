import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { type Disputa } from "@/lib/types";
import { fetchDisputas, fetchDisputa, crearDisputa, enviarMensajeDisputa } from "@/lib/api/disputas";
import { apiErrorMessage } from "@/lib/api/http";
import { Scale, Plus, Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

const severidadColor: Record<Disputa["severidad"], string> = {
  Baja: "bg-info/15 text-info",
  Media: "bg-warning/15 text-warning-foreground",
  Alta: "bg-destructive/15 text-destructive",
};

const SEVERIDAD_API: Record<Disputa["severidad"], "BAJA" | "MEDIA" | "ALTA"> = {
  Baja: "BAJA", Media: "MEDIA", Alta: "ALTA",
};

export function Disputas() {
  const [searchParams] = useSearchParams();
  const { data: disputas, loading, reload } = useApiData(fetchDisputas);
  const [selected, setSelected] = useState<string | null>(null);
  const { data: activaDetalle, reload: reloadDetalle } = useApiData(
    () => (selected ? fetchDisputa(selected) : Promise.resolve(null)),
    [selected],
  );
  const [showForm, setShowForm] = useState(!!searchParams.get("po"));
  const [poReferencia, setPoReferencia] = useState(searchParams.get("po") ?? "");
  const [descripcion, setDescripcion] = useState("");
  const [severidad, setSeveridad] = useState<Disputa["severidad"]>("Media");
  const [mensaje, setMensaje] = useState("");

  const activa = activaDetalle;

  async function abrirCaso() {
    if (!poReferencia.trim() || !descripcion.trim()) return;
    try {
      const nueva = await crearDisputa({ poReferencia: poReferencia.trim(), severidad: SEVERIDAD_API[severidad], descripcion: descripcion.trim() });
      toast.success("Caso de disputa abierto", { description: nueva.id });
      setShowForm(false);
      setPoReferencia("");
      setDescripcion("");
      setSelected(nueva.id);
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function enviarMensaje() {
    if (!activa || !mensaje.trim()) return;
    try {
      await enviarMensajeDisputa(activa.id, mensaje.trim());
      setMensaje("");
      reloadDetalle();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Disputas</h1>
          <p className="text-sm text-muted-foreground">Formaliza y da seguimiento a desacuerdos con proveedores</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Abrir caso
        </Button>
      </div>

      {showForm && (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Nuevo caso de disputa</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>PO / Contrato de referencia</Label>
              <Input value={poReferencia} onChange={(e) => setPoReferencia(e.target.value)} placeholder="PO-2024-0036" />
            </div>
            <div className="space-y-1.5">
              <Label>Severidad</Label>
              <select className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm" value={severidad} onChange={(e) => setSeveridad(e.target.value as Disputa["severidad"])}>
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label>Descripción del desacuerdo</Label>
            <Textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe el incumplimiento o desacuerdo..." />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={abrirCaso} disabled={!poReferencia.trim() || !descripcion.trim()}>Abrir caso</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          {loading ? <TableSkeleton rows={3} /> : (disputas ?? []).length === 0 ? (
            <EmptyState icon={Scale} title="Sin disputas abiertas" />
          ) : (disputas ?? []).map((d) => (
            <Card
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={cn("cursor-pointer p-4 transition-all hover:border-primary/40", selected === d.id && "ring-2 ring-primary")}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{d.id}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", severidadColor[d.severidad])}>{d.severidad}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{d.proveedor}</p>
              <p className="text-xs text-muted-foreground">{d.poReferencia} · {d.diasAbierta}d abierta</p>
              <div className="mt-2"><StatusBadge estado={d.estado} /></div>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {activa ? (
            <Card className="flex h-full flex-col p-5">
              <div className="mb-4 flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="font-semibold">{activa.id} — {activa.proveedor}</h2>
                  <p className="text-sm text-muted-foreground">{activa.poReferencia} · Mediador: {activa.mediador}</p>
                </div>
                <StatusBadge estado={activa.estado} />
              </div>

              <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" /> Evidencia adjunta automáticamente: ofertas originales, acta de negociación, condiciones pactadas.
              </div>

              <div className="flex-1 space-y-3">
                {activa.mensajes.map((m) => (
                  <div key={m.id} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium">{m.autor}</p>
                    <p className="text-muted-foreground">{m.texto}</p>
                  </div>
                ))}
                {activa.estado === "Resuelta" && (
                  <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
                    Caso resuelto. Este resultado impacta positivamente el score de {activa.proveedor}.
                  </div>
                )}
              </div>

              {activa.estado !== "Resuelta" && (
                <div className="mt-4 flex gap-2 border-t pt-4">
                  <Input placeholder="Escribe un mensaje de mediación..." value={mensaje} onChange={(e) => setMensaje(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarMensaje()} />
                  <Button size="icon" onClick={enviarMensaje} disabled={!mensaje.trim()}><Send className="h-4 w-4" /></Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex h-full items-center justify-center p-10">
              <EmptyState icon={Scale} title="Selecciona un caso" description="Elige un caso de la lista para ver el hilo de mediación." />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
