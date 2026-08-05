import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { proveedores as seedProveedores, type Proveedor } from "@/lib/mockData";
import { generateId } from "@/lib/mock/simulate";
import { ArrowLeft, UserPlus, Check, AlertCircle } from "lucide-react";

const PALETTE = ["oklch(0.60 0.22 280)", "oklch(0.60 0.18 155)", "oklch(0.70 0.18 68)", "oklch(0.65 0.20 200)"];

export function ShortlistProveedores() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [proveedores, setProveedores] = useState<Proveedor[]>(seedProveedores);
  const [selected, setSelected] = useState<string[]>(["P-001", "P-004", "P-007", "P-010", "P-008", "P-012"]);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  const toggle = (pid: string) => {
    setSelected((prev) => prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]);
  };

  function agregarExterno() {
    if (!nombre.trim() || !email.trim()) return;
    const id = generateId("P");
    const iniciales = nombre.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
    const nuevo: Proveedor = {
      id, nombre: nombre.trim(), iniciales, categorias: ["Pendiente de homologación"], score: 0,
      ubicacion: "Por confirmar", certificaciones: [], procesosGanados: 0, entregasATiempo: 0, disputas: 0,
      color: PALETTE[proveedores.length % PALETTE.length],
    };
    setProveedores((prev) => [nuevo, ...prev]);
    setSelected((prev) => [...prev, id]);
    setShowModal(false);
    setNombre("");
    setEmail("");
    toast.success("Proveedor agregado a la homologación exprés", { description: `${nuevo.nombre} — se le invitará una vez validado.` });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Shortlist de Proveedores</h1>
          <p className="text-sm text-muted-foreground">{id ?? "RFP-2024-0032"} — Servicios de nube y migración AWS</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{selected.length} seleccionados</span>
          <span className="text-sm text-muted-foreground">· Mínimo recomendado: 3</span>
          {selected.length < 3 && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> Selecciona al menos 3
            </span>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Agregar proveedor externo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {proveedores.map((p) => (
          <ProviderCard
            key={p.id}
            proveedor={p}
            selectable
            selected={selected.includes(p.id)}
            onSelect={() => toggle(p.id)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between rounded-xl border border-border bg-background/80 p-4 backdrop-blur-md">
        <p className="text-sm text-muted-foreground">
          {selected.length >= 3 ? "Listo para enviar invitaciones" : "Selecciona al menos 3 proveedores"}
        </p>
        <Button
          onClick={() => {
            toast.success("Invitaciones enviadas", { description: `${selected.length} proveedores invitados a licitar.` });
            navigate(`/cliente/licitaciones/${id}`);
          }}
          disabled={selected.length < 3}
          className="gradient-brand text-white"
        >
          <Check className="mr-2 h-4 w-4" /> Confirmar y enviar invitaciones
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">Invitar proveedor externo</h2>
            <p className="mb-4 text-sm text-muted-foreground">Si el proveedor no está en la red, entrará a homologación exprés.</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ext-nombre">Nombre de la empresa</Label>
                <input id="ext-nombre" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ext-email">Email de contacto</Label>
                <input id="ext-email" type="email" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={agregarExterno} disabled={!nombre.trim() || !email.trim()} className="gradient-brand text-white">Enviar invitación</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
