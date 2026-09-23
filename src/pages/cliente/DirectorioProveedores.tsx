import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { PaginationBar } from "@/components/shared/PaginationBar";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { fetchCategoriasProveedores, fetchProveedoresPagina } from "@/lib/api/proveedores";
import { useApiData } from "@/hooks/useApiData";
import { useDebounced } from "@/hooks/useDebounced";

export function DirectorioProveedores() {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [minScore, setMinScore] = useState(0);
  const [page, setPage] = useState(1);
  // The API searches name, description and catalog items.
  const q = useDebounced(query.trim());
  useEffect(() => setPage(1), [q, categoria, minScore]);

  const { data, loading } = useApiData(
    () => fetchProveedoresPagina({ page, query: q || undefined, categoria, minScore }),
    [page, q, categoria, minScore],
  );
  const { data: categorias } = useApiData(fetchCategoriasProveedores);
  const proveedores = data?.items ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Directorio de Proveedores</h1>
        <p className="text-sm text-muted-foreground">Explora toda la red homologada: busca por nombre o por lo que necesitas comprar</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput placeholder="Buscar proveedor, producto o servicio..." value={query} onChange={setQuery} />
        <select aria-label="Categoría" className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {["Todas", ...(categorias ?? [])].map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Score mínimo" className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
          <option value={0}>Cualquier score</option>
          <option value={80}>Score ≥ 80</option>
          <option value={90}>Score ≥ 90</option>
        </select>
      </div>

      {loading && !data ? <CardGridSkeleton /> : proveedores.length === 0 ? (
        <EmptyState icon={Building2} title="Sin resultados" description="Ajusta los filtros de búsqueda." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proveedores.map((p) => (
              <Link key={p.id} to={`/cliente/directorio/${p.id}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <ProviderCard proveedor={p} />
              </Link>
            ))}
          </div>
          {data && data.totalPages > 1 && (
            <Card className="overflow-hidden">
              <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} label="proveedores" />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
