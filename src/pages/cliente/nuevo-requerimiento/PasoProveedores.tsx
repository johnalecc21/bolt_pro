import { ProviderCard } from "@/components/shared/ProviderCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertCircle, Users } from "lucide-react";
import type { Proveedor } from "@/lib/types";

interface PasoProveedoresProps {
  proveedores: Proveedor[] | null | undefined;
  loadingProveedores: boolean;
  proveedoresSeleccionados: string[];
  onToggleProveedor: (id: string) => void;
}

export function PasoProveedores({ proveedores, loadingProveedores, proveedoresSeleccionados, onToggleProveedor }: PasoProveedoresProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Selecciona proveedores</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{proveedoresSeleccionados.length} seleccionados</span>
        <span className="text-sm text-muted-foreground">· Mínimo recomendado: 3</span>
        {proveedoresSeleccionados.length < 3 && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> Selecciona al menos 3
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Se invitarán automáticamente en cuanto el requerimiento sea aprobado — no antes.
      </p>
      {loadingProveedores ? (
        <p className="text-sm text-muted-foreground">Cargando proveedores...</p>
      ) : (proveedores ?? []).length === 0 ? (
        <EmptyState icon={Users} title="Sin proveedores disponibles" description="No hay proveedores homologados en el directorio todavía." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(proveedores ?? []).map((p) => (
            <ProviderCard
              key={p.id}
              proveedor={p}
              selectable
              selected={proveedoresSeleccionados.includes(p.id)}
              onSelect={() => onToggleProveedor(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
