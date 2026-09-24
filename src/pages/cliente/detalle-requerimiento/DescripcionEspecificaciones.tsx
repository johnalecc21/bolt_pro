import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequerimientoDetalle } from "@/lib/api/requerimientos";

interface DescripcionEspecificacionesProps {
  descripcion: RequerimientoDetalle["descripcion"];
  especificaciones: RequerimientoDetalle["especificaciones"];
  items?: RequerimientoDetalle["items"];
}

export function DescripcionEspecificaciones({ descripcion, especificaciones, items = [] }: DescripcionEspecificacionesProps) {
  const [abierto, setAbierto] = useState(true);

  return (
    <Card className="p-6">
      <Collapsible open={abierto} onOpenChange={setAbierto}>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
          <h2 className="font-semibold">Descripción y especificaciones</h2>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", abierto && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          {descripcion ? (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{descripcion}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin descripción registrada para este requerimiento.</p>
          )}
          {especificaciones.length > 0 && (
            <div className="space-y-2">
              {especificaciones.map((spec, i) => (
                <div key={i} className="flex justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{spec.name}</span>
                  <span className="font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          )}
          {items.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Ítem a cotizar</th>
                    <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.id} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">{it.descripcion}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{it.cantidad.toLocaleString("es-CO", { maximumFractionDigits: 3 })} {it.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
