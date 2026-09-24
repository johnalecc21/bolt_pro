import { describe, expect, it } from "vitest";
import { asignacionInicial, compararItems, preciosComparables, totalAsignacion } from "./items";

const items = [
  { id: "a", descripcion: "Portátil", cantidad: 10, unidad: "und" },
  { id: "b", descripcion: "Monitor", cantidad: 5, unidad: "und" },
  { id: "c", descripcion: "Cable", cantidad: 2.5, unidad: "m" },
];
const ofertas = [
  { proveedorId: "x", proveedor: "X", items: [{ itemId: "a", precioUnitario: 100 }, { itemId: "b", precioUnitario: 50 }, { itemId: "c", precioUnitario: 3 }] },
  { proveedorId: "y", proveedor: "Y", items: [{ itemId: "a", precioUnitario: 90 }, { itemId: "b", precioUnitario: 60 }] },
];

describe("comparativo por ítem", () => {
  const r = compararItems(items, ofertas);

  it("marca el más barato por línea y totaliza cada proveedor", () => {
    expect(r.filas.map((f) => f.mejor)).toEqual(["y", "x", "x"]);
    expect(r.filas[2].mejorSubtotal).toBe(8); // 2.5 × 3 = 7.5 → 8
    expect(r.totales).toEqual([
      { proveedorId: "x", proveedor: "X", lineas: 3, total: 1258, completa: true },
      { proveedorId: "y", proveedor: "Y", lineas: 2, total: 1200, completa: false },
    ]);
  });

  it("compara la mejor combinación con el mejor proveedor único completo", () => {
    expect(r.mejorCombinacion).toBe(900 + 250 + 8);
    expect(r.mejorUnico).toEqual({ proveedorId: "x", proveedor: "X", total: 1258 });
    expect(r.sinCotizar).toBe(0);
  });

  it("la asignación inicial es la mejor por línea y se puede cambiar", () => {
    const asig = asignacionInicial(r);
    expect(totalAsignacion(r, asig)).toEqual({ total: 1158, proveedores: 2, lineas: 3 });
    expect(totalAsignacion(r, { ...asig, a: "x", c: "" })).toEqual({ total: 1250, proveedores: 1, lineas: 2 });
  });

  it("líneas sin cotizar quedan sin ganador", () => {
    const sin = compararItems([...items, { id: "d", descripcion: "Mouse", cantidad: 1, unidad: "und" }], ofertas);
    expect(sin.filas[3].mejor).toBeNull();
    expect(sin.sinCotizar).toBe(1);
    expect(sin.mejorUnico).toBeNull();
  });

  it("precio comparable: las líneas no cotizadas cuentan al precio más alto", () => {
    const c = preciosComparables(r);
    expect(c.get("x")).toBe(1258);
    expect(c.get("y")).toBe(900 + 300 + 8);
  });
});
