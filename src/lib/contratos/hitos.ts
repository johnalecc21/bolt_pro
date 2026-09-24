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

export const PENALIDAD_DIARIA = 0.005;
export const PENALIDAD_TOPE = 0.1;

/**
 * The contract's standard penalty clause, estimated: 0.5% of the late
 * milestone's value per calendar day, capped at 10% of the contract. It's
 * informative — applying it is a decision of the buyer.
 */
export function penalidadEstimada(
  hitos: Hito[],
  montoContrato: number,
  ahora = Date.now(),
  /** What a milestone is worth when it isn't simply its % of today's value (e.g. the payment it already released). */
  valorDe?: (h: Hito) => number | undefined,
) {
  const detalle = hitos
    .map((h) => {
      const dias = diasDeAtraso(h, ahora);
      const base = valorDe?.(h) ?? Math.round((montoContrato * h.porcentaje) / 100);
      return { id: h.id, label: h.label, dias, base, valor: Math.round(base * PENALIDAD_DIARIA * dias) };
    })
    .filter((d) => d.dias > 0 && d.valor > 0);
  const bruto = detalle.reduce((s, d) => s + d.valor, 0);
  const tope = Math.round(montoContrato * PENALIDAD_TOPE);
  return { detalle, total: Math.min(bruto, tope), tope, topeAlcanzado: bruto > tope };
}
