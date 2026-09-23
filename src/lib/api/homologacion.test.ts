import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { getSession: vi.fn() } } }));

const { documentosObligatoriosFaltantes, puedeSubirDocumento } = await import("@/lib/api/homologacion");
type Doc = Parameters<typeof puedeSubirDocumento>[1];

const doc = (patch: Partial<Doc>): Doc => ({
  id: "d",
  nombre: "Doc",
  categoria: "legal",
  estado: "pendiente",
  obligatorio: true,
  ...patch,
});

describe("puedeSubirDocumento", () => {
  it("blocks every upload while under review", () => {
    expect(puedeSubirDocumento("en_revision", doc({}))).toBe(false);
    expect(puedeSubirDocumento("zona_gris", doc({ obligatorio: false }))).toBe(false);
  });

  it("after approval allows renewing expired docs and adding never-uploaded optional ones", () => {
    expect(puedeSubirDocumento("aprobado", doc({ estado: "vencido" }))).toBe(true);
    expect(puedeSubirDocumento("aprobado", doc({ obligatorio: false, estado: "pendiente" }))).toBe(true);
    expect(puedeSubirDocumento("aprobado", doc({ obligatorio: false, estado: "validado" }))).toBe(false);
    expect(puedeSubirDocumento("aprobado", doc({ estado: "validado" }))).toBe(false);
  });
});

describe("documentosObligatoriosFaltantes", () => {
  it("only counts mandatory documents without a file", () => {
    const faltantes = documentosObligatoriosFaltantes([
      doc({ id: "a" }),
      doc({ id: "b", estado: "subido" }),
      doc({ id: "c", obligatorio: false }),
    ]);
    expect(faltantes.map((d) => d.id)).toEqual(["a"]);
  });
});
