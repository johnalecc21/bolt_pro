import { describe, expect, it } from "vitest";
import { hojasASecciones, tipoColumna, totalFilas } from "./hojas";

const vacio = { terceros: [], ordenes: [], lineas: [], recepciones: [], facturas: [], pagos: [] };

describe("hojas del archivo ERP", () => {
  it("tipos por nombre de columna", () => {
    expect(tipoColumna("fecha_pago")).toBe("fecha");
    expect(tipoColumna("vigencia_fin")).toBe("fecha");
    expect(tipoColumna("valor_a_pagar")).toBe("moneda");
    expect(tipoColumna("precio_unitario")).toBe("moneda");
    expect(tipoColumna("cantidad")).toBe("decimal");
    expect(tipoColumna("nit_proveedor")).toBe("texto");
  });

  it("solo hojas con filas, encabezados crudos y booleanos como SI/NO", () => {
    const s = hojasASecciones({ ...vacio, ordenes: [{ codigo: "PO-1", anulada: true, valor_total: 10 }] });
    expect(s).toHaveLength(1);
    expect(s[0].titulo).toBe("Ordenes");
    expect(s[0].columnas.map((c) => c.titulo)).toEqual(["codigo", "anulada", "valor_total"]);
    expect(s[0].filas).toEqual([["PO-1", "SI", 10]]);
    expect(totalFilas({ ...vacio, pagos: [{ a: 1 }, { a: 2 }] })).toBe(2);
  });
});
