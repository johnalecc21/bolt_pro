import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { proveedores } from "@/lib/mockData";
import { ArrowLeft, UserPlus, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShortlistProveedores() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selected, setSelected] = useState<string[]>(["P-001", "P-004", "P-007", "P-010", "P-008", "P-012"]);
  const [showModal, setShowModal] = useState(false);

  const toggle = (pid: string) => {
    setSelected((prev) => prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]);
  };

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
          onClick={() => navigate(`/cliente/licitaciones/${id}`)}
          disabled={selected.length < 3}
          className="gradient-brand text-white"
        >
          <Check className="mr-2 h-4 w-4" /> Confirmar y enviar invitaciones
        </Button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">Invitar proveedor externo</h2>
            <p className="mb-4 text-sm text-muted-foreground">Si el proveedor no está en la red, entrará a homologación exprés.</p>
            <div className="space-y-3">
              <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nombre de la empresa" />
              <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Email de contacto" />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={() => setShowModal(false)} className="gradient-brand text-white">Enviar invitación</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
