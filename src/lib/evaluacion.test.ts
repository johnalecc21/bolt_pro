import { describe, expect, it } from "vitest";
import { calcularPuntaje, CRITERIOS_EVALUACION, UMBRAL_PLAN_MEJORA } from "@/lib/evaluacion";

describe("calcularPuntaje", () => {
  it("uses weights that sum to 1 (same as the backend)", () => {
    expect(CRITERIOS_EVALUACION.reduce((s, c) => s + c.peso, 0)).toBeCloseTo(1);
  });

  it("maps all-5 to 100 and all-1 to 20", () => {
    expect(calcularPuntaje({ calidad: 5, plazos: 5, servicio: 5, hse: 5 })).toBe(100);
    expect(calcularPuntaje({ calidad: 1, plazos: 1, servicio: 1, hse: 1 })).toBe(20);
  });

  it("matches the backend on a mixed evaluation", () => {
    // Backend e2e: calidad 5, plazos 4, servicio 4, hse 5 → 90.
    expect(calcularPuntaje({ calidad: 5, plazos: 4, servicio: 4, hse: 5 })).toBe(90);
    expect(calcularPuntaje({ calidad: 2, plazos: 2, servicio: 2, hse: 3 })).toBeLessThan(UMBRAL_PLAN_MEJORA);
  });
});
