import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Proveedor } from "@/lib/mockData";

export function ProviderCard({ proveedor, selectable, selected, onSelect }: {
  proveedor: Proveedor;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <Card
      onClick={selectable ? onSelect : undefined}
      className={cn(
        "p-4 transition-all hover:shadow-lg hover:-translate-y-0.5",
        selectable && "cursor-pointer",
        selected && "ring-2 ring-primary bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <div className={cn("mt-1 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors", selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30")}>
            {selected && <span className="text-xs">✓</span>}
          </div>
        )}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm" style={{ background: proveedor.color }}>
          {proveedor.iniciales}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-sm">{proveedor.nombre}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {proveedor.ubicacion}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {proveedor.categorias.map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">{c}</Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-sm font-bold">{proveedor.score}</span>
          </div>
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Shield className="h-3 w-3" />
            {proveedor.entregasATiempo}% ok
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1 border-t pt-2">
        {proveedor.certificaciones.map((cert) => (
          <span key={cert} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{cert}</span>
        ))}
      </div>
    </Card>
  );
}
