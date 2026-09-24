import { formatMoney } from "@/lib/moneda";
import { agrupar, concentracion, exposicion, kpis, variacion, type DatosFiltrados, type Rango } from "./agregador";
import type { EjecucionCentro } from "./tipos";

export type NivelInsight = "critico" | "atencion" | "positivo" | "info";

export interface Insight {
  nivel: NivelInsight;
  titulo: string;
  detalle: string;
  /** Screen where the reader can act on it. */
  enlace?: { to: string; texto: string };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/**
 * Findings derived only from the filtered data — every sentence can be traced
 * back to a number shown elsewhere on the dashboard. Ordered by severity.
 */
export function generarInsights(
  d: DatosFiltrados,
  actual: Rango,
  anterior: Rango,
  centros: EjecucionCentro[],
  ahora = Date.now(),
): Insight[] {
  const out: Insight[] = [];
  const moneda = d.moneda;
  const k = kpis(d, actual, ahora);
  const kPrev = kpis(d, anterior, ahora);
  const conc = concentracion(d, actual);
  const expo = exposicion(d, ahora);

  if (expo.nPagosVencidos > 0) {
    out.push({
      nivel: "critico",
      titulo: `${expo.nPagosVencidos} pago(s) vencido(s) por ${formatMoney(expo.pagosVencidos, moneda)}`,
      detalle: "Pagos a proveedores con la fecha pactada ya cumplida. Afectan la relación y pueden generar intereses.",
      enlace: { to: "/cliente/seguimiento", texto: "Ver seguimiento" },
    });
  }

  const sobreEjecutados = centros.filter((c) => c.ejecucion && c.ejecucion.porcentajeUsado > 100);
  const alLimite = centros.filter((c) => c.ejecucion && c.ejecucion.porcentajeUsado >= 90 && c.ejecucion.porcentajeUsado <= 100);
  if (sobreEjecutados.length) {
    out.push({
      nivel: "critico",
      titulo: `${sobreEjecutados.length} centro(s) de costo sobre el presupuesto`,
      detalle: sobreEjecutados.map((c) => `${c.codigo} (${c.ejecucion!.porcentajeUsado}%)`).join(", "),
      enlace: { to: "/cliente/estructura", texto: "Revisar presupuestos" },
    });
  }
  if (alLimite.length) {
    out.push({
      nivel: "atencion",
      titulo: `${alLimite.length} centro(s) de costo por encima del 90% de su presupuesto`,
      detalle: alLimite.map((c) => `${c.codigo} (${c.ejecucion!.porcentajeUsado}%)`).join(", "),
      enlace: { to: "/cliente/estructura", texto: "Revisar presupuestos" },
    });
  }

  if (conc.top1 && conc.top1.share > 0.4 && conc.proveedores.length > 1) {
    out.push({
      nivel: "atencion",
      titulo: `${conc.top1.nombre} concentra el ${pct(conc.top1.share)} del gasto`,
      detalle: `Índice de concentración (HHI) ${conc.hhi.toLocaleString("es-CO")}: dependencia ${conc.nivel}. Considera homologar alternativas.`,
      enlace: { to: "/cliente/directorio", texto: "Buscar proveedores" },
    });
  }

  const porCategoria = agrupar(d, "gasto", "categoria", actual);
  const totalGasto = porCategoria.reduce((s, g) => s + g.valor, 0);
  const catTop = porCategoria[0];
  if (catTop && totalGasto > 0 && porCategoria.length > 1 && catTop.valor / totalGasto > 0.35) {
    out.push({
      nivel: "info",
      titulo: `${catTop.etiqueta} representa el ${pct(catTop.valor / totalGasto)} del gasto`,
      detalle: "Es la categoría con más peso: donde un punto de ahorro rinde más.",
    });
  }

  const competencia = agrupar(d, "ofertasPromedio", "categoria", actual).filter((g) => g.n >= 2 && g.valor < 2);
  if (competencia.length) {
    out.push({
      nivel: "atencion",
      titulo: `Baja competencia en ${competencia.map((g) => g.etiqueta).join(", ")}`,
      detalle: "Menos de 2 ofertas por proceso en promedio: invitar más proveedores homologados suele bajar el precio.",
      enlace: { to: "/cliente/directorio", texto: "Ampliar la base de proveedores" },
    });
  }

  if (k.cicloDias != null) {
    const lentas = agrupar(d, "cicloDias", "categoria", actual).filter((g) => g.n >= 2 && g.valor > k.cicloDias! * 1.5);
    if (lentas.length) {
      out.push({
        nivel: "atencion",
        titulo: `Ciclo lento en ${lentas.map((g) => g.etiqueta).join(", ")}`,
        detalle: `Tardan más de 1,5 veces el promedio de ${Math.round(k.cicloDias)} días entre la solicitud y el contrato.`,
      });
    }
  }

  if (k.entregaATiempo != null && k.entregaATiempo < 0.8) {
    out.push({
      nivel: "atencion",
      titulo: `Solo el ${pct(k.entregaATiempo)} de los hitos se entregó a tiempo`,
      detalle: "Revisa los proveedores con hitos atrasados y registra su evaluación de desempeño.",
      enlace: { to: "/cliente/seguimiento", texto: "Ver seguimiento" },
    });
  }

  const planMejora = new Set(d.evaluaciones.filter((e) => e.planMejora).map((e) => e.proveedor));
  if (planMejora.size) {
    out.push({
      nivel: "atencion",
      titulo: `${planMejora.size} proveedor(es) con evaluación bajo 60/100`,
      detalle: [...planMejora].join(", "),
    });
  }

  if (expo.contratosPorVencer.length) {
    out.push({
      nivel: "info",
      titulo: `${expo.contratosPorVencer.length} contrato(s) vencen en los próximos 90 días`,
      detalle: `${formatMoney(expo.montoPorVencer, moneda)} en contratos a renovar o volver a licitar.`,
      enlace: { to: "/cliente/contratos", texto: "Ver contratos" },
    });
  }

  const cambioAhorro = variacion(k.ahorro, kPrev.ahorro);
  if (k.ahorro > 0 && cambioAhorro != null && Math.abs(cambioAhorro) >= 0.1) {
    out.push({
      nivel: cambioAhorro > 0 ? "positivo" : "atencion",
      titulo: `El ahorro ${cambioAhorro > 0 ? "subió" : "bajó"} ${pct(Math.abs(cambioAhorro))} frente al período anterior`,
      detalle: `${formatMoney(k.ahorro, moneda)} en este período vs. ${formatMoney(kPrev.ahorro, moneda)} en el anterior.`,
    });
  }

  if (k.ahorroNegociacion > 0) {
    out.push({
      nivel: "positivo",
      titulo: `La negociación en vivo aportó ${formatMoney(k.ahorroNegociacion, moneda)}`,
      detalle: `Se negoció el ${pct(k.tasaNegociacion ?? 0)} de los procesos adjudicados.`,
    });
  }

  const orden: Record<NivelInsight, number> = { critico: 0, atencion: 1, positivo: 2, info: 3 };
  return out.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
}
