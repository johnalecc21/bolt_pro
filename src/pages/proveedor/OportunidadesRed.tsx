import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { RequerimientoInvitadoDetalle } from "@/components/proveedor/RequerimientoInvitadoDetalle";
import { Calendar, Eye, ListChecks, Loader2, Lock, Network, Search, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api/http";
import { fechaLocal } from "@/lib/fecha";
import { fetchOportunidades, participar, type Oportunidad } from "@/lib/api/red";
import { fetchRequerimientoInvitado, type RequerimientoInvitado } from "@/lib/api/invitaciones";

type Datos = Awaited<ReturnType<typeof fetchOportunidades>>;

/**
 * Open tenders published to the Procurex network. A homologated supplier
 * joins any of them with its existing homologation — no invitation needed.
 */
export function OportunidadesRed() {
  const navigate = useNavigate();
  const [todas, setTodas] = useState(false);
  const [q, setQ] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [abierta, setAbierta] = useState<Oportunidad | null>(null);
  const [detalle, setDetalle] = useState<RequerimientoInvitado | null>(null);
  const [uniendo, setUniendo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBusqueda(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    fetchOportunidades({ todas, q: busqueda })
      .then((d) => vivo && setDatos(d))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [todas, busqueda]);

  async function ver(o: Oportunidad) {
    setAbierta(o);
    setDetalle(null);
    try {
      setDetalle(await fetchRequerimientoInvitado(o.id));
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo cargar el requerimiento."));
      setAbierta(null);
    }
  }

  async function unirse(o: Oportunidad) {
    setUniendo(true);
    try {
      await participar(o.id);
      toast.success("Ya participas en este proceso", { description: "Prepara y envía tu oferta antes del cierre." });
      navigate(`/proveedor/ofertas/${o.id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUniendo(false);
    }
  }

  const accion = (o: Oportunidad, enDialogo = false) =>
    o.participa && o.participa.estado !== "DECLINADA" ? (
      <Button size="sm" variant={enDialogo ? "default" : "outline"} onClick={() => navigate(`/proveedor/ofertas/${o.id}`)}>
        Ir a mi oferta
      </Button>
    ) : o.puedeParticipar ? (
      <Button size="sm" disabled={uniendo} onClick={() => unirse(o)} className="gap-1.5">
        {uniendo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Network className="h-4 w-4" aria-hidden="true" />} Participar
      </Button>
    ) : (
      <Button size="sm" variant="outline" disabled className="gap-1.5" title={o.motivo ?? undefined}>
        <Lock className="h-4 w-4" aria-hidden="true" /> No disponible
      </Button>
    );

  const items = datos?.items ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Oportunidades de la red</h1>
        <p className="text-sm text-muted-foreground">
          Procesos abiertos por las empresas de Procurex. Con tu homologación participas en cualquiera de ellos, sin esperar invitación.
        </p>
      </div>

      {datos && !datos.homologado && (
        <Card className="flex flex-wrap items-center gap-3 border-warning/40 bg-warning/5 p-4">
          <ShieldCheck className="h-5 w-5 text-warning-foreground" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm">
            <strong>Homológate una vez y participa en los procesos de todas las empresas de Procurex.</strong> Mientras tu homologación no esté aprobada puedes ver las oportunidades, pero no unirte.
          </p>
          <Button asChild size="sm">
            <Link to="/proveedor/homologacion">Completar homologación</Link>
          </Button>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5 shadow-sm" role="tablist" aria-label="Filtro de oportunidades">
          {([[false, "Mis categorías"], [true, "Todas"]] as const).map(([v, label]) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={todas === v}
              onClick={() => setTodas(v)}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", todas === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, código o empresa" className="pl-9" aria-label="Buscar oportunidades" />
        </div>
        {datos && datos.categorias.length > 0 && !todas && (
          <p className="text-xs text-muted-foreground">Tus categorías: {datos.categorias.join(", ")}</p>
        )}
      </div>

      {cargando && !datos ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No hay procesos abiertos"
          description={todas ? "Ninguna empresa tiene convocatorias abiertas a la red ahora mismo." : "No hay convocatorias en tus categorías. Revisa todas las categorías o amplía tu perfil."}
        />
      ) : (
        <div className={cn("space-y-3", cargando && "opacity-60")}>
          {items.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <button type="button" className="text-left text-sm font-medium hover:text-primary hover:underline" onClick={() => ver(o)}>
                    <span className="text-muted-foreground">{o.codigo}</span> · {o.titulo}
                  </button>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{o.cliente}</span>
                    <span>{o.categoria}</span>
                    {o.deMiCategoria && <Badge variant="secondary" className="h-5 bg-primary/10 px-1.5 text-[11px] text-primary">Tu categoría</Badge>}
                    {o.items > 0 && <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" aria-hidden="true" /> {o.items} ítem(s)</span>}
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" aria-hidden="true" /> {o.participantes} participante(s)</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden="true" /> Cierra {fechaLocal(o.fechaLimite)}</span>
                  </div>
                  {!o.puedeParticipar && o.motivo && !o.participa && <p className="mt-1.5 text-xs text-warning-foreground">{o.motivo}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => ver(o)}>
                    <Eye className="h-4 w-4" aria-hidden="true" /> Ver requerimiento
                  </Button>
                  {accion(o)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!abierta} onOpenChange={(o) => !o && setAbierta(null)}>
        {abierta && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{abierta.titulo}</DialogTitle>
              <DialogDescription>{abierta.cliente} abrió este proceso a la red de proveedores homologados.</DialogDescription>
            </DialogHeader>
            {detalle ? (
              <RequerimientoInvitadoDetalle r={detalle} />
            ) : (
              <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando requerimiento…</div>
            )}
            {!abierta.puedeParticipar && abierta.motivo && !abierta.participa && (
              <p className="rounded-md bg-warning/10 p-3 text-sm text-warning-foreground">{abierta.motivo}</p>
            )}
            <DialogFooter className="gap-2 sm:justify-end">{accion(abierta, true)}</DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
