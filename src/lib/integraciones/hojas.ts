import type { Celda, Seccion, TipoColumna } from "@/lib/analitica/informe";
import type { FilaErp, HojasErp } from "@/lib/api/integraciones";

/** Sheet order and names in the import file (stable: ERPs map them once). */
export const HOJAS: { id: keyof HojasErp; titulo: string }[] = [
  { id: "terceros", titulo: "Terceros" },
  { id: "ordenes", titulo: "Ordenes" },
  { id: "lineas", titulo: "Lineas" },
  { id: "recepciones", titulo: "Recepciones" },
  { id: "facturas", titulo: "Facturas" },
  { id: "pagos", titulo: "Pagos" },
];

const MONEDA = /^(valor|precio|subtotal|descuento)/;

/** Column type from the (stable) column name, for Excel number/date formats. */
export function tipoColumna(nombre: string): TipoColumna {
  if (nombre.startsWith("fecha_") || nombre.startsWith("vigencia_")) return "fecha";
  if (MONEDA.test(nombre)) return "moneda";
  if (nombre === "cantidad") return "decimal";
  if (nombre === "linea" || nombre === "porcentaje" || nombre === "dias_pago") return "entero";
  return "texto";
}

const celda = (v: FilaErp[string]): Celda => (typeof v === "boolean" ? (v ? "SI" : "NO") : v);

/**
 * Backend sheets → the generic Excel/CSV exporter's sections. Headers are the
 * raw column names (what import templates expect), not prettified titles.
 */
export function hojasASecciones(hojas: HojasErp): Seccion[] {
  return HOJAS.filter((h) => hojas[h.id].length > 0).map((h) => {
    const filas = hojas[h.id];
    const columnas = Object.keys(filas[0]);
    return {
      id: h.id,
      titulo: h.titulo,
      columnas: columnas.map((c) => ({ titulo: c, tipo: tipoColumna(c) })),
      filas: filas.map((f) => columnas.map((c) => celda(f[c] ?? null))),
    };
  });
}

export function totalFilas(hojas: HojasErp) {
  return HOJAS.reduce((s, h) => s + hojas[h.id].length, 0);
}
