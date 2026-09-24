import { describe, expect, it } from "vitest";
import { AHORA, datos } from "./__fixtures__/datos";
import { filtrar, kpis, rangos } from "./agregador";
import { construirInforme } from "./informe";
import { seccionACsv, textoCelda } from "./exportar";

describe("construirInforme", () => {
  const D = datos();
  const inf = construirInforme(D, {}, [], AHORA);
  const k = kpis(filtrar(D, {}), rangos(D).actual, AHORA);
  const sec = (id: string) => inf.secciones.find((s) => s.id === id)!;

  it("el resumen exportado trae exactamente los KPIs de pantalla", () => {
    const gasto = sec("resumen").filas.find((f) => f[0] === "Gasto comprometido")!;
    expect(gasto[1]).toBe(k.gasto);
    const ahorro = sec("resumen").filas.find((f) => f[0] === "Ahorro vs. presupuesto")!;
    expect(ahorro[1]).toBe(k.ahorro);
    expect(sec("resumen").tipoPorFila).toHaveLength(sec("resumen").filas.length);
  });

  it("categorías y meses suman el gasto total", () => {
    const porCat = sec("categorias").filas.reduce((s, f) => s + (f[1] as number), 0);
    const porMes = sec("mensual").filas.reduce((s, f) => s + (f[1] as number), 0);
    expect(porCat).toBe(k.gasto);
    expect(porMes).toBe(k.gasto);
    const shares = sec("categorias").filas.reduce((s, f) => s + (f[2] as number), 0);
    expect(shares).toBeCloseTo(1);
  });

  it("incluye detalle de procesos, pagos abiertos, vencimientos y hallazgos", () => {
    expect(sec("procesos").filas.length).toBe(4); // created or signed in the period
    expect(sec("pagos").filas.map((f) => f[5])).toEqual(["Vencido", "Pendiente"]);
    expect(sec("vencimientos").filas.map((f) => f[0])).toEqual(["c2"]);
    expect(sec("hallazgos").filas.length).toBe(inf.insights.length);
  });

  it("avisa de montos en otra moneda", () => {
    expect(inf.notas.some((n) => n.includes("otra moneda"))).toBe(true);
  });
});

describe("CSV y formato", () => {
  it("escapa comas y comillas y deja números crudos", () => {
    const csv = seccionACsv({
      id: "x",
      titulo: "X",
      columnas: [{ titulo: "Nombre", tipo: "texto" }, { titulo: "Monto", tipo: "moneda" }, { titulo: "Fecha", tipo: "fecha" }],
      filas: [["Acme, \"S.A.\"", 1234.5, "2026-03-01T05:00:00.000Z"], ["B", null, null]],
    });
    expect(csv.split("\n")).toEqual(["Nombre,Monto,Fecha", '"Acme, ""S.A.""",1234.5,2026-03-01', "B,,"]);
  });

  it("textoCelda formatea por tipo", () => {
    expect(textoCelda(0.256, "pct", "COP")).toBe("25,6%");
    expect(textoCelda(null, "moneda", "COP")).toBe("—");
    expect(textoCelda(3.14159, "decimal", "COP")).toBe("3,1");
  });
});
