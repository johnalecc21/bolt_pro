import { describe, expect, it } from "vitest";
import {
  agrupar,
  concentracion,
  dimensionesDe,
  embudo,
  excluidosPorMoneda,
  exposicion,
  filtrar,
  kpis,
  METRICAS,
  plegar,
  rangos,
  variacion,
  type Metrica,
} from "./agregador";
import { generarInsights } from "./insights";
import { AHORA, datos } from "./__fixtures__/datos";

describe("kpis", () => {
  const D = datos();
  const { actual, anterior } = rangos(D);
  const d = filtrar(D, {});

  it("suma el gasto sin duplicar POs bajo contrato marco ni mezclar monedas", () => {
    const k = kpis(d, actual, AHORA);
    expect(k.gasto).toBe(800 + 1500);
    expect(k.contratos).toBe(3); // c1, c2 and the USD contract (counted, not summed)
    expect(excluidosPorMoneda(d, actual)).toEqual({ contratos: 1, porMoneda: [{ moneda: "USD", monto: 50 }] });
  });

  it("calcula ahorro, ahorro % y ahorro por negociación sobre los procesos firmados", () => {
    const k = kpis(d, actual, AHORA);
    expect(k.ahorro).toBe(200 + 500);
    expect(k.presupuestoAdjudicado).toBe(3000);
    expect(k.ahorroPct).toBeCloseTo(700 / 3000);
    expect(k.ahorroNegociacion).toBe(200);
    expect(k.procesosAdjudicados).toBe(3); // r1, r2, rx
    expect(k.tasaNegociacion).toBeCloseTo(1 / 3);
  });

  it("mide ciclo, competencia, rechazo, entrega a tiempo y desempeño", () => {
    const k = kpis(d, actual, AHORA);
    expect(k.cicloDias).toBeGreaterThan(0);
    expect(k.ofertasPromedio).toBeCloseTo((3 + 1 + 3) / 3);
    expect(k.procesosCreados).toBe(4);
    expect(k.tasaRechazo).toBeCloseTo(1 / 4);
    expect(k.entregaATiempo).toBeCloseTo(1 / 2); // the September milestone is not due yet
    expect(k.desempenoPromedio).toBe(70);
  });

  it("el período anterior usa sus propias filas", () => {
    const k = kpis(d, anterior, AHORA);
    expect(k.gasto).toBe(950);
    expect(k.ahorro).toBe(50);
    expect(variacion(700, 50)).toBeCloseTo(13);
    expect(variacion(10, 0)).toBeNull();
  });
});

describe("agrupar es consistente con los KPIs", () => {
  const D = datos();
  const { actual } = rangos(D);
  const d = filtrar(D, {});
  const k = kpis(d, actual, AHORA);
  const sumable: Metrica[] = ["gasto", "contratos", "ahorro", "procesosCreados", "procesosAdjudicados", "ahorroNegociacion"];

  for (const m of sumable) {
    for (const dim of dimensionesDe(m)) {
      it(`${m} por ${dim} suma lo mismo que el KPI`, () => {
        const total = agrupar(d, m, dim, actual).reduce((s, g) => s + g.valor, 0);
        expect(total).toBeCloseTo(k[m as keyof typeof k] as number);
      });
    }
  }

  it("los ratios se calculan sobre sumas, no promediando promedios", () => {
    const porCat = agrupar(d, "ahorroPct", "categoria", actual);
    expect(porCat.find((g) => g.clave === "Servicios")!.valor).toBeCloseTo(500 / 2000);
    expect(porCat.find((g) => g.clave === "TI")!.valor).toBeCloseTo(200 / 1000);
  });

  it("los ejes de tiempo incluyen todos los meses del período, también los vacíos", () => {
    const meses = agrupar(d, "gasto", "mes", actual);
    expect(meses.map((g) => g.clave)).toEqual(["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]);
    expect(meses[0].valor).toBe(0);
    expect(agrupar(d, "gasto", "trimestre", actual).map((g) => g.etiqueta)).toEqual(["T1 2026", "T2 2026"]);
  });

  it("todas las métricas declaradas se pueden agrupar sin error", () => {
    for (const m of Object.keys(METRICAS) as Metrica[]) for (const dim of dimensionesDe(m)) expect(() => agrupar(d, m, dim, actual)).not.toThrow();
  });
});

describe("filtros", () => {
  const D = datos();
  const { actual } = rangos(D);

  it("por unidad también filtra pagos y hitos que solo traen el centro", () => {
    const d = filtrar(D, { unidadId: "u2" });
    expect(d.contratos.every((c) => c.unidadId === "u2")).toBe(true);
    expect(d.pagos.map((p) => p.id)).toEqual(["p2"]);
    expect(kpis(d, actual, AHORA).gasto).toBe(1500);
  });

  it("por categoría y centro", () => {
    expect(kpis(filtrar(D, { categoria: "TI" }), actual, AHORA).gasto).toBe(800);
    expect(kpis(filtrar(D, { centroCostoId: "cc1" }), actual, AHORA).ahorro).toBe(200);
  });
});

describe("concentración, embudo, exposición", () => {
  const D = datos();
  const { actual, anterior } = rangos(D);
  const d = filtrar(D, {});

  it("HHI sobre las participaciones de gasto", () => {
    const c = concentracion(d, actual);
    expect(c.top1).toEqual({ nombre: "Prov B", share: 1500 / 2300 });
    expect(c.hhi).toBe(Math.round((1500 / 2300 * 100) ** 2 + (800 / 2300 * 100) ** 2));
    expect(c.nivel).toBe("alta");
  });

  it("el embudo cuenta procesos creados según hasta dónde llegaron", () => {
    expect(embudo(d, actual).map((e) => e.procesos)).toEqual([4, 4, 3, 3, 3]);
  });

  it("pagos vencidos, próximos y contratos por vencer se miden a hoy", () => {
    const e = exposicion(d, AHORA);
    expect(e.pagosPendientes).toBe(700);
    expect(e.pagosVencidos).toBe(400);
    expect(e.pagosProximos30).toBe(300);
    expect(e.contratosPorVencer.map((c) => c.codigo)).toEqual(["c2"]);
  });

  it("plegar agrupa la cola en 'Otros' sin perder el total", () => {
    const grupos = Array.from({ length: 12 }, (_, i) => ({ clave: `k${i}`, etiqueta: `k${i}`, valor: 12 - i, n: 1 }));
    const p = plegar(grupos, "gasto", 8);
    expect(p).toHaveLength(8);
    expect(p[7].etiqueta).toBe("Otros (5)");
    expect(p.reduce((s, g) => s + g.valor, 0)).toBe(grupos.reduce((s, g) => s + g.valor, 0));
  });

  it("los hallazgos salen de los datos y van ordenados por severidad", () => {
    const ins = generarInsights(d, actual, anterior, D.presupuestos[0].centros, AHORA);
    const titulos = ins.map((i) => i.titulo);
    expect(ins[0].nivel).toBe("critico");
    expect(titulos.some((t) => t.includes("pago(s) vencido(s)"))).toBe(true);
    expect(titulos.some((t) => t.includes("sobre el presupuesto"))).toBe(true);
    expect(titulos.some((t) => t.includes("Prov B concentra"))).toBe(true);
    expect(titulos.some((t) => t.includes("bajo 60/100"))).toBe(true);
  });
});
