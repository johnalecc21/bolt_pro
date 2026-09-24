/** YYYY-MM-DD of a local date. */
export function isoDia(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type PresetPeriodo = "3m" | "6m" | "12m" | "anio" | "anioAnterior" | "personalizado";

export const PRESETS: { id: Exclude<PresetPeriodo, "personalizado">; etiqueta: string }[] = [
  { id: "3m", etiqueta: "Últimos 3 meses" },
  { id: "6m", etiqueta: "Últimos 6 meses" },
  { id: "12m", etiqueta: "Últimos 12 meses" },
  { id: "anio", etiqueta: "Este año" },
  { id: "anioAnterior", etiqueta: "Año anterior" },
];

/** Whole calendar months: "últimos 6 meses" = the current month and the 5 before it. */
export function rangoPreset(p: Exclude<PresetPeriodo, "personalizado">, hoy = new Date()): { desde: string; hasta: string } {
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  switch (p) {
    case "3m":
    case "6m":
    case "12m": {
      const n = Number(p.replace("m", ""));
      return { desde: isoDia(new Date(y, m - (n - 1), 1)), hasta: isoDia(hoy) };
    }
    case "anio":
      return { desde: `${y}-01-01`, hasta: isoDia(hoy) };
    case "anioAnterior":
      return { desde: `${y - 1}-01-01`, hasta: `${y - 1}-12-31` };
  }
}
