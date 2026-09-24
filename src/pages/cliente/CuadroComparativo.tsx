import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Trophy, AlertTriangle, Download, Settings, ArrowRight, SlidersHorizontal, FileQuestion } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { usePermissionMode } from "@/components/auth/RequireRole";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { fetchRequerimiento } from "@/lib/api/requerimientos";
import { fetchOfertasPorRequerimiento } from "@/lib/api/ofertas";
import { fetchAdjudicacion, crearAdjudicacion } from "@/lib/api/adjudicacion";
import { apiErrorMessage } from "@/lib/api/http";
import { ComparativoItems } from "@/components/cliente/ComparativoItems";
import { compararItems, preciosComparables } from "@/lib/comparativo/items";

import { formatMoney } from "@/lib/moneda";
const criterios = [
  { key: "precio", label: "Precio total", prefix: "", suffix: "", lowerIsBetter: true },
  { key: "plazo", label: "Plazo de entrega", prefix: "", suffix: " días", lowerIsBetter: true },
  { key: "calidad", label: "Calidad / Score", prefix: "", suffix: "", lowerIsBetter: false },
  { key: "pago", label: "Condiciones de pago", prefix: "", suffix: " días", lowerIsBetter: false },
] as const;

const defaultWeights = { precio: 40, plazo: 20, calidad: 25, pago: 15 };

function normalize(values: number[], lowerIsBetter: boolean) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 100);
  return values.map((v) => {
    const ratio = (v - min) / (max - min);
    return lowerIsBetter ? 100 - ratio * 100 : ratio * 100;
  });
}

function computeScores<T extends { precio: number; plazo: number; calidad: number; pago: number }>(ofertasBase: T[], weights: typeof defaultWeights) {
  const normalized: Record<string, number[]> = {};
  criterios.forEach((c) => {
    const values = ofertasBase.map((o) => o[c.key]);
    normalized[c.key] = normalize(values, c.lowerIsBetter);
  });
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  return ofertasBase.map((o, i) => {
    const score = criterios.reduce((sum, c) => sum + (normalized[c.key][i] * weights[c.key]) / totalWeight, 0);
    return { ...o, score: Math.round(score) };
  });
}

export function CuadroComparativo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const requerimientoId = id ?? "";
  const [adjudicando, setAdjudicando] = useState(false);
  const { data: requerimiento, loading: loadingReq } = useApiData(
    () => (requerimientoId ? fetchRequerimiento(requerimientoId) : new Promise<never>(() => {})),
    [requerimientoId],
  );
  const { data: ofertasData, loading: loadingOfertas } = useApiData(
    () => (requerimientoId ? fetchOfertasPorRequerimiento(requerimientoId) : Promise.resolve([])),
    [requerimientoId],
  );
  const { data: adjudicacion } = useApiData(
    () => (requerimientoId ? fetchAdjudicacion(requerimientoId) : Promise.resolve(null)),
    [requerimientoId],
  );
  const mode = usePermissionMode();
  const [weights, setWeights] = useState(defaultWeights);
  const [appliedWeights, setAppliedWeights] = useState(defaultWeights);
  const [showWeights, setShowWeights] = useState(false);

  const ofertasBase = (ofertasData ?? []).filter((o) => o.enviada);
  const lineas = requerimiento?.items ?? [];
  // Itemized tenders: a partial offer's total isn't comparable, so the ranking
  // scores a price where every unquoted line counts at its highest quote.
  const cobertura = useMemo(() => {
    if (lineas.length === 0) return null;
    const resumen = compararItems(lineas, ofertasBase);
    return { comparables: preciosComparables(resumen), lineas: new Map(resumen.totales.map((t) => [t.proveedorId, t.lineas])) };
  }, [lineas, ofertasBase]);
  const ofertas = useMemo(() => {
    if (!cobertura) return computeScores(ofertasBase, appliedWeights);
    const puntuadas = computeScores(ofertasBase.map((o) => ({ ...o, precio: cobertura.comparables.get(o.proveedorId) ?? o.precio })), appliedWeights);
    return puntuadas.map((o, i) => ({ ...o, precio: ofertasBase[i].precio }));
  }, [ofertasBase, appliedWeights, cobertura]);
  const parcial = (proveedorId: string) => {
    const n = cobertura?.lineas.get(proveedorId);
    return n != null && n < lineas.length ? `${n} de ${lineas.length} ítems` : null;
  };
  const sorted = [...ofertas].sort((a, b) => b.score - a.score);
  // Once a proceso has an adjudicación, the chosen winner(s) take precedence
  // over whatever the live weight sliders currently compute.
  const adjudicados = new Set(adjudicacion?.adjudicaciones.map((a) => a.proveedorId) ?? []);
  const principal = adjudicacion
    ? [...adjudicacion.adjudicaciones].sort((a, b) => b.precioFinal - a.precioFinal)[0]
    : undefined;
  const winner = principal
    ? ofertas.find((o) => o.proveedorId === principal.proveedorId) ?? sorted[0]
    : sorted[0];
  const itemizado = (requerimiento?.items.length ?? 0) > 0;
  const adjudicadoPorItem = adjudicacion
    ? Object.fromEntries(adjudicacion.adjudicaciones.flatMap((a) => a.lineas.map((l) => [l.itemId, a.proveedorId])))
    : undefined;
  const completas = ofertasBase.filter((o) => !parcial(o.proveedorId));
  const minPrecio = completas.length ? Math.min(...completas.map((o) => o.precio)) : 0;
  const weightSum = weights.precio + weights.plazo + weights.calidad + weights.pago;
  const benchmarkEstimado = ofertasBase.length
    ? Math.round(ofertasBase.reduce((sum, o) => sum + o.precio, 0) / ofertasBase.length)
    : 0;

  if (loadingReq || loadingOfertas) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando comparativo...</div>;
  }

  if (!requerimiento || ofertasBase.length === 0 || !winner) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileQuestion}
          title="Aún no hay comparativo para este requerimiento"
          description="El cuadro comparativo se genera automáticamente cuando la licitación recibe ofertas. Este proceso todavía no llegó a esa etapa."
        />
      </div>
    );
  }

  function aplicarPesos() {
    setAppliedWeights(weights);
    toast.warning("Pesos actualizados", { description: "El score de cada proveedor fue recalculado." });
  }

  async function adjudicarDirectamente() {
    setAdjudicando(true);
    try {
      if (!adjudicacion) {
        await crearAdjudicacion({ requerimientoId, proveedorId: winner.proveedorId });
      }
      navigate(`/cliente/adjudicacion/${requerimientoId}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo iniciar la adjudicación."));
    } finally {
      setAdjudicando(false);
    }
  }

  async function adjudicarPorItems(asignaciones: { itemId: string; proveedorId: string }[]) {
    try {
      await crearAdjudicacion({ requerimientoId, asignaciones });
      navigate(`/cliente/adjudicacion/${requerimientoId}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo adjudicar."));
    }
  }

  function exportarCSV() {
    const header = ["Proveedor", "Precio", "Plazo (días)", "Calidad", "Condiciones de pago (días)", "Score"];
    const rows = ofertas.map((o) => [o.proveedor, o.precio, o.plazo, o.calidad, o.pago, o.score]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparativo-${requerimientoId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Reporte exportado", { description: `comparativo-${requerimientoId}.csv` });
  }

  const brechaBenchmark = benchmarkEstimado > 0 ? Math.round(((benchmarkEstimado - winner.precio) / benchmarkEstimado) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuadro Comparativo de Ofertas</h1>
          <p className="text-sm text-muted-foreground">Comparativo generado automáticamente · {requerimiento.codigo} — {requerimiento.titulo}</p>
        </div>
        <div className="flex gap-2">
          {mode === "full" && (
            <Button variant="outline" className="gap-2" onClick={() => setShowWeights((v) => !v)}>
              <SlidersHorizontal className="h-4 w-4" /> Ajustar pesos
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={exportarCSV}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {showWeights && mode === "full" && (
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Pesos de criterios de evaluación</h3>
            <span className={cn("text-xs font-medium", weightSum === 100 ? "text-success" : "text-destructive")}>
              Suma: {weightSum}%{weightSum !== 100 && " (debe sumar 100%)"}
            </span>
          </div>
          {criterios.map((c) => (
            <div key={c.key} className="space-y-1.5">
              <div className="flex justify-between text-sm"><span>{c.label}</span><span className="font-medium">{weights[c.key]}%</span></div>
              <Slider
                value={[weights[c.key]]}
                max={100}
                step={5}
                onValueChange={([v]) => setWeights((prev) => ({ ...prev, [c.key]: v }))}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Ajustar los pesos recalcula el score de cada proveedor y queda registrado en el log de auditoría.</p>
          <Button size="sm" disabled={weightSum !== 100} onClick={aplicarPesos}>Aplicar y recalcular</Button>
        </Card>
      )}

      {/* Ranking */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {sorted.slice(0, 3).map((o, i) => (
          <Card key={o.proveedor} className={cn(
            "relative overflow-hidden p-5",
            i === 0 && "ring-2 ring-primary"
          )}>
            {i === 0 && (
              <div className="absolute right-0 top-0 rounded-bl-lg gradient-brand px-3 py-1 text-xs font-bold text-white">
                MEJOR VALOR
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm",
                i === 0 ? "bg-warning/20 text-warning-foreground" :
                i === 1 ? "bg-muted text-muted-foreground" :
                "bg-bronze/20 text-bronze-foreground"
              )}>
                {i === 0 ? "1°" : i === 1 ? "2°" : "3°"}
              </div>
              <div>
                <p className="font-semibold text-sm">{o.proveedor}</p>
                <p className="text-xs text-muted-foreground">Score: {o.score}/100</p>
              </div>
              {i === 0 && <Trophy className="ml-auto h-5 w-5 text-warning" />}
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Precio</span><span className="text-right font-medium">{formatMoney(o.precio, requerimiento.moneda)}{parcial(o.proveedorId) && <span className="block text-xs font-normal text-muted-foreground">cotizó {parcial(o.proveedorId)}</span>}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plazo</span><span className="font-medium">{o.plazo} días</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pago</span><span className="font-medium">{o.pago} días</span></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Criterio</th>
                {ofertas.map((o) => (
                  <th key={o.proveedor} className="p-4 text-left text-sm font-medium">
                    {o.proveedor}
                    {(adjudicacion ? adjudicados.has(o.proveedorId) : o.proveedor === winner.proveedor) && (
                      <Badge className="ml-2 bg-primary/10 text-primary text-[10px]">{adjudicacion ? "Adjudicado" : "Mejor score"}</Badge>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criterios.map((c) => {
                const values = ofertas.filter((o) => c.key !== "precio" || !parcial(o.proveedorId)).map((o) => o[c.key]);
                const best = c.lowerIsBetter ? Math.min(...values) : Math.max(...values);
                return (
                  <tr key={c.key} className="border-b border-border">
                    <td className="p-4 text-sm font-medium">{c.label}</td>
                    {ofertas.map((o) => {
                      const val = o[c.key];
                      // A partial offer's total isn't "the best price" of the tender.
                      const isBest = val === best && !(c.key === "precio" && parcial(o.proveedorId));
                      const isAnomaly = c.key === "precio" && minPrecio > 0 && val > minPrecio * 1.2;
                      return (
                        <td key={o.proveedor} className={cn("p-4 text-sm", isBest && "bg-success/10 font-semibold text-success")}>
                          <span className="flex items-center gap-1">
                            {c.key === "precio" ? formatMoney(val, requerimiento.moneda) : `${c.prefix}${val.toLocaleString()}${c.suffix}`}
                            {c.key === "precio" && parcial(o.proveedorId) && <span className="text-xs font-normal text-muted-foreground">({parcial(o.proveedorId)})</span>}
                            {isAnomaly && (
                              <span title="Oferta atípica — 20% sobre el mínimo">
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                              </span>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="border-b border-border bg-muted/30">
                <td className="p-4 text-sm font-bold">Score Total</td>
                {ofertas.map((o) => (
                  <td key={o.proveedor} className={cn("p-4 text-lg font-bold", o.proveedor === winner.proveedor && "text-primary")}>
                    {o.score}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {itemizado && (
        <ComparativoItems
          items={requerimiento.items}
          ofertas={ofertasBase}
          moneda={requerimiento.moneda}
          adjudicado={adjudicadoPorItem}
          onAdjudicar={mode === "full" && !adjudicacion ? adjudicarPorItems : undefined}
        />
      )}

      {/* Benchmark */}
      <div className="rounded-lg bg-info/10 p-4 text-sm text-info">
        <strong>Precio promedio de las ofertas recibidas:</strong> <strong>{formatMoney(benchmarkEstimado, requerimiento.moneda)}</strong>. La oferta de {winner.proveedor} está <strong className={brechaBenchmark >= 0 ? "text-success" : "text-destructive"}>{Math.abs(brechaBenchmark)}% {brechaBenchmark >= 0 ? "por debajo" : "por encima"}</strong> del promedio.
      </div>

      {/* Actions */}
      {mode === "full" && adjudicacion && (
        <div className="flex gap-3">
          <Button asChild className="gap-2">
            <Link to={`/cliente/adjudicacion/${requerimientoId}`}>
              <ArrowRight className="h-4 w-4" /> Ver adjudicación
            </Link>
          </Button>
        </div>
      )}
      {mode === "full" && !adjudicacion && ofertas.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {ofertas.length >= 2 && (
            <Button asChild variant="outline" className="gap-2">
              <Link to={`/cliente/negociacion/${requerimientoId}`}>
                <Settings className="h-4 w-4" /> Iniciar negociación
              </Link>
            </Button>
          )}
          <Button className="gap-2" variant={itemizado ? "outline" : "default"} onClick={adjudicarDirectamente} disabled={adjudicando}>
            <ArrowRight className="h-4 w-4" /> {adjudicando ? "Adjudicando..." : `Adjudicar todo a ${winner?.proveedor ?? "la mejor oferta"}`}
          </Button>
        </div>
      )}
    </div>
  );
}
