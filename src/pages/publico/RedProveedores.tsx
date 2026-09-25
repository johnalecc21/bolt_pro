import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Building2, ChevronLeft, ChevronRight, MapPin, Network, Search, ShieldCheck, Star, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoFull } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { usePageMeta } from "@/hooks/usePageMeta";
import { fetchDirectorioPublico, fetchEstadisticasRed } from "@/lib/api/red";

/**
 * Public directory of the Procurex network: every homologated supplier with
 * its free showcase, plus the pitch to join — homologate once, take part in
 * the tenders of every company on Procurex.
 */
export function RedProveedores() {
  usePageMeta({
    title: "Red de proveedores homologados",
    description: "Proveedores homologados en Procurex. Homológate una vez y participa en los procesos de compra de todas las empresas de la red.",
  });
  const [q, setQ] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data: stats } = useApiData(fetchEstadisticasRed);
  const { data, loading } = useApiData(
    () => fetchDirectorioPublico({ q: busqueda || undefined, categoria, page }),
    [busqueda, categoria, page],
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/"><LogoFull className="h-7" /></Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/proveedor/login">Ingresar</Link></Button>
            <Button asChild size="sm"><Link to="/proveedor/registro">Registra tu empresa gratis</Link></Button>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Badge variant="secondary" className="mb-3 gap-1.5"><Network className="h-3.5 w-3.5" aria-hidden="true" /> Red Procurex</Badge>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Homológate una vez y participa en los procesos de todas las empresas de Procurex</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            El registro y la vitrina son gratis para el proveedor. Con tu homologación aprobada recibes las convocatorias de tu categoría y te unes a ellas sin esperar invitación.
          </p>
          <div className="mt-6 grid max-w-2xl grid-cols-3 gap-3">
            {([
              [ShieldCheck, stats?.proveedoresHomologados, "proveedores homologados"],
              [Building2, stats?.empresas, "empresas compradoras"],
              [Target, stats?.convocatoriasAbiertas, "convocatorias abiertas"],
            ] as const).map(([Icon, n, label]) => (
              <div key={label} className="rounded-lg border border-border p-3">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="mt-1 text-2xl font-bold tabular-nums">{n ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild><Link to="/proveedor/registro">Registra tu empresa gratis</Link></Button>
            <Button asChild variant="outline"><Link to="/cliente/login">Soy empresa compradora</Link></Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-xl font-semibold">Directorio de proveedores</h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proveedor, ciudad o servicio" className="pl-9" aria-label="Buscar proveedores" />
          </div>
        </div>

        {data && data.categorias.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Categorías">
            {[{ nombre: undefined as string | undefined, proveedores: null as number | null }, ...data.categorias].map((c) => (
              <button
                key={c.nombre ?? "todas"}
                type="button"
                aria-pressed={categoria === c.nombre}
                onClick={() => { setCategoria(c.nombre); setPage(1); }}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  categoria === c.nombre ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50",
                )}
              >
                {c.nombre ?? "Todas"}{c.proveedores != null && <span className="ml-1 opacity-70">{c.proveedores}</span>}
              </button>
            ))}
          </div>
        )}

        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Cargando proveedores…</p>
        ) : !data || data.items.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium">No encontramos proveedores con ese criterio</p>
            <p className="mt-1 text-sm text-muted-foreground">¿Ofreces este servicio? Regístrate gratis y aparece aquí cuando te homologues.</p>
          </Card>
        ) : (
          <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", loading && "opacity-60")}>
            {data.items.map((p) => (
              <Link key={p.id} to={`/vitrina/${p.id}`} className="group">
                <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-white" style={{ background: p.color }}>
                      {p.iniciales}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-semibold group-hover:text-primary">
                        <span className="truncate">{p.nombre}</span> <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Homologado" />
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden="true" /> {p.ubicacion}</p>
                    </div>
                  </div>
                  {p.descripcion && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.descripcion}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.categorias.slice(0, 3).map((c) => <Badge key={c} variant="secondary" className="text-[11px]">{c}</Badge>)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>Score {p.score}</span>
                    {p.desempenoPromedio != null && (
                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3" aria-hidden="true" /> {p.desempenoPromedio.toFixed(1)} ({p.evaluacionesCount})</span>
                    )}
                    {p.procesosGanados > 0 && <span>{p.procesosGanados} proceso(s) ganado(s)</span>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((n) => n - 1)} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm text-muted-foreground">Página {data.page} de {data.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((n) => n + 1)} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}
      </main>
    </div>
  );
}
