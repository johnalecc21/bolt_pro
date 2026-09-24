/**
 * Line-by-line comparison of an itemized tender: who is cheapest per line,
 * what the best combination costs against the best single supplier, and the
 * award assignment the buyer starts from. Pure, so it's tested on its own.
 */

export interface ItemComparable {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
}

export interface OfertaComparable {
  proveedorId: string;
  proveedor: string;
  items: { itemId: string; precioUnitario: number }[];
}

/** Same rounding as the server: whole currency units per line. */
export const subtotalLinea = (cantidad: number, precioUnitario: number) => Math.round(cantidad * precioUnitario);

export interface CeldaItem {
  proveedorId: string;
  precioUnitario: number | null;
  subtotal: number | null;
}

export interface FilaItem {
  item: ItemComparable;
  celdas: CeldaItem[];
  /** Cheapest supplier for the line (first one on ties); null when nobody quoted it. */
  mejor: string | null;
  mejorSubtotal: number | null;
  cotizaciones: number;
}

export interface ResumenItems {
  filas: FilaItem[];
  /** Per supplier: lines quoted and the sum of its quoted lines. */
  totales: { proveedorId: string; proveedor: string; lineas: number; total: number; completa: boolean }[];
  /** Cheapest line by line (lines with no quote are left out). */
  mejorCombinacion: number;
  /** Best supplier that quoted every line, if any. */
  mejorUnico: { proveedorId: string; proveedor: string; total: number } | null;
  sinCotizar: number;
}

export function compararItems(items: ItemComparable[], ofertas: OfertaComparable[]): ResumenItems {
  const precio = new Map(ofertas.map((o) => [o.proveedorId, new Map(o.items.map((i) => [i.itemId, i.precioUnitario]))]));
  const filas: FilaItem[] = items.map((item) => {
    const celdas = ofertas.map((o) => {
      const pu = precio.get(o.proveedorId)!.get(item.id);
      return { proveedorId: o.proveedorId, precioUnitario: pu ?? null, subtotal: pu == null ? null : subtotalLinea(item.cantidad, pu) };
    });
    let mejor: CeldaItem | null = null;
    for (const c of celdas) if (c.subtotal != null && (mejor == null || c.subtotal < mejor.subtotal!)) mejor = c;
    return {
      item,
      celdas,
      mejor: mejor?.proveedorId ?? null,
      mejorSubtotal: mejor?.subtotal ?? null,
      cotizaciones: celdas.filter((c) => c.subtotal != null).length,
    };
  });
  const totales = ofertas.map((o, k) => {
    const cotizadas = filas.filter((f) => f.celdas[k].subtotal != null);
    return {
      proveedorId: o.proveedorId,
      proveedor: o.proveedor,
      lineas: cotizadas.length,
      total: cotizadas.reduce((s, f) => s + f.celdas[k].subtotal!, 0),
      completa: cotizadas.length === items.length,
    };
  });
  const completas = totales.filter((t) => t.completa).sort((a, b) => a.total - b.total);
  return {
    filas,
    totales,
    mejorCombinacion: filas.reduce((s, f) => s + (f.mejorSubtotal ?? 0), 0),
    mejorUnico: completas[0] ? { proveedorId: completas[0].proveedorId, proveedor: completas[0].proveedor, total: completas[0].total } : null,
    sinCotizar: filas.filter((f) => f.cotizaciones === 0).length,
  };
}

/** Starting assignment: each line to its cheapest supplier ("" = not awarded). */
export function asignacionInicial(resumen: ResumenItems): Record<string, string> {
  return Object.fromEntries(resumen.filas.map((f) => [f.item.id, f.mejor ?? ""]));
}

/** What the chosen assignment costs and how many suppliers it involves. */
export function totalAsignacion(resumen: ResumenItems, asignacion: Record<string, string>) {
  let total = 0;
  const proveedores = new Set<string>();
  let lineas = 0;
  for (const f of resumen.filas) {
    const p = asignacion[f.item.id];
    if (!p) continue;
    const celda = f.celdas.find((c) => c.proveedorId === p);
    if (celda?.subtotal == null) continue;
    total += celda.subtotal;
    proveedores.add(p);
    lineas++;
  }
  return { total, proveedores: proveedores.size, lineas };
}

/**
 * A price the ranking can compare across partial offers: each line a supplier
 * didn't quote counts at the highest price anyone quoted for it, so quoting
 * fewer lines never looks cheaper. Equals the real total for complete offers.
 */
export function preciosComparables(resumen: ResumenItems): Map<string, number> {
  const out = new Map<string, number>();
  resumen.totales.forEach((t, k) => {
    let total = 0;
    for (const f of resumen.filas) {
      const propio = f.celdas[k].subtotal;
      const peor = Math.max(0, ...f.celdas.map((c) => c.subtotal ?? 0));
      total += propio ?? peor;
    }
    out.set(t.proveedorId, total);
  });
  return out;
}
