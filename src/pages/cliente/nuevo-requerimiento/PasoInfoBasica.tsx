import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopilotoPanel } from "@/components/shared/CopilotoPanel";
import { Sparkles, AlertCircle } from "lucide-react";

interface PasoInfoBasicaProps {
  titulo: string;
  onTituloChange: (value: string) => void;
  descripcion: string;
  onDescripcionChange: (value: string) => void;
  categoria: string;
  onCategoriaChange: (value: string) => void;
  esCatalogo: boolean;
}

export function PasoInfoBasica({ titulo, onTituloChange, descripcion, onDescripcionChange, categoria, onCategoriaChange, esCatalogo }: PasoInfoBasicaProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">¿Qué necesitas?</h2>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input placeholder="Ej: Servicios de nube y migración AWS" value={titulo} onChange={(e) => onTituloChange(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Descripción del requerimiento</Label>
        <div className="relative">
          <Textarea
            placeholder="Ej: Servicios de migración a la nube para 15 servidores..."
            rows={4}
            value={descripcion}
            onChange={(e) => onDescripcionChange(e.target.value)}
          />
          <CopilotoPanel
            context="nuevo-requerimiento"
            onInsert={(text) => onDescripcionChange(descripcion ? `${descripcion}\n\n${text}` : text)}
            trigger={
              <Button size="sm" variant="outline" className="absolute bottom-2 right-2 gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Ayuda con IA
              </Button>
            }
          />
        </div>
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
          <select className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
            <option>Normal</option>
            <option>Alta</option>
            <option>Urgente</option>
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
