import { ProviderCard } from "@/components/shared/ProviderCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Network, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Proveedor } from "@/lib/types";

interface PasoProveedoresProps {
  proveedores: Proveedor[] | null | undefined;
  loadingProveedores: boolean;
  proveedoresSeleccionados: string[];
  onToggleProveedor: (id: string) => void;
  categoria: string;
  abiertoRed: boolean;
  onAbiertoRed: (v: boolean) => void;
}

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export function PasoProveedores({ proveedores, loadingProveedores, proveedoresSeleccionados, onToggleProveedor, categoria, abiertoRed, onAbiertoRed }: PasoProveedoresProps) {
  const cat = normal(categoria);
  const deLaCategoria = (p: Proveedor) => p.categorias.some((c) => normal(c) === cat);
  // Suppliers of the requirement's category first (the match), best score first.
  const lista = [...(proveedores ?? [])].sort((a, b) => Number(deLaCategoria(b)) - Number(deLaCategoria(a)) || b.score - a.score);
  const enCategoria = lista.filter(deLaCategoria).length;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Proveedores</h2>

      <label className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors", abiertoRed ? "border-primary bg-primary/5" : "border-border")}>
        <Network className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Abrir también a la red de proveedores homologados</p>
          <p className="text-sm text-muted-foreground">
            {enCategoria > 0
              ? `${enCategoria} proveedor(es) homologado(s) en ${categoria} recibirán la convocatoria y podrán unirse con su homologación.`
              : `Los proveedores homologados en ${categoria} recibirán la convocatoria y podrán unirse con su homologación.`}{" "}
            Solo pueden unirse los que cumplan los requisitos de documentos de tu empresa.
          </p>
        </div>
        <Switch checked={abiertoRed} onCheckedChange={onAbiertoRed} aria-label="Abrir a la red" />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{proveedoresSeleccionados.length} invitados directamente</span>
        {!abiertoRed && <span className="text-sm text-muted-foreground">· Mínimo recomendado: 3</span>}
        {!abiertoRed && proveedoresSeleccionados.length < 3 && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> Selecciona al menos 3 o abre el proceso a la red
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Los invitados reciben la invitación en cuanto el requerimiento sea aprobado — no antes. Primero aparecen los de la categoría {categoria}.
      </p>
      {loadingProveedores ? (
        <p className="text-sm text-muted-foreground">Cargando proveedores...</p>
      ) : lista.length === 0 ? (
        <EmptyState icon={Users} title="Sin proveedores disponibles" description="No hay proveedores homologados en el directorio todavía." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lista.map((p) => (
            <div key={p.id} className="relative">
              {deLaCategoria(p) && (
                <span className="absolute right-3 top-3 z-10 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{categoria}</span>
              )}
              <ProviderCard proveedor={p} selectable selected={proveedoresSeleccionados.includes(p.id)} onSelect={() => onToggleProveedor(p.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
