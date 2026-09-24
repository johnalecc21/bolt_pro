import { describe, expect, it } from "vitest";
import { agrupar, cobros, embudo, filtrar, kpis, monedaPrincipal, opcionesFiltro, rangos, type DimensionProveedor, type MetricaProveedor } from "./agregador";
import { construirInformeProveedor, documentoPdfProveedor } from "./informe";
import type { ContratoProveedor, DatosProveedor, ProcesoProveedor } from "./tipos";

const AHORA = new Date(2026, 5, 20).getTime();
const f = (y: number, m: number, d: number) => new Date(y, m, d).toISOString();

function proceso(id: string, extra: Partial<ProcesoProveedor> = {}): ProcesoProveedor {
  return {
    requerimientoId: id,
    codigo: id.toUpperCase(),
    titulo: id,
    cliente: "Acme",
    categoria: "TI",
    moneda: "COP",
    invitado: f(2026, 2, 1),
    cierre: f(2026, 2, 10),
    declinada: false,
    ofertaEnviada: true,
    fechaOferta: f(2026, 2, 2),
    miPrecio: 100,
    negociado: false,
    miPrecioFinal: 100,
    resultado: "ganado",
    fechaResultado: f(2026, 2, 15),
    precioAdjudicado: 100,
    competenciaVisible: null,
    posicion: null,
    participantes: null,
    brechaPct: null,
    ...extra,
  };
}

function contrato(id: string, extra: Partial<ContratoProveedor> = {}): ContratoProveedor {
  return { id, codigo: id, contratoPadreId: null, cliente: "Acme", categoria: "TI", monto: 100, moneda: "COP", firmado: f(2026, 2, 15), vigenciaFin: f(2026, 7, 1), estado: "ACTIVO", ...extra };
}

function datos(): DatosProveedor {
  return {
    proveedor: "Yo SAS",
    desde: "2026-01-01",
    hasta: "2026-06-30",
    desdeAnterior: "2025-07-02",
    generadoEn: new Date(AHORA).toISOString(),
    truncado: false,
    visitasVitrina: 12,
    procesos: [
      proceso("g1"),
      proceso("p1", { cliente: "Beta", resultado: "perdido", precioAdjudicado: null, miPrecioFinal: 110, competenciaVisible: true, posicion: 2, participantes: 3, brechaPct: 0.1, fechaResultado: f(2026, 3, 10) }),
      proceso("p2", { cliente: "Gamma", resultado: "perdido", precioAdjudicado: null, competenciaVisible: false, fechaResultado: f(2026, 4, 10) }),
      proceso("s1", { ofertaEnviada: false, miPrecio: null, miPrecioFinal: null, resultado: "sin_oferta", fechaResultado: null, precioAdjudicado: null }),
      proceso("u1", { moneda: "USD", resultado: "pendiente", fechaResultado: null, precioAdjudicado: null }),
      proceso("old", { invitado: f(2025, 9, 1), fechaResultado: f(2025, 9, 20), resultado: "perdido", precioAdjudicado: null }),
    ],
    contratos: [
      contrato("c1"),
      contrato("c1-po", { contratoPadreId: "c1", monto: 40 }),
      contrato("c2", { cliente: "Beta", monto: 300, firmado: f(2026, 4, 1), vigenciaFin: f(2026, 6, 15) }),
      contrato("cu", { moneda: "USD", monto: 5 }),
    ],
    pagos: [
      { id: "a", contrato: "c1", cliente: "Acme", categoria: "TI", monto: 50, moneda: "COP", emision: f(2026, 3, 1), pactada: f(2026, 4, 1), estado: "PENDIENTE" },
      { id: "b", contrato: "c2", cliente: "Beta", categoria: "TI", monto: 70, moneda: "COP", emision: f(2026, 5, 1), pactada: f(2026, 6, 1), estado: "PENDIENTE" },
      { id: "c", contrato: "c1", cliente: "Acme", categoria: "TI", monto: 999, moneda: "COP", emision: f(2026, 1, 1), pactada: f(2026, 2, 1), estado: "PAGADO" },
    ],
    hitos: [
      { cliente: "Acme", categoria: "TI", comprometido: f(2026, 3, 1), real: f(2026, 2, 28), estado: "COMPLETADO" },
      { cliente: "Beta", categoria: "TI", comprometido: f(2026, 3, 1), real: null, estado: "ATRASADO" },
    ],
    evaluaciones: [{ cliente: "Beta", categoria: "TI", contrato: "c2", puntaje: 55, calidad: 3, plazos: 2, servicio: 3, hse: 3, planMejora: true, fecha: f(2026, 4, 5) }],
  };
}

describe("analítica del proveedor", () => {
  const D = datos();
  const { actual, anterior } = rangos(D);
  const d = filtrar(D, { moneda: "COP" });

  it("elige la moneda principal y lista opciones", () => {
    expect(monedaPrincipal(D)).toBe("COP");
    expect(opcionesFiltro(D).clientes).toEqual(["Acme", "Beta", "Gamma"]);
  });

  it("KPIs: adjudicado sin duplicar POs ni mezclar monedas, éxito y respuesta", () => {
    const k = kpis(d, actual, AHORA);
    expect(k.adjudicado).toBe(400);
    expect(k.contratos).toBe(3);
    expect(k.invitaciones).toBe(5);
    expect(k.tasaRespuesta).toBeCloseTo(4 / 5);
    expect(k.ganados).toBe(1);
    expect(k.perdidos).toBe(2);
    expect(k.tasaExito).toBeCloseTo(1 / 3);
    expect(k.brechaPromedio).toBeCloseTo(0.1); // only the process whose buyer shares it
    expect(k.posicionPromedio).toBe(2);
    expect(k.entregaATiempo).toBeCloseTo(0.5);
    expect(k.evaluacionPromedio).toBe(55);
    expect(kpis(d, anterior, AHORA).perdidos).toBe(1);
  });

  it("cada métrica sumable por cada dimensión cuadra con su KPI", () => {
    const k = kpis(d, actual, AHORA);
    const sumables: [MetricaProveedor, number][] = [["adjudicado", k.adjudicado], ["contratos", k.contratos], ["invitaciones", k.invitaciones], ["ofertasEnviadas", k.ofertasEnviadas], ["ganados", k.ganados]];
    for (const [m, total] of sumables)
      for (const dim of ["mes", "cliente", "categoria"] as DimensionProveedor[])
        expect(agrupar(d, m, dim, actual).reduce((s, g) => s + g.valor, 0)).toBe(total);
  });

  it("cobros y vencimientos a hoy", () => {
    const c = cobros(d, AHORA);
    expect(c.porCobrar).toBe(120);
    expect(c.vencido).toBe(50);
    expect(c.proximos30).toBe(70);
    expect(c.porVencer.map((x) => x.codigo)).toEqual(["c2", "c1", "cu"]);
  });

  it("embudo de invitaciones", () => {
    expect(embudo(d, actual).map((e) => e.procesos)).toEqual([5, 4, 3, 1]);
  });

  it("el informe cuadra con los KPIs y explica lo que no se comparte", () => {
    const inf = construirInformeProveedor(D, { moneda: "COP" }, [], AHORA);
    const sec = (id: string) => inf.secciones.find((s) => s.id === id)!;
    expect(sec("resumen").filas[0][1]).toBe(400);
    expect(sec("mensual").filas.reduce((s, r) => s + (r[1] as number), 0)).toBe(400);
    expect(sec("competitividad").filas.map((r) => r[6])).toEqual(["2° de 3", "No compartido"]);
    const titulos = inf.insights.map((i) => i.titulo);
    expect(titulos.some((t) => t.includes("sin detalle de competitividad"))).toBe(true);
    expect(titulos.some((t) => t.includes("vencido"))).toBe(true);
    expect(titulos.some((t) => t.includes("bajo 60/100"))).toBe(true);
    expect(inf.notas[0]).toContain("USD");
    const pdf = documentoPdfProveedor(inf);
    expect(pdf.tarjetas).toHaveLength(8);
    expect(pdf.tablas.every((t) => t.seccion)).toBe(true);
  });

  it("filtrar por cliente y cambiar de moneda", () => {
    expect(kpis(filtrar(D, { moneda: "COP", cliente: "Beta" }), actual, AHORA).adjudicado).toBe(300);
    expect(kpis(filtrar(D, { moneda: "USD" }), actual, AHORA).adjudicado).toBe(5);
  });
});
