import { Link, useParams } from "react-router-dom";
import { BadgeCheck, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoFull } from "@/components/shared/Logo";
import {
  CatalogoVitrina, ContactoVitrina, DocumentosVitrina, GaleriaVitrina, MetricasVitrina, VerificadoVitrina, VideoVitrina,
} from "@/components/vitrina/SeccionesVitrina";
import { useApiData } from "@/hooks/useApiData";
import { fetchVitrina } from "@/lib/api/vitrina";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CargandoProcurex } from "@/components/shared/CargandoProcurex";

/** Public, shareable profile of a homologated proveedor — verified facts plus the content it manages itself. */
export function VitrinaProveedor() {
  const { id = "" } = useParams();
  const { data: p, loading, error } = useApiData(() => fetchVitrina(id), [id]);
  usePageMeta({
    title: p ? `${p.nombre} · Proveedor homologado` : "Vitrina de proveedores",
    description: p
      ? (p.descripcion?.slice(0, 155) ?? `${p.nombre}: proveedor homologado en Procurex${p.categorias.length ? ` (${p.categorias.join(", ")})` : ""}.`)
      : undefined,
  });

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
          <CargandoProcurex texto="Cargando perfil" />
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
                <ContactoVitrina p={p} />
              </div>
              {p.descripcion && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed">{p.descripcion}</p>}
            </Card>

            <MetricasVitrina p={p} />
            <CatalogoVitrina p={p} />
            <VideoVitrina p={p} />
            <GaleriaVitrina p={p} />
            <DocumentosVitrina p={p} />
            <VerificadoVitrina p={p} />

            <p className="text-center text-xs text-muted-foreground">
              ¿Compras para tu empresa? <Link to="/cliente/login" className="text-primary hover:underline">Ingresa a Procurex</Link> para invitar a este proveedor a tus procesos.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
