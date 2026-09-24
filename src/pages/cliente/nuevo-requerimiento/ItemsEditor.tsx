import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListOrdered, Plus, X } from "lucide-react";

export interface ItemBorrador {
  descripcion: string;
  cantidad: string;
  unidad: string;
  /** Kept as-is when editing existing lines (not editable here). */
  especificacion?: string | null;
}

export const ITEM_VACIO: ItemBorrador = { descripcion: "", cantidad: "", unidad: "und" };

/** A row the user started but didn't finish (blank rows are simply ignored). */
export function itemIncompleto(i: ItemBorrador) {
  const algo = i.descripcion.trim() || i.cantidad.trim();
  const completo = i.descripcion.trim().length >= 2 && Number(i.cantidad) > 0 && i.unidad.trim().length > 0;
  return !!algo && !completo;
}

export function itemsValidos(items: ItemBorrador[]) {
  return items
    .filter((i) => i.descripcion.trim() && Number(i.cantidad) > 0 && i.unidad.trim())
    .map((i) => ({
      descripcion: i.descripcion.trim(),
      cantidad: Number(i.cantidad),
      unidad: i.unidad.trim(),
      ...(i.especificacion ? { especificacion: i.especificacion } : {}),
    }));
}

interface Props {
  items: ItemBorrador[];
  onChange: (items: ItemBorrador[]) => void;
}

/**
 * Optional bill of quantities. With lines, suppliers quote a unit price per
 * line and the award can be split across suppliers line by line; without
 * them the offer is a single total.
 */
export function ItemsEditor({ items, onChange }: Props) {
  const set = (i: number, campo: keyof ItemBorrador, valor: string) =>
    onChange(items.map((it, k) => (k === i ? { ...it, [campo]: valor } : it)));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ListOrdered className="h-4 w-4 text-primary" />
        <Label className="text-base">Ítems a cotizar <span className="font-normal text-muted-foreground">(opcional)</span></Label>
      </div>
      <p className="text-sm text-muted-foreground">
        Si agregas ítems, cada proveedor cotiza precio unitario por línea y podrás adjudicar cada ítem al mejor proveedor. Sin ítems, se cotiza un valor total.
      </p>
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="hidden gap-2 px-1 text-xs text-muted-foreground sm:flex">
            <span className="flex-[3]">Descripción</span>
            <span className="w-24">Cantidad</span>
            <span className="w-24">Unidad</span>
            <span className="w-9" />
          </div>
          {items.map((it, i) => {
            const incompleto = itemIncompleto(it);
            return (
              <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
                <Input
                  aria-label={`Descripción del ítem ${i + 1}`}
                  placeholder={`Ítem ${i + 1}, p. ej. Portátil 16 GB RAM`}
                  value={it.descripcion}
                  maxLength={300}
                  onChange={(e) => set(i, "descripcion", e.target.value)}
                  className="min-w-0 flex-[3] basis-full sm:basis-auto"
                  aria-invalid={incompleto && it.descripcion.trim().length < 2}
                />
                <Input
                  aria-label={`Cantidad del ítem ${i + 1}`}
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="0"
                  value={it.cantidad}
                  onChange={(e) => set(i, "cantidad", e.target.value)}
                  className="w-24"
                  aria-invalid={incompleto && !(Number(it.cantidad) > 0)}
                />
                <Input
                  aria-label={`Unidad del ítem ${i + 1}`}
                  placeholder="und"
                  value={it.unidad}
                  maxLength={30}
                  onChange={(e) => set(i, "unidad", e.target.value)}
                  className="w-24"
                />
                <Button variant="ghost" size="icon" aria-label={`Quitar ítem ${i + 1}`} onClick={() => onChange(items.filter((_, k) => k !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {items.some(itemIncompleto) && (
        <p className="text-xs text-destructive">Completa descripción, cantidad mayor a 0 y unidad en cada ítem, o quita la fila.</p>
      )}
      <Button variant="outline" size="sm" className="w-full" onClick={() => onChange([...items, { ...ITEM_VACIO }])} disabled={items.length >= 200}>
        <Plus className="mr-2 h-4 w-4" /> Agregar ítem
      </Button>
    </div>
  );
}
