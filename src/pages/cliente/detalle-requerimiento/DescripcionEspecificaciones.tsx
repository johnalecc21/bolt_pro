import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequerimientoDetalle } from "@/lib/api/requerimientos";

interface DescripcionEspecificacionesProps {
  descripcion: RequerimientoDetalle["descripcion"];
  especificaciones: RequerimientoDetalle["especificaciones"];
}

export function DescripcionEspecificaciones({ descripcion, especificaciones }: DescripcionEspecificacionesProps) {
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
