import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type Proveedor } from "@/lib/types";
import { fetchProveedores } from "@/lib/api/proveedores";
import { urlVitrina } from "@/lib/api/vitrina";
import { Building2, Star, ShieldCheck, Plus, ExternalLink } from "lucide-react";
import { ResumenDesempenoProveedor } from "@/components/cliente/ResumenDesempenoProveedor";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

export function DirectorioProveedores() {
  const { data: proveedores, loading } = useApiData(() => fetchProveedores());
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [minScore, setMinScore] = useState(0);
  const [perfil, setPerfil] = useState<Proveedor | null>(null);

  const categorias = ["Todas", ...Array.from(new Set((proveedores ?? []).flatMap((p) => p.categorias)))];

  const filtrados = (proveedores ?? []).filter((p) => {
    const matchQuery = p.nombre.toLowerCase().includes(query.toLowerCase());
    const matchCat = categoria === "Todas" || p.categorias.includes(categoria);
    const matchScore = p.score >= minScore;
    return matchQuery && matchCat && matchScore;
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Directorio de Proveedores</h1>
        <p className="text-sm text-muted-foreground">Explora toda la red homologada, no solo los ya invitados</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput placeholder="Buscar proveedor..." value={query} onChange={setQuery} />
        <select className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
          <option value={0}>Cualquier score</option>
          <option value={80}>Score ≥ 80</option>
          <option value={90}>Score ≥ 90</option>
        </select>
      </div>

      {loading ? <CardGridSkeleton /> : filtrados.length === 0 ? (
        <EmptyState icon={Building2} title="Sin resultados" description="Ajusta los filtros de búsqueda." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <div key={p.id} onClick={() => setPerfil(p)} className="cursor-pointer">
              <ProviderCard proveedor={p} />
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!perfil} onOpenChange={(v) => !v && setPerfil(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {perfil && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold" style={{ background: perfil.color }}>
                    {perfil.iniciales}
                  </div>
                  <div>
                    <DialogTitle>{perfil.nombre}</DialogTitle>
                    <DialogDescription>{perfil.ubicacion}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              {perfil.descripcion && <p className="line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">{perfil.descripcion}</p>}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="flex items-center justify-center gap-1 text-lg font-bold"><Star className="h-4 w-4 fill-warning text-warning" /> {perfil.score}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-lg font-bold">{perfil.entregasATiempo}%</p>
                  <p className="text-xs text-muted-foreground">A tiempo</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-lg font-bold">{perfil.procesosGanados}</p>
                  <p className="text-xs text-muted-foreground">Procesos ganados</p>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">Certificaciones</p>
                <div className="flex flex-wrap gap-1.5">
                  {perfil.certificaciones.map((c) => (
                    <span key={c} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"><ShieldCheck className="h-3 w-3" /> {c}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">Categorías</p>
                <div className="flex flex-wrap gap-1.5">
                  {perfil.categorias.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                </div>
              </div>
              <ResumenDesempenoProveedor proveedorId={perfil.id} />
              <a
                href={urlVitrina(perfil.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Ver vitrina: catálogo, fotos y brochures
              </a>
              <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                Disputas históricas: {perfil.disputas} · Solo se muestran datos agregados y reputacionales — nunca condiciones comerciales dadas a otros clientes.
              </div>
              <Button className="w-full gap-2" onClick={() => { toast.success("Agregado a shortlist", { description: `${perfil.nombre} — selecciona el requerimiento activo desde su pantalla de shortlist.` }); setPerfil(null); }}>
                <Plus className="h-4 w-4" /> Agregar a shortlist de un requerimiento
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
