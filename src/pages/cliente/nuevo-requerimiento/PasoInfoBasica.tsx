import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import type { Prioridad } from "@/lib/types";

interface PasoInfoBasicaProps {
  titulo: string;
  onTituloChange: (value: string) => void;
  descripcion: string;
  onDescripcionChange: (value: string) => void;
  categoria: string;
  onCategoriaChange: (value: string) => void;
  prioridad: Prioridad;
  onPrioridadChange: (value: Prioridad) => void;
  esCatalogo: boolean;
}

export function PasoInfoBasica({ titulo, onTituloChange, descripcion, onDescripcionChange, categoria, onCategoriaChange, prioridad, onPrioridadChange, esCatalogo }: PasoInfoBasicaProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">¿Qué necesitas?</h2>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input placeholder="Ej: Servicios de nube y migración AWS" value={titulo} onChange={(e) => onTituloChange(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Descripción del requerimiento</Label>
        <Textarea
          placeholder="Ej: Servicios de migración a la nube para 15 servidores..."
          rows={4}
          value={descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <select className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm" value={categoria} onChange={(e) => onCategoriaChange(e.target.value)}>
            <option>Tecnología</option>
            <option>Servicios Generales</option>
            <option>Materia Prima</option>
            <option>Logística</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Prioridad</Label>
          <select
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
            value={prioridad}
            onChange={(e) => onPrioridadChange(e.target.value as Prioridad)}
          >
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
      </div>
      {esCatalogo && (
        <div className="flex items-start gap-2 rounded-lg bg-info/10 p-3 text-sm text-info">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p><strong>{categoria}</strong> es una categoría recurrente de bajo riesgo — puedes usar <strong>catálogo directo con proveedor preferido</strong> y saltarte la licitación completa.</p>
        </div>
      )}
    </div>
  );
}
