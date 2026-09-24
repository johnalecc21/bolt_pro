import type { Moneda } from "@/lib/moneda";
import { rangos, type Grupo, type Rango } from "@/lib/analitica/agregador";
import type { DatosProveedor, FiltrosProveedor, ProcesoProveedor } from "./tipos";

/*
 * Supplier-side counterpart of the CFO aggregator: every KPI, chart, table
 * and export of "Mi desempeño" comes from here.
 *
 * - Adjudicado: contracts/POs signed with this supplier in the period, in the
 *   selected currency (POs under a contrato marco are not added again).
 * - Invitaciones / ofertas: processes it was invited to in the period, and how
 *   many of those it answered with a sent offer.
 * - Ganados / tasa de éxito: processes decided (contract signed) in the period
 *   that it won, over all decided ones where it had sent an offer.
 * - Posición y brecha: only for lost processes whose buyer shares them.
 * - Cobros and contratos por vencer are "as of today".
 */

export { rangos };
export type { Grupo, Rango };

const MS_DIA = 86_400_000;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const ratio = (a: number, b: number) => (b > 0 ? a / b : null);
const promedio = (xs: number[]) => (xs.length ? suma(xs) / xs.length : null);

function en(iso: string | null | undefined, r: Rango) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= r.desde && t < r.hasta;
}

function dia(iso: string) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** The currency this supplier quotes in most — the default for money totals. */
export function monedaPrincipal(datos: DatosProveedor): Moneda {
  const conteo = new Map<Moneda, number>();
  for (const r of [...datos.procesos, ...datos.contratos]) conteo.set(r.moneda, (conteo.get(r.moneda) ?? 0) + 1);
  return [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
}

export function opcionesFiltro(datos: DatosProveedor) {
  const monedas = new Set<Moneda>();
  const clientes = new Set<string>();
  const categorias = new Set<string>();
  for (const r of [...datos.procesos, ...datos.contratos]) {
    monedas.add(r.moneda);
    clientes.add(r.cliente);
    categorias.add(r.categoria);
  }
  const orden = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
  return { monedas: [...monedas], clientes: orden(clientes), categorias: orden(categorias) };
}

export type DatosProveedorFiltrados = Omit<DatosProveedor, "proveedor" | "desde" | "hasta" | "desdeAnterior" | "generadoEn" | "truncado" | "visitasVitrina"> & { moneda: Moneda };

export function filtrar(datos: DatosProveedor, f: FiltrosProveedor): DatosProveedorFiltrados {
  const pasa = (r: { cliente: string; categoria: string }) => (!f.cliente || r.cliente === f.cliente) && (!f.categoria || r.categoria === f.categoria);
  return {
    moneda: f.moneda,
    procesos: datos.procesos.filter(pasa),
    contratos: datos.contratos.filter(pasa),
    pagos: datos.pagos.filter(pasa),
    hitos: datos.hitos.filter(pasa),
    evaluaciones: datos.evaluaciones.filter(pasa),
  };
}

// --- Row selections --------------------------------------------------------------

export const contratosDelPeriodo = (d: DatosProveedorFiltrados, r: Rango) => d.contratos.filter((c) => !c.contratoPadreId && en(c.firmado, r));
export const invitacionesDelPeriodo = (d: DatosProveedorFiltrados, r: Rango) => d.procesos.filter((p) => en(p.invitado, r));
/** Decided (contract signed) in the period, with an offer from this supplier. */
export const decididos = (d: DatosProveedorFiltrados, r: Rango) =>
  d.procesos.filter((p) => (p.resultado === "ganado" || p.resultado === "perdido") && en(p.fechaResultado, r));
export const perdidosConDetalle = (d: DatosProveedorFiltrados, r: Rango) =>
  decididos(d, r).filter((p) => p.resultado === "perdido" && p.brechaPct != null && p.moneda === d.moneda);

// --- KPIs ------------------------------------------------------------------------

export interface KpisProveedor {
  adjudicado: number;
  contratos: number;
  invitaciones: number;
  ofertasEnviadas: number;
  tasaRespuesta: number | null;
  ganados: number;
  perdidos: number;
  tasaExito: number | null;
  brechaPromedio: number | null;
  posicionPromedio: number | null;
  clientesActivos: number;
  entregaATiempo: number | null;
  evaluacionPromedio: number | null;
}

export function kpis(d: DatosProveedorFiltrados, r: Rango, ahora = Date.now()): KpisProveedor {
  const contratos = contratosDelPeriodo(d, r);
  const invitaciones = invitacionesDelPeriodo(d, r);
  const dec = decididos(d, r);
  const ganados = dec.filter((p) => p.resultado === "ganado").length;
  const conDetalle = perdidosConDetalle(d, r);
  const hitos = d.hitos.filter((h) => en(h.comprometido, r) && new Date(h.comprometido).getTime() <= ahora);
  const aTiempo = hitos.filter((h) => h.estado === "COMPLETADO" && h.real && dia(h.real) <= dia(h.comprometido)).length;
  const evals = d.evaluaciones.filter((e) => en(e.fecha, r));
  return {
    adjudicado: suma(contratos.filter((c) => c.moneda === d.moneda).map((c) => c.monto)),
    contratos: contratos.length,
    invitaciones: invitaciones.length,
    ofertasEnviadas: invitaciones.filter((p) => p.ofertaEnviada).length,
    tasaRespuesta: ratio(invitaciones.filter((p) => p.ofertaEnviada).length, invitaciones.length),
    ganados,
    perdidos: dec.length - ganados,
    tasaExito: ratio(ganados, dec.length),
    brechaPromedio: promedio(conDetalle.map((p) => p.brechaPct!)),
    posicionPromedio: promedio(conDetalle.filter((p) => p.posicion != null).map((p) => p.posicion!)),
    clientesActivos: new Set(contratos.map((c) => c.cliente)).size,
    entregaATiempo: ratio(aTiempo, hitos.length),
    evaluacionPromedio: promedio(evals.map((e) => e.puntaje)),
  };
}

export interface CobrosProveedor {
  porCobrar: number;
  vencido: number;
  nVencidos: number;
  proximos30: number;
  contratosVigentes: number;
  montoVigente: number;
  porVencer: { codigo: string; cliente: string; categoria: string; monto: number; moneda: Moneda; vigenciaFin: string; dias: number }[];
}

export function cobros(d: DatosProveedorFiltrados, ahora = Date.now()): CobrosProveedor {
  const abiertos = d.pagos.filter((p) => p.estado !== "PAGADO" && p.moneda === d.moneda);
  const vencidos = abiertos.filter((p) => p.estado === "VENCIDO" || new Date(p.pactada).getTime() < ahora);
  const proximos = abiertos.filter((p) => {
    const t = new Date(p.pactada).getTime();
    return t >= ahora && t < ahora + 30 * MS_DIA;
  });
  const vigentes = d.contratos.filter((c) => !c.contratoPadreId && c.estado !== "TERMINADO" && new Date(c.vigenciaFin).getTime() >= ahora);
  const porVencer = vigentes
    .map((c) => ({ c, dias: Math.ceil((new Date(c.vigenciaFin).getTime() - ahora) / MS_DIA) }))
    .filter(({ dias }) => dias <= 90)
    .sort((a, b) => a.dias - b.dias)
    .map(({ c, dias }) => ({ codigo: c.codigo, cliente: c.cliente, categoria: c.categoria, monto: c.monto, moneda: c.moneda, vigenciaFin: c.vigenciaFin, dias }));
  return {
    porCobrar: suma(abiertos.map((p) => p.monto)),
    vencido: suma(vencidos.map((p) => p.monto)),
    nVencidos: vencidos.length,
    proximos30: suma(proximos.map((p) => p.monto)),
    contratosVigentes: vigentes.length,
    montoVigente: suma(vigentes.filter((c) => c.moneda === d.moneda).map((c) => c.monto)),
    porVencer,
  };
}

// --- Groupings -------------------------------------------------------------------

export const METRICAS_PROVEEDOR = {
  adjudicado: { etiqueta: "Monto adjudicado", formato: "moneda" },
  contratos: { etiqueta: "Contratos", formato: "entero" },
  invitaciones: { etiqueta: "Invitaciones", formato: "entero" },
  ofertasEnviadas: { etiqueta: "Ofertas enviadas", formato: "entero" },
  ganados: { etiqueta: "Procesos ganados", formato: "entero" },
  tasaExito: { etiqueta: "Tasa de éxito", formato: "pct" },
  brechaPromedio: { etiqueta: "Brecha con el adjudicado", formato: "pct" },
  porCobrar: { etiqueta: "Por cobrar", formato: "moneda" },
  evaluacion: { etiqueta: "Evaluación promedio", formato: "decimal" },
} as const;
export type MetricaProveedor = keyof typeof METRICAS_PROVEEDOR;
export type DimensionProveedor = "mes" | "cliente" | "categoria";

function claveMes(iso: string) {
  const d = new Date(iso);
  return { clave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, etiqueta: `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` };
}

function mesesDelRango(r: Rango) {
  const out: { clave: string; etiqueta: string }[] = [];
  const c = new Date(r.desde);
  c.setDate(1);
  while (c.getTime() < r.hasta) {
    out.push(claveMes(c.toISOString()));
    c.setMonth(c.getMonth() + 1);
  }
  return out.filter((k, i) => out.findIndex((o) => o.clave === k.clave) === i);
}

export function agrupar(d: DatosProveedorFiltrados, m: MetricaProveedor, dim: DimensionProveedor, r: Rango): Grupo[] {
  const acc = new Map<string, { etiqueta: string; num: number; den: number; n: number }>();
  const add = (k: { clave: string; etiqueta: string }, num: number, den = 1) => {
    const a = acc.get(k.clave) ?? { etiqueta: k.etiqueta, num: 0, den: 0, n: 0 };
    a.num += num;
    a.den += den;
    a.n += 1;
    acc.set(k.clave, a);
  };
  const clave = (row: { cliente: string; categoria: string }, fecha: string) =>
    dim === "mes" ? claveMes(fecha) : dim === "cliente" ? { clave: row.cliente, etiqueta: row.cliente } : { clave: row.categoria, etiqueta: row.categoria };

  switch (m) {
    case "adjudicado":
      for (const c of contratosDelPeriodo(d, r)) if (c.moneda === d.moneda) add(clave(c, c.firmado), c.monto);
      break;
    case "contratos":
      for (const c of contratosDelPeriodo(d, r)) add(clave(c, c.firmado), 1);
      break;
    case "invitaciones":
      for (const p of invitacionesDelPeriodo(d, r)) add(clave(p, p.invitado), 1);
      break;
    case "ofertasEnviadas":
      for (const p of invitacionesDelPeriodo(d, r)) if (p.ofertaEnviada) add(clave(p, p.invitado), 1);
      break;
    case "ganados":
      for (const p of decididos(d, r)) if (p.resultado === "ganado") add(clave(p, p.fechaResultado!), 1);
      break;
    case "tasaExito":
      for (const p of decididos(d, r)) add(clave(p, p.fechaResultado!), p.resultado === "ganado" ? 1 : 0);
      break;
    case "brechaPromedio":
      for (const p of perdidosConDetalle(d, r)) add(clave(p, p.fechaResultado!), p.brechaPct!);
      break;
    case "porCobrar":
      for (const p of d.pagos) if (p.estado !== "PAGADO" && p.moneda === d.moneda) add(clave(p, p.pactada), p.monto);
      break;
    case "evaluacion":
      for (const e of d.evaluaciones) if (en(e.fecha, r)) add(clave(e, e.fecha), e.puntaje);
      break;
  }
  const esPromedio = m === "tasaExito" || m === "brechaPromedio" || m === "evaluacion";
  const grupos: Grupo[] = [...acc.entries()].map(([k, a]) => ({ clave: k, etiqueta: a.etiqueta, valor: esPromedio ? a.num / a.n : a.num, n: a.n }));
  if (dim === "mes") {
    if (m === "porCobrar") return grupos.sort((a, b) => a.clave.localeCompare(b.clave));
    const por = new Map(grupos.map((g) => [g.clave, g]));
    return mesesDelRango(r).map((k) => por.get(k.clave) ?? { ...k, valor: 0, n: 0 });
  }
  return grupos.sort((a, b) => b.valor - a.valor);
}

export interface EtapaEmbudoProveedor {
  etapa: string;
  procesos: number;
  pct: number;
}

/** Invitations received in the period and how far they went. */
export function embudo(d: DatosProveedorFiltrados, r: Rango): EtapaEmbudoProveedor[] {
  const inv = invitacionesDelPeriodo(d, r);
  const etapas: [string, number][] = [
    ["Invitaciones", inv.length],
    ["Ofertas enviadas", inv.filter((p) => p.ofertaEnviada).length],
    ["Decididos", inv.filter((p) => p.resultado === "ganado" || p.resultado === "perdido").length],
    ["Ganados", inv.filter((p) => p.resultado === "ganado").length],
  ];
  const base = etapas[0][1];
  return etapas.map(([etapa, procesos]) => ({ etapa, procesos, pct: base ? procesos / base : 0 }));
}

export function perdidosSinDetalle(d: DatosProveedorFiltrados, r: Rango): ProcesoProveedor[] {
  return decididos(d, r).filter((p) => p.resultado === "perdido" && p.competenciaVisible === false);
}
