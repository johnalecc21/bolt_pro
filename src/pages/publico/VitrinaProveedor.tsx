import { Link, useParams } from "react-router-dom";
import { BadgeCheck, CalendarCheck, MapPin, ShieldCheck, Star, Trophy, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoFull } from "@/components/shared/Logo";
import { useApiData } from "@/hooks/useApiData";
import { fetchVitrina } from "@/lib/api/proveedores";
import { CATEGORIA_LABEL, type CategoriaDocumento } from "@/lib/api/homologacion";

/** Public, shareable profile of a homologated proveedor — no login, verified facts only. */
export function VitrinaProveedor() {
  const { id = "" } = useParams();
  const { data: p, loading, error } = useApiData(() => fetchVitrina(id), [id]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/"><LogoFull className="h-7" /></Link>
          <span className="text-xs text-muted-foreground">Vitrina de proveedores homologados</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando perfil...</p>
        ) : error || !p ? (
          <Card className="p-8 text-center">
            <p className="font-medium">Este proveedor no tiene una vitrina pública</p>
            <p className="mt-1 text-sm text-muted-foreground">Solo los proveedores con homologación aprobada aparecen aquí.</p>
          </Card>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white" style={{ background: p.color }}>
                  {p.iniciales}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="flex items-center gap-2 text-2xl font-bold">
                    {p.nombre} <BadgeCheck className="h-5 w-5 text-primary" aria-label="Homologado" />
                  </h1>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {p.ubicacion}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.categorias.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="p-4 text-center">
                <p className="flex items-center justify-center gap-1 text-2xl font-bold"><Star className="h-5 w-5 fill-warning text-warning" />{p.score}</p>
                <p className="text-xs text-muted-foreground">Score de homologación</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold">{p.desempenoPromedio != null ? Math.round(p.desempenoPromedio) : "—"}</p>
                <p className="text-xs text-muted-foreground">Desempeño ({p.evaluacionesCount} eval.)</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="flex items-center justify-center gap-1 text-2xl font-bold"><Trophy className="h-5 w-5 text-primary" />{p.procesosGanados}</p>
                <p className="text-xs text-muted-foreground">Procesos ganados</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="flex items-center justify-center gap-1 text-2xl font-bold"><Truck className="h-5 w-5 text-success" />{p.entregasATiempo}%</p>
                <p className="text-xs text-muted-foreground">Entregas a tiempo</p>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="mb-3 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Información verificada por Procurex</h2>
              <div className="flex flex-wrap gap-2">
                {p.categoriasVerificadas.map((c) => (
                  <span key={c} className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
                    <BadgeCheck className="h-3.5 w-3.5" /> {CATEGORIA_LABEL[c.toLowerCase() as CategoriaDocumento] ?? c}
                  </span>
                ))}
              </div>
              {p.certificaciones.length > 0 && (
                <>
                  <p className="mb-1.5 mt-4 text-sm font-medium">Certificaciones declaradas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.certificaciones.map((c) => <span key={c} className="rounded-md bg-muted px-2 py-1 text-xs">{c}</span>)}
                  </div>
                </>
              )}
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarCheck className="h-3.5 w-3.5" />
                Miembro desde {p.miembroDesde.slice(0, 10)}
                {p.homologadoHasta && ` · Homologación vigente hasta ${p.homologadoHasta.slice(0, 10)}`}
              </p>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              ¿Compras para tu empresa? <Link to="/cliente/login" className="text-primary hover:underline">Ingresa a Procurex</Link> para invitar a este proveedor a tus procesos.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
