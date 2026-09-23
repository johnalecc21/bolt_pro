import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { fetchProveedores } from "@/lib/api/proveedores";
import { Building2 } from "lucide-react";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

export function DirectorioProveedores() {
  const [query, setQuery] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [minScore, setMinScore] = useState(0);

  // The API searches name, description and catalog items — debounce so
  // typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setBusqueda(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: proveedores, loading } = useApiData(
    () => fetchProveedores(busqueda ? { query: busqueda } : undefined),
    [busqueda],
  );

  const categorias = ["Todas", ...Array.from(new Set((proveedores ?? []).flatMap((p) => p.categorias)))];

  const filtrados = (proveedores ?? []).filter((p) => {
    const matchCat = categoria === "Todas" || p.categorias.includes(categoria);
    const matchScore = p.score >= minScore;
    return matchCat && matchScore;
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Directorio de Proveedores</h1>
        <p className="text-sm text-muted-foreground">Explora toda la red homologada: busca por nombre o por lo que necesitas comprar</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput placeholder="Buscar proveedor, producto o servicio..." value={query} onChange={setQuery} />
        <select className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
          <option value={0}>Cualquier score</option>
          <option value={80}>Score ≥ 80</option>
          <option value={90}>Score ≥ 90</option>
        </select>
      </div>

      {loading && !proveedores ? <CardGridSkeleton /> : filtrados.length === 0 ? (
        <EmptyState icon={Building2} title="Sin resultados" description="Ajusta los filtros de búsqueda." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <Link key={p.id} to={`/cliente/directorio/${p.id}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ProviderCard proveedor={p} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
