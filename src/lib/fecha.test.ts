import { describe, expect, it } from "vitest";
import { cuentaRegresiva, fechaLocal, haVencido } from "./fecha";

describe("fechaLocal", () => {
  it("usa el día local, no el de UTC", () => {
    const iso = new Date(2026, 9, 1, 23, 59, 59).toISOString();
    expect(fechaLocal(iso)).toBe("2026-10-01");
  });
});

describe("haVencido", () => {
  it("compara contra ahora", () => {
    expect(haVencido(new Date(Date.now() - 1000).toISOString())).toBe(true);
    expect(haVencido(new Date(Date.now() + 60_000).toISOString())).toBe(false);
    expect(haVencido(null)).toBe(true);
  });
});

describe("cuentaRegresiva", () => {
  it("muestra horas cuando pasa de 60 minutos", () => {
    expect(cuentaRegresiva(2 * 3_600_000 + 5 * 60_000 + 3_000, 0)).toBe("2:05:03");
    expect(cuentaRegresiva(59_000, 0)).toBe("00:59");
    expect(cuentaRegresiva(-5, 0)).toBe("00:00");
  });
});
