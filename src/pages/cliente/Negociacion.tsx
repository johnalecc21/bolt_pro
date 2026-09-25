import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Gavel, Crown, Check, TrendingUp, FileQuestion, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubasta, getRanking, type Puja } from "@/lib/api/subasta";
import { useApiData } from "@/hooks/useApiData";
import { fetchRequerimiento } from "@/lib/api/requerimientos";
import { fetchOfertasPorRequerimiento } from "@/lib/api/ofertas";
import { crearAdjudicacion } from "@/lib/api/adjudicacion";
import { apiErrorMessage } from "@/lib/api/http";
import { formatMoney, type Moneda } from "@/lib/moneda";
import { cuentaRegresiva } from "@/lib/fecha";
import { useIncrustado } from "@/components/layout/Incrustado";
import { CargandoProcurex } from "@/components/shared/CargandoProcurex";


function Leaderboard({ ranking, moneda }: { ranking: Puja[]; moneda: Moneda }) {
  return (
    <div className="space-y-3">
      {ranking.map((item, i) => {
        const pos = i + 1;
        const cambio = item.montoInicial - item.monto;
        return (
          <Card key={item.proveedorId} className={cn("p-4 transition-all", pos === 1 && "ring-2 ring-warning")}>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold",
                  pos === 1 ? "bg-warning/20 text-warning-foreground" : pos === 2 ? "bg-muted text-muted-foreground" : "bg-bronze/20 text-bronze-foreground",
                )}
              >
                {pos === 1 ? <Crown className="h-6 w-6" /> : `${pos}°`}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{item.proveedor}</p>
                <p className="text-sm text-muted-foreground">Oferta actual: {formatMoney(item.monto, moneda)}</p>
              </div>
              <div className="text-right">
                <p className={cn("flex items-center gap-1 text-sm font-semibold", cambio > 0 ? "text-success" : "text-muted-foreground")}>
                  {cambio > 0 && <TrendingUp className="h-3.5 w-3.5 rotate-180" />}
                  {cambio > 0 ? `-${formatMoney(cambio, moneda)}` : "Sin cambios"}
                </p>
                <p className="text-xs text-muted-foreground">vs. oferta de la licitación</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function Negociacion() {
  const navigate = useNavigate();
  const incrustado = useIncrustado();
  const { id } = useParams();
  const requerimientoId = id ?? "";
  const { data: requerimiento, loading: cargandoRequerimiento } = useApiData(
    () => (requerimientoId ? fetchRequerimiento(requerimientoId) : new Promise<never>(() => {})),
    [requerimientoId],
  );
  const { data: ofertas } = useApiData(
    () => (requerimientoId ? fetchOfertasPorRequerimiento(requerimientoId) : Promise.resolve([])),
    [requerimientoId],
  );
  const [duracionMin, setDuracionMin] = useState(30);
  const [participantes, setParticipantes] = useState<"finalistas" | "todos">("finalistas");
  const [adjudicando, setAdjudicando] = useState(false);
  const { state: auction, iniciar, cerrar } = useSubasta(requerimientoId);
  const activa = auction.status === "activa";
  const cerrada = auction.status === "cerrada";
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!activa) return;
    const timer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [activa]);

  const ranking = getRanking(auction.pujas);

  if (!requerimientoId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Gavel}
          title="Selecciona un proceso para negociar"
          description="Abre una licitación, revisa su cuadro comparativo y desde ahí inicia la ronda de negociación."
        />
        <div className="mt-4 flex justify-center">
          <Button asChild variant="outline">
            <Link to="/cliente/procesos">Ver licitaciones</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (cargandoRequerimiento) {
    return <CargandoProcurex pagina />;
  }

  if (!requerimiento) {
    return (
      <div className="p-6">
        <EmptyState icon={FileQuestion} title="Este requerimiento no tiene ofertas para negociar" description="La negociación solo aplica a procesos que ya recibieron ofertas en licitación." />
      </div>
    );
  }

  const ofertasEnviadas = (ofertas ?? []).filter((o) => o.enviada).length;
  const yaAdjudicado = ["adjudicado", "en_cumplimiento", "cerrado"].includes(requerimiento.estado);
  const puedeIniciar = ["en_licitacion", "en_negociacion"].includes(requerimiento.estado) && !yaAdjudicado;

  async function adjudicarMejorPuja() {
    const ganador = ranking[0];
    if (!ganador) return;
    setAdjudicando(true);
    try {
      // Also closes the round server-side if it is still running.
      await crearAdjudicacion({ requerimientoId, proveedorId: ganador.proveedorId });
      toast.success("Ronda cerrada", { description: `${ganador.proveedor} queda como adjudicatario con ${formatMoney(ganador.monto, requerimiento!.moneda)}.` });
      navigate(`/cliente/procesos/${requerimientoId}/adjudicacion`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo adjudicar."));
    } finally {
      setAdjudicando(false);
    }
  }

  async function handleCerrarRonda() {
    cerrar();
    await adjudicarMejorPuja();
  }

  return (
    <div className={incrustado ? "space-y-6" : "space-y-6 p-6"}>
      {incrustado ? (
        <p className="text-sm text-muted-foreground">Subasta inversa en vivo sobre las ofertas de la licitación.</p>
      ) : (
        <div>
          <h1 className="text-2xl font-bold">Ronda de Negociación</h1>
          <p className="text-sm text-muted-foreground">{requerimiento.titulo} · Subasta inversa sobre las ofertas de la licitación</p>
        </div>
      )}

      {yaAdjudicado && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm">Este proceso ya fue adjudicado.</p>
          <Button asChild>
            <Link to={`/cliente/procesos/${requerimientoId}/adjudicacion`}>Ver adjudicación</Link>
          </Button>
        </Card>
      )}

      {cerrada && !yaAdjudicado && ranking.length > 0 && (
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-warning-foreground" />
              <div>
                <p className="font-semibold">Ronda cerrada</p>
                <p className="text-sm text-muted-foreground">
                  Mejor puja: {ranking[0].proveedor} con {formatMoney(ranking[0].monto, requerimiento.moneda)}
                </p>
              </div>
            </div>
            <Button onClick={adjudicarMejorPuja} disabled={adjudicando}>
              <Check className="mr-2 h-4 w-4" /> {adjudicando ? "Adjudicando..." : `Adjudicar a ${ranking[0].proveedor}`}
            </Button>
          </div>
          <Leaderboard ranking={ranking} moneda={requerimiento.moneda} />
        </Card>
      )}

      {!activa && puedeIniciar && (
        <>
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white">
                <Gavel className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">{cerrada ? "Nueva ronda de subasta inversa" : "Subasta inversa"}</h2>
                <p className="text-sm text-muted-foreground">
                  Cada proveedor ve solo su posición y mejora su oferta en vivo. Al iniciar se cierra la recepción de ofertas de la licitación.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="duracion" className="text-sm font-medium">Ventana de tiempo</label>
                <select
                  id="duracion"
                  value={duracionMin}
                  onChange={(e) => setDuracionMin(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                >
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={120}>2 horas</option>
                  <option value={1440}>24 horas</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="participantes" className="text-sm font-medium">Proveedores incluidos</label>
                <select
                  id="participantes"
                  value={participantes}
                  onChange={(e) => setParticipantes(e.target.value as "finalistas" | "todos")}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                >
                  <option value="finalistas">Los 3 mejores precios</option>
                  <option value="todos">Todos los ofertantes</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => iniciar({ duracionMin, participantes })} disabled={ofertasEnviadas < 2}>
              <Gavel className="mr-2 h-4 w-4" /> Iniciar ronda de negociación
            </Button>
            {ofertasEnviadas < 2 && (
              <p className="text-sm text-muted-foreground">Se necesitan al menos 2 ofertas enviadas para negociar.</p>
            )}
          </div>
        </>
      )}

      {activa && (
        <>
          <Card className="overflow-hidden">
            <div className="gradient-hero p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Tiempo restante</p>
                  <p className="text-3xl font-bold tabular-nums">{cuentaRegresiva(auction.deadlineMs)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                  </span>
                  <span className="text-sm font-medium">EN VIVO</span>
                </div>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="mb-3 font-semibold">Leaderboard en vivo</h2>
            <Leaderboard ranking={ranking} moneda={requerimiento.moneda} />
          </div>

          <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">
              Al cerrar la ronda se congela el resultado y el proceso queda adjudicado a la mejor puja
              {ranking[0] ? ` (${ranking[0].proveedor})` : ""}. La ronda también se cierra sola al terminar el tiempo.
            </p>
            <ConfirmDialog
              trigger={
                <Button className="gradient-success text-white" disabled={adjudicando}>
                  <Check className="mr-2 h-4 w-4" /> Cerrar ronda y adjudicar
                </Button>
              }
              title="Cerrar ronda y adjudicar"
              description="Se congela el resultado y se adjudica a la mejor puja. Luego podrás revisar y confirmar la adjudicación."
              confirmLabel="Cerrar y adjudicar"
              onConfirm={handleCerrarRonda}
            />
          </Card>
        </>
      )}
    </div>
  );
}
