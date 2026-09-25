import { describe, expect, it } from "vitest";
import { diasDeAtraso, estadoGeneral, penalidadEstimada } from "./hitos";
import type { Hito } from "@/lib/api/seguimiento";

const AHORA = new Date("2026-06-20T12:00:00").getTime();
const hito = (id: string, extra: Partial<Hito>): Hito => ({
  id, label: id, comprometido: "2026-06-10", real: null, estado: "pendiente", porcentaje: 0, pagoGeneradoId: null,
  avanceProveedor: null, avanceReportadoAt: null, ...extra,
});

describe("hitos del contrato", () => {
  it("estado general: el peor gana; todo pendiente no es 'a tiempo'", () => {
    expect(estadoGeneral([])).toBe("sin_hitos");
    expect(estadoGeneral([hito("a", {})])).toBe("en_curso");
    expect(estadoGeneral([hito("a", { estado: "completado" }), hito("b", { estado: "en_riesgo" })])).toBe("en_riesgo");
    expect(estadoGeneral([hito("a", { estado: "atrasado" }), hito("b", { estado: "en_riesgo" })])).toBe("atrasado");
    expect(estadoGeneral([hito("a", { estado: "completado" })])).toBe("completado");
  });

  it("días de atraso: completados según su fecha real, abiertos hasta hoy", () => {
    expect(diasDeAtraso(hito("a", { estado: "completado", real: "2026-06-13" }), AHORA)).toBe(3);
    expect(diasDeAtraso(hito("a", { estado: "completado", real: "2026-06-08" }), AHORA)).toBe(0);
    expect(diasDeAtraso(hito("a", { estado: "atrasado" }), AHORA)).toBe(10);
  });

  const REGLA = { diaria: 0.5, tope: 10, diasGracia: 0, base: "HITO" as const, texto: "x" };

  it("sin cláusula de la empresa no hay penalidad", () => {
    const p = penalidadEstimada([hito("a", { estado: "atrasado", porcentaje: 100, comprometido: "2026-01-01" })], 1_000_000, null, AHORA);
    expect(p.total).toBe(0);
    expect(p.detalle).toEqual([]);
  });

  it("usa los días de gracia y la base que definió la empresa", () => {
    const hs = [hito("a", { estado: "atrasado", porcentaje: 40 }), hito("b", { estado: "atrasado", porcentaje: 60, comprometido: "2026-06-05" })];
    const gracia = penalidadEstimada(hs, 1_000_000, { ...REGLA, diasGracia: 3 }, AHORA);
    expect(gracia.detalle.map((d) => d.dias)).toEqual([7, 12]);
    const contrato = penalidadEstimada(hs, 1_000_000, { ...REGLA, base: "CONTRATO", diaria: 0.1, tope: 50 }, AHORA);
    // Longest delay (15 days) × 0,1 % of the contract, counted once.
    expect(contrato.total).toBe(15_000);
  });

  it("penalidad: 0,5% diario del hito, tope 10% del contrato", () => {
    const p = penalidadEstimada([hito("a", { estado: "atrasado", porcentaje: 40 }), hito("b", { porcentaje: 60, comprometido: "2026-07-01" })], 1_000_000, REGLA, AHORA);
    expect(p.detalle).toEqual([{ id: "a", label: "a", dias: 10, base: 400_000, valor: 20_000 }]);
    expect(p.total).toBe(20_000);
    const tope = penalidadEstimada([hito("a", { estado: "atrasado", porcentaje: 100, comprometido: "2026-01-01" })], 1_000_000, REGLA, AHORA);
    expect(tope.total).toBe(100_000);
    expect(tope.topeAlcanzado).toBe(true);
  });

  it("penalidad de un hito pagado usa lo que liberó, no el valor actual", () => {
    const h = hito("a", { estado: "completado", real: "2026-06-14", porcentaje: 50, pagoGeneradoId: "p" });
    expect(penalidadEstimada([h], 2_000_000, REGLA, AHORA, () => 900_000).detalle[0].valor).toBe(Math.round(900_000 * 0.005 * 4));
  });
});
