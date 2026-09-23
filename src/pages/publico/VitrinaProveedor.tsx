import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck, CalendarCheck, Download, FileText, Globe, Mail, MapPin, Package, Phone, ShieldCheck, Star, Trophy, Truck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LogoFull } from "@/components/shared/Logo";
import { useApiData } from "@/hooks/useApiData";
import { fetchVitrina, type ImagenVitrina } from "@/lib/api/vitrina";
import { CATEGORIA_LABEL, type CategoriaDocumento } from "@/lib/api/homologacion";
import { formatMoney } from "@/lib/moneda";
import { videoEmbedUrl } from "@/lib/video";

function hrefSitio(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Public, shareable profile of a homologated proveedor — verified facts plus the content it manages itself. */
export function VitrinaProveedor() {
  const { id = "" } = useParams();
  const { data: p, loading, error } = useApiData(() => fetchVitrina(id), [id]);
  const [imagenAbierta, setImagenAbierta] = useState<ImagenVitrina | null>(null);

  const embed = videoEmbedUrl(p?.videoUrl);
  const galeria = (p?.galeria ?? []).filter((g) => g.url);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/"><LogoFull className="h-7" /></Link>
          <span className="text-xs text-muted-foreground">Vitrina de proveedores homologados</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
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
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white" style={{ background: p.color }}>
                  {p.iniciales}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="flex items-center gap-2 text-2xl font-bold">
                    {p.nombre} <BadgeCheck className="h-5 w-5 shrink-0 text-primary" aria-label="Homologado" />
                  </h1>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {p.ubicacion}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.categorias.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.emailContacto && (
                    <Button size="sm" className="gap-1.5" asChild>
                      <a href={`mailto:${p.emailContacto}`}><Mail className="h-4 w-4" /> Contactar</a>
                    </Button>
                  )}
                  {p.telefonoContacto && (
                    <Button size="sm" variant="outline" className="gap-1.5" asChild>
                      <a href={`tel:${p.telefonoContacto.replace(/[^\d+]/g, "")}`}><Phone className="h-4 w-4" /> {p.telefonoContacto}</a>
                    </Button>
                  )}
                  {p.sitioWeb && (
                    <Button size="sm" variant="outline" className="gap-1.5" asChild>
                      <a href={hrefSitio(p.sitioWeb)} target="_blank" rel="noopener noreferrer nofollow"><Globe className="h-4 w-4" /> Sitio web</a>
                    </Button>
                  )}
                </div>
              </div>
              {p.descripcion && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed">{p.descripcion}</p>}
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

            {p.catalogo.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Productos y servicios</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {p.catalogo.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="flex aspect-[4/3] items-center justify-center bg-muted/50">
                        {item.imagenUrl ? <img src={item.imagenUrl} alt={item.nombre} loading="lazy" className="h-full w-full object-cover" /> : <Package className="h-8 w-8 text-muted-foreground" />}
                      </div>
                      <div className="space-y-1 p-4">
                        {item.categoria && <p className="text-xs text-muted-foreground">{item.categoria}</p>}
                        <p className="font-medium">{item.nombre}</p>
                        {item.descripcion && <p className="line-clamp-3 text-sm text-muted-foreground">{item.descripcion}</p>}
                        <p className="pt-1 text-sm font-semibold">
                          {item.precioReferencia != null && item.moneda ? `Desde ${formatMoney(item.precioReferencia, item.moneda)}` : "Precio a convenir"}
                          {item.unidad && <span className="font-normal text-muted-foreground"> / {item.unidad}</span>}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {(embed || p.videoUrl) && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Video</h2>
                {embed ? (
                  <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-black">
                    <iframe src={embed} title={`Video de ${p.nombre}`} className="h-full w-full" allowFullScreen loading="lazy" />
                  </div>
                ) : (
                  <a href={p.videoUrl!} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-primary hover:underline">Ver video</a>
                )}
              </section>
            )}

            {galeria.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Galería</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {galeria.map((img) => (
                    <button key={img.id} onClick={() => setImagenAbierta(img)} className="overflow-hidden rounded-lg border border-border bg-muted/40 text-left focus-visible:ring-2 focus-visible:ring-ring">
                      <img src={img.url!} alt={img.titulo} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform hover:scale-[1.03]" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {p.documentos.some((d) => d.url) && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Brochures y catálogos</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {p.documentos.filter((d) => d.url).map((d) => (
                    <a key={d.id} href={d.url!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm hover:border-primary/40">
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText className="h-5 w-5 shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{d.titulo}</span>
                          <span className="text-xs text-muted-foreground">{d.tipo === "BROCHURE" ? "Brochure" : "Catálogo"} · PDF</span>
                        </span>
                      </span>
                      <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </section>
            )}

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

      <Dialog open={!!imagenAbierta} onOpenChange={(v) => !v && setImagenAbierta(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">{imagenAbierta?.titulo}</DialogTitle>
          {imagenAbierta?.url && <img src={imagenAbierta.url} alt={imagenAbierta.titulo} className="max-h-[80vh] w-full rounded-md object-contain" />}
          <p className="px-2 pb-1 text-sm text-muted-foreground">{imagenAbierta?.titulo}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
