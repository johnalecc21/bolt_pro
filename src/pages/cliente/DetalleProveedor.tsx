import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Building2, ExternalLink, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { InvitarProveedorDialog } from "@/components/cliente/InvitarProveedorDialog";
import { ResumenDesempenoProveedor } from "@/components/cliente/ResumenDesempenoProveedor";
import {
  CatalogoVitrina, ContactoVitrina, DocumentosVitrina, GaleriaVitrina, MetricasVitrina, VerificadoVitrina, VideoVitrina,
} from "@/components/vitrina/SeccionesVitrina";
import { useApiData } from "@/hooks/useApiData";
import { fetchVitrina, urlVitrina } from "@/lib/api/vitrina";

/**
 * Full supplier profile inside the client portal: everything its public
 * vitrina shows, plus what only a client sees — network performance, this
 * company's own evaluations — and inviting it to a requerimiento.
 */
export function DetalleProveedor() {
  const { id = "" } = useParams();
  const { data: p, loading, error } = useApiData(() => fetchVitrina(id), [id]);

  if (loading) return <div className="p-6"><CardGridSkeleton count={3} /></div>;
  if (error || !p) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild><Link to="/cliente/directorio"><ArrowLeft className="h-4 w-4" /> Directorio</Link></Button>
        <EmptyState icon={Building2} title="Proveedor no disponible" description="Solo se muestran proveedores con homologación aprobada." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-5 p-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link to="/cliente/directorio"><ArrowLeft className="h-4 w-4" /> Directorio</Link>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
          <a href={urlVitrina(p.id)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Vitrina pública</a>
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white" style={{ background: p.color }}>
            {p.iniciales}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              {p.nombre} <BadgeCheck className="h-5 w-5 shrink-0 text-primary" aria-label="Homologado" />
            </h1>
            <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {p.ubicacion}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.categorias.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
            </div>
          </div>
          <InvitarProveedorDialog proveedorId={p.id} proveedorNombre={p.nombre} />
        </div>
        {p.descripcion && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed">{p.descripcion}</p>}
        <div className="mt-4"><ContactoVitrina p={p} /></div>
      </Card>

      <MetricasVitrina p={p} />

      <Card className="p-5">
        <ResumenDesempenoProveedor proveedorId={p.id} />
      </Card>

      <CatalogoVitrina p={p} />
      <VideoVitrina p={p} />
      <GaleriaVitrina p={p} />
      <DocumentosVitrina p={p} />
      <VerificadoVitrina p={p} />
    </div>
  );
}
