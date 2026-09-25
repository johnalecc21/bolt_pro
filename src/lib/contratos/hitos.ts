import type { Hito } from "@/lib/api/seguimiento";

const MS_DIA = 86_400_000;
const dia = (fecha: string) => new Date(`${fecha}T00:00:00`).getTime();

export type EstadoGeneral = "sin_hitos" | "completado" | "atrasado" | "en_riesgo" | "en_curso";

export const ESTADO_GENERAL: Record<EstadoGeneral, string> = {
  sin_hitos: "Sin hitos",
  completado: "Completado",
  atrasado: "Con atrasos",
  en_riesgo: "En riesgo",
  en_curso: "En curso",
};

/** How a contract's deliveries are going, from its milestones (worst one wins). */
export function estadoGeneral(hitos: Hito[]): EstadoGeneral {
  if (hitos.length === 0) return "sin_hitos";
  if (hitos.some((h) => h.estado === "atrasado")) return "atrasado";
  if (hitos.some((h) => h.estado === "en_riesgo")) return "en_riesgo";
  if (hitos.every((h) => h.estado === "completado")) return "completado";
  return "en_curso";
}

/** Days a milestone ran (or is running) past its committed date. */
export function diasDeAtraso(h: Hito, ahora = Date.now()): number {
  const fin = h.estado === "completado" ? (h.real ? dia(h.real) : null) : ahora;
  if (fin == null) return 0;
  return Math.max(0, Math.floor((fin - dia(h.comprometido)) / MS_DIA));
}

import type { ReglaPenalidad } from "@/lib/api/contratos";

const pct = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 3 });

/** "0,5 % diario del valor del hito atrasado, tope 10 % del contrato, 3 días de gracia". */
export function describirPenalidad(r: ReglaPenalidad) {
  return `${pct(r.diaria)} % diario ${r.base === "CONTRATO" ? "del valor del contrato" : "del valor del hito atrasado"}, tope ${pct(r.tope)} % del contrato${r.diasGracia ? `, ${r.diasGracia} día(s) de gracia` : ""}`;
}

/**
 * The company's own penalty clause, estimated. Without a clause (the company
 * didn't set one) there is no penalty. It's informative — applying it is a
 * decision of the buyer.
 */
export function penalidadEstimada(
  hitos: Hito[],
  montoContrato: number,
  regla: ReglaPenalidad | null,
  ahora = Date.now(),
  /** What a milestone is worth when it isn't simply its % of today's value (e.g. the payment it already released). */
  valorDe?: (h: Hito) => number | undefined,
) {
  const vacio = { detalle: [] as { id: string; label: string; dias: number; base: number; valor: number }[], total: 0, tope: 0, topeAlcanzado: false };
  if (!regla) return vacio;
  const diaria = regla.diaria / 100;
  const detalle = hitos
    .map((h) => {
      const dias = Math.max(0, diasDeAtraso(h, ahora) - regla.diasGracia);
      const base = regla.base === "CONTRATO" ? montoContrato : (valorDe?.(h) ?? Math.round((montoContrato * h.porcentaje) / 100));
      return { id: h.id, label: h.label, dias, base, valor: Math.round(base * diaria * dias) };
    })
    .filter((d) => d.dias > 0 && d.valor > 0);
  // On the contract value, the days of delay count once (the longest), not per milestone.
  const bruto =
    regla.base === "CONTRATO"
      ? Math.round(montoContrato * diaria * Math.max(0, ...detalle.map((d) => d.dias)))
      : detalle.reduce((s, d) => s + d.valor, 0);
  const tope = Math.round((montoContrato * regla.tope) / 100);
  return { detalle, total: Math.min(bruto, tope), tope, topeAlcanzado: bruto > tope };
}
