import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Scale, Paperclip, Gavel } from "lucide-react";
import { disputas as seedDisputas } from "@/lib/mockData";
import { logAudit } from "@/lib/mock/auditLog";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { useMockLoading } from "@/hooks/useMockLoading";
import { TableSkeleton } from "@/components/shared/TableSkeleton";

const plantillas = [
  "El proveedor cumple parcialmente — se acuerda extensión de plazo sin penalidad.",
  "Incumplimiento comprobado — se aplica penalidad contractual según cláusula 8.",
  "Desacuerdo resuelto por mutuo acuerdo entre las partes.",
];

export function MediacionDisputas() {
  const { currentUser } = useAuth();
  const loading = useMockLoading();
  const [disputas, setDisputas] = useState(seedDisputas.map((d) => ({ ...d, mediador: d.mediador === "Sin asignar" ? currentUser?.nombre ?? "Sin asignar" : d.mediador })));
  const [selected, setSelected] = useState<string | null>(disputas[0]?.id ?? null);
  const [decision, setDecision] = useState("");
  const [impacto, setImpacto] = useState<"positivo" | "negativo">("positivo");

  const activa = disputas.find((d) => d.id === selected);

  function resolver() {
    if (!activa || !decision.trim()) return;
    setDisputas((prev) => prev.map((d) => d.id === activa.id ? { ...d, estado: "Resuelta" } : d));
    logAudit({
      usuario: currentUser?.nombre ?? "—", accion: "Disputa resuelta",
      detalle: `${activa.id} — ${activa.proveedor}`, motivo: `${decision.trim()} (impacto en score: ${impacto})`,
    });
    toast.success("Caso resuelto", { description: `Impacto ${impacto} aplicado al score de ${activa.proveedor}.` });
    setDecision("");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Mediación de Disputas</h1>
        <p className="text-sm text-muted-foreground">Vista interna con herramientas de mediador</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          {loading ? <TableSkeleton rows={3} /> : disputas.length === 0 ? <EmptyState icon={Scale} title="Sin casos" /> : disputas.map((d) => (
            <Card key={d.id} onClick={() => setSelected(d.id)} className={cn("cursor-pointer p-4 hover:border-primary/40", selected === d.id && "ring-2 ring-primary")}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{d.id}</span>
                <StatusBadge estado={d.estado} />
              </div>
              <p className="mt-1 text-sm font-medium">{d.proveedor}</p>
              <p className="text-xs text-muted-foreground">{d.poReferencia} · {d.severidad} · {d.diasAbierta}d</p>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {activa ? (
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="font-semibold">{activa.id} — {activa.proveedor}</h2>
                  <p className="text-sm text-muted-foreground">{activa.poReferencia} · Mediador: {activa.mediador}</p>
                </div>
                <StatusBadge estado={activa.estado} />
              </div>

              <div className="mb-4 space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium"><Paperclip className="h-3.5 w-3.5" /> Evidencia del proceso original</p>
                <p className="text-muted-foreground">Ofertas presentadas, acta de negociación, condiciones pactadas en el contrato — disponibles como referencia para la resolución.</p>
              </div>

              {activa.estado === "Resuelta" ? (
                <div className="rounded-lg bg-success/10 p-4 text-sm text-success">Caso resuelto y cerrado.</div>
              ) : (
                <>
                  <p className="mb-2 text-sm font-medium">Plantillas de resolución</p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {plantillas.map((p, i) => (
                      <button key={i} onClick={() => setDecision(p)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:bg-primary/5">
                        Plantilla {i + 1}
                      </button>
                    ))}
                  </div>
                  <Textarea rows={4} placeholder="Escribe la decisión final..." value={decision} onChange={(e) => setDecision(e.target.value)} />
                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Impacto en score del proveedor:</span>
                    <label className="flex items-center gap-1.5 text-sm"><input type="radio" checked={impacto === "positivo"} onChange={() => setImpacto("positivo")} /> Positivo</label>
                    <label className="flex items-center gap-1.5 text-sm"><input type="radio" checked={impacto === "negativo"} onChange={() => setImpacto("negativo")} /> Negativo</label>
                  </div>
                  <ConfirmDialog
                    trigger={<Button className="mt-4 gap-2 gradient-brand text-white" disabled={!decision.trim()}><Gavel className="h-4 w-4" /> Registrar decisión final</Button>}
                    title="Registrar decisión de mediación"
                    description="El caso se marcará como resuelto y el impacto se aplicará al score del proveedor."
                    confirmLabel="Confirmar decisión"
                    onConfirm={resolver}
                  />
                </>
              )}
            </Card>
          ) : (
            <EmptyState icon={Scale} title="Selecciona un caso" />
          )}
        </div>
      </div>
    </div>
  );
}
