export type Moneda = "COP" | "USD" | "MXN" | "PEN" | "CLP" | "BRL";

export const MONEDAS: { value: Moneda; label: string }[] = [
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "USD", label: "USD — Dólar estadounidense" },
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "PEN", label: "PEN — Sol peruano" },
  { value: "CLP", label: "CLP — Peso chileno" },
  { value: "BRL", label: "BRL — Real brasileño" },
];

export const PAISES: { value: string; label: string }[] = [
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "México" },
  { value: "PE", label: "Perú" },
  { value: "CL", label: "Chile" },
  { value: "BR", label: "Brasil" },
  { value: "GT", label: "Guatemala" },
  { value: "US", label: "Estados Unidos" },
];

/** Locale that writes each currency the way its own market does — mirrors the backend's moneda.util. */
const LOCALE: Record<Moneda, string> = {
  COP: "es-CO",
  USD: "en-US",
  MXN: "es-MX",
  PEN: "es-PE",
  CLP: "es-CL",
  BRL: "pt-BR",
};

/**
 * Amounts are stored as whole units. Several currencies share the bare "$"
 * symbol, so the ISO code is appended to disambiguate (except BRL's "R$").
 */
export function formatMoney(monto: number, moneda: Moneda = "USD"): string {
  const formatted = new Intl.NumberFormat(LOCALE[moneda], {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
  return moneda === "BRL" ? formatted : `${formatted} ${moneda}`;
}

/** Short axis/tick label: "$12K", "$3,4M" — symbol only, no code. */
export function formatMoneyCompact(monto: number, moneda: Moneda = "USD"): string {
  return new Intl.NumberFormat(LOCALE[moneda], {
    style: "currency",
    currency: moneda,
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(monto);
}
