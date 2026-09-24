import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { ItemsEditor, type ItemBorrador } from "@/pages/cliente/nuevo-requerimiento/ItemsEditor";

interface PasoEspecificacionesProps {
  requisitosTecnicos: string;
  onRequisitosTecnicosChange: (value: string) => void;
  especificaciones: { name: string; value: string }[];
  onActualizarEspecificacion: (index: number, campo: "name" | "value", valor: string) => void;
  onEliminarEspecificacion: (index: number) => void;
  onAgregarEspecificacion: () => void;
  items: ItemBorrador[];
  onItemsChange: (items: ItemBorrador[]) => void;
}

export function PasoEspecificaciones({
  requisitosTecnicos, onRequisitosTecnicosChange,
  especificaciones, onActualizarEspecificacion, onEliminarEspecificacion, onAgregarEspecificacion,
  items, onItemsChange,
}: PasoEspecificacionesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Especificaciones técnicas</h2>
      <div className="space-y-2">
        <Label>Requisitos técnicos</Label>
        <Textarea
          placeholder="Detalla las especificaciones que los proveedores deben cumplir..."
          rows={5}
          value={requisitosTecnicos}
          onChange={(e) => onRequisitosTecnicosChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Especificaciones detalladas</Label>
        <div className="space-y-2">
          {especificaciones.map((spec, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Nombre"
                value={spec.name}
                onChange={(e) => onActualizarEspecificacion(i, "name", e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Valor"
                value={spec.value}
                onChange={(e) => onActualizarEspecificacion(i, "value", e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => onEliminarEspecificacion(i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={onAgregarEspecificacion}>
            <Plus className="mr-2 h-4 w-4" /> Agregar especificación
          </Button>
        </div>
      </div>
      <div className="border-t pt-4">
        <ItemsEditor items={items} onChange={onItemsChange} />
      </div>
    </div>
  );
}
