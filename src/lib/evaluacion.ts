/** Mirrors the backend's evaluaciones/puntaje.util — used to preview the score before submitting. */
export const CRITERIOS_EVALUACION = [
  { key: "calidad", label: "Calidad", peso: 0.35, ayuda: "El bien o servicio cumple lo especificado" },
  { key: "plazos", label: "Cumplimiento de plazos", peso: 0.3, ayuda: "Entregas e hitos a tiempo" },
  { key: "servicio", label: "Servicio y comunicación", peso: 0.2, ayuda: "Respuesta, soporte y trato" },
  { key: "hse", label: "HSE", peso: 0.15, ayuda: "Seguridad, salud en el trabajo y ambiente" },
] as const;

export type CriterioEvaluacion = (typeof CRITERIOS_EVALUACION)[number]["key"];
export type Criterios = Record<CriterioEvaluacion, number>;

export const UMBRAL_PLAN_MEJORA = 60;

/** Weighted average of 1-5 criteria scaled to 0-100 (all 1s → 20, all 5s → 100). */
export function calcularPuntaje(c: Criterios): number {
  const ponderado = CRITERIOS_EVALUACION.reduce((sum, { key, peso }) => sum + peso * c[key], 0);
  return Math.round((ponderado / 5) * 100);
}
