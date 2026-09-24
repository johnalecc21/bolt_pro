import { formatMoney, formatMoneyCompact, type Moneda } from "@/lib/moneda";
import { METRICAS, type Metrica } from "./agregador";

export function formatoValor(m: Metrica, v: number | null | undefined, moneda: Moneda, compacto = false): string {
  if (v == null || Number.isNaN(v)) return "—";
  switch (METRICAS[m].formato) {
    case "moneda":
      return compacto ? formatMoneyCompact(v, moneda) : formatMoney(v, moneda);
    case "porcentaje":
      return formatPct(v);
    case "decimal":
      return v.toLocaleString("es-CO", { maximumFractionDigits: 1 });
    default:
      return Math.round(v).toLocaleString("es-CO");
  }
}

export function formatPct(v: number | null | undefined, decimales = 1): string {
  if (v == null || Number.isNaN(v)) return "—";
  return `${(v * 100).toLocaleString("es-CO", { maximumFractionDigits: decimales })}%`;
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function diasEntre(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}
