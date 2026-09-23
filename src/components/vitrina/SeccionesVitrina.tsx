import { useState } from "react";
import {
  BadgeCheck, CalendarCheck, Download, FileText, Globe, Mail, Package, Phone, ShieldCheck, Star, Trophy, Truck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CATEGORIA_LABEL, type CategoriaDocumento } from "@/lib/api/homologacion";
import type { ImagenVitrina, VitrinaProveedor } from "@/lib/api/vitrina";
import { formatMoney } from "@/lib/moneda";
import { videoEmbedUrl } from "@/lib/video";

/**
 * Sections of a proveedor's vitrina, shared by the public page (/vitrina/:id)
 * and the client portal's supplier detail (/cliente/directorio/:id) so both
 * always show the same content.
 */

function hrefSitio(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function ContactoVitrina({ p }: { p: VitrinaProveedor }) {
  if (!p.emailContacto && !p.telefonoContacto && !p.sitioWeb) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {p.emailContacto && (
        <Button size="sm" className="gap-1.5" asChild>
          <a href={`mailto:${p.emailContacto}`}><Mail className="h-4 w-4" /> {p.emailContacto}</a>
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
  );
}

export function MetricasVitrina({ p }: { p: VitrinaProveedor }) {
  return (
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
  );
}

export function CatalogoVitrina({ p }: { p: VitrinaProveedor }) {
  if (p.catalogo.length === 0) return null;
  return (
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
  );
}

export function VideoVitrina({ p }: { p: VitrinaProveedor }) {
  if (!p.videoUrl) return null;
  const embed = videoEmbedUrl(p.videoUrl);
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Video</h2>
      {embed ? (
        <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-black">
          <iframe src={embed} title={`Video de ${p.nombre}`} className="h-full w-full" allowFullScreen loading="lazy" />
        </div>
      ) : (
        <a href={p.videoUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-primary hover:underline">Ver video</a>
      )}
    </section>
  );
}

export function GaleriaVitrina({ p }: { p: VitrinaProveedor }) {
  const [abierta, setAbierta] = useState<ImagenVitrina | null>(null);
  const galeria = p.galeria.filter((g) => g.url);
  if (galeria.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Galería</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {galeria.map((img) => (
          <button key={img.id} onClick={() => setAbierta(img)} className="overflow-hidden rounded-lg border border-border bg-muted/40 text-left focus-visible:ring-2 focus-visible:ring-ring">
            <img src={img.url!} alt={img.titulo} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform hover:scale-[1.03]" />
          </button>
        ))}
      </div>
      <Dialog open={!!abierta} onOpenChange={(v) => !v && setAbierta(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">{abierta?.titulo}</DialogTitle>
          {abierta?.url && <img src={abierta.url} alt={abierta.titulo} className="max-h-[80vh] w-full rounded-md object-contain" />}
          <p className="px-2 pb-1 text-sm text-muted-foreground">{abierta?.titulo}</p>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function DocumentosVitrina({ p }: { p: VitrinaProveedor }) {
  const documentos = p.documentos.filter((d) => d.url);
  if (documentos.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Brochures y catálogos</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {documentos.map((d) => (
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
  );
}

export function VerificadoVitrina({ p }: { p: VitrinaProveedor }) {
  return (
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
  );
}
