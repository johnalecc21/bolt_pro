import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Gavel, Eye, Handshake, Crown, Check, TrendingUp, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubasta, getRanking } from "@/lib/api/subasta";
import { useApiData } from "@/hooks/useApiData";
import { fetchRequerimiento } from "@/lib/api/requerimientos";
import { fetchOfertasPorRequerimiento } from "@/lib/api/ofertas";

const formatos = [
  { id: "subasta", title: "Subasta Inversa", icon: Gavel, desc: "Los proveedores ven su posición relativa en tiempo real y mejoran su oferta.", pros: "Mejor precio", cons: "Guerra de precios" },
  { id: "ciegas", title: "Ofertas Ciegas", icon: Eye, desc: "Cada proveedor presenta una única mejora sin ver el ranking.", pros: "Protege márgenes", cons: "Menor presión" },
  { id: "bilateral", title: "Negociación Bilateral", icon: Handshake, desc: "El consultor negocia 1 a 1 con los finalistas.", pros: "Relación a largo plazo", cons: "Más lento" },
];

function formatCountdown(deadlineMs: number) {
  const remaining = Math.max(0, deadlineMs - Date.now());
  const min = Math.floor(remaining / 60000);
  const sec = Math.floor((remaining % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function Negociacion() {
  const navigate = useNavigate();
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
  const [formato, setFormato] = useState("subasta");
  const { state: auction, iniciar, cerrar } = useSubasta(requerimientoId);
  const activa = auction.status === "activa";
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
        <EmptyState icon={Gavel} title="Selecciona un proceso para negociar" description="Inicia una ronda de negociación desde el Cuadro Comparativo del proceso que quieras negociar." />
      </div>
    );
  }

  if (cargandoRequerimiento) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando...</div>;
  }

  if (!requerimiento) {
    return (
      <div className="p-6">
        <EmptyState icon={FileQuestion} title="Este requerimiento no tiene ofertas para negociar" description="La negociación solo aplica a procesos que ya recibieron ofertas en licitación." />
      </div>
    );
  }

  function iniciarRonda() {
    const pujasIniciales = (ofertas ?? [])
      .filter((o) => o.enviada)
      .slice()
      .sort((a, b) => a.precio - b.precio)
      .slice(0, 3)
      .map((o) => ({ proveedorId: o.proveedorId, proveedorNombre: o.proveedor, monto: o.precio }));
    iniciar(15 * 60 * 1000, pujasIniciales);
  }

  function handleCerrarRonda() {
    cerrar();
    toast.success("Ronda cerrada", { description: "Acta digital generada. Puedes proceder a adjudicación." });
    navigate(`/cliente/adjudicacion/${requerimientoId}`);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Ronda de Negociación</h1>
        <p className="text-sm text-muted-foreground">{requerimientoId} — {requerimiento.titulo} · Segunda ronda</p>
      </div>

      {!activa ? (
        <>
          <div>
            <h2 className="mb-3 text-sm font-medium">Selecciona el formato de negociación</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {formatos.map((f) => (
                <Card
                  key={f.id}
                  onClick={() => setFormato(f.id)}
                  className={cn(
                    "cursor-pointer p-5 transition-all hover:shadow-lg hover:-translate-y-0.5",
                    formato === f.id ? "ring-2 ring-primary bg-primary/5" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", formato === f.id ? "gradient-brand text-white" : "bg-muted text-muted-foreground")}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{f.desc}</p>
                  <div className="mt-3 flex gap-2 text-xs">
                    <span className="rounded-md bg-success/10 px-2 py-0.5 text-success">✓ {f.pros}</span>
                    <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-destructive">✗ {f.cons}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Configuración</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ventana de tiempo</label>
                <select className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                  <option>30 minutos</option>
                  <option>1 hora</option>
                  <option>2 horas</option>
                  <option>24 horas</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Proveedores incluidos</label>
                <select className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                  <option>3 finalistas</option>
                  <option>Todos los ofertantes</option>
                </select>
              </div>
            </div>
          </Card>

          <Button onClick={iniciarRonda}>
            <Gavel className="mr-2 h-4 w-4" /> Iniciar ronda de negociación
          </Button>
        </>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="gradient-hero p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Tiempo restante</p>
                  <p className="text-3xl font-bold">{formatCountdown(auction.deadlineMs)}</p>
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
            <div className="space-y-3">
              {ranking.map((item, i) => {
                const pos = i + 1;
                const cambio = item.montoInicial - item.monto;
                return (
                  <Card key={item.proveedorId} className={cn("p-4 transition-all", pos === 1 && "ring-2 ring-warning")}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg",
                        pos === 1 ? "bg-warning/20 text-warning-foreground" :
                        pos === 2 ? "bg-muted text-muted-foreground" :
                        "bg-bronze/20 text-bronze-foreground"
                      )}>
                        {pos === 1 ? <Crown className="h-6 w-6" /> : `${pos}°`}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.proveedor}</p>
                        <p className="text-sm text-muted-foreground">Oferta actual: ${item.monto.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("flex items-center gap-1 text-sm font-semibold", cambio > 0 ? "text-success" : "text-muted-foreground")}>
                          {cambio > 0 && <TrendingUp className="h-3.5 w-3.5 rotate-180" />}
                          {cambio > 0 ? `-$${cambio.toLocaleString()}` : "Sin cambios"}
                        </p>
                        <p className="text-xs text-muted-foreground">vs. ronda 1</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card className="border-warning/30 bg-warning/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">AC</div>
              <div className="flex-1">
                <p className="text-sm font-medium">Recomendación de la consultora</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ranking[0]?.proveedor} lidera con una mejora de ${(ranking[0]?.montoInicial - ranking[0]?.monto).toLocaleString()}. El margen de mejora restante suele ser marginal después de la primera hora — evalúa cerrar pronto para no dañar la relación con el proveedor.
                </p>
              </div>
              <ConfirmDialog
                trigger={<Button className="gradient-success text-white"><Check className="mr-2 h-4 w-4" /> Cerrar ronda</Button>}
                title="Cerrar ronda de negociación"
                description="Se congelará el resultado y se generará un acta digital con timestamp para auditoría."
                confirmLabel="Cerrar ronda"
                onConfirm={handleCerrarRonda}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
