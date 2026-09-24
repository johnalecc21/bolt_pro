import type { Moneda } from "@/lib/moneda";
import type { ContratoFila, DatosCfo, FiltrosCfo, PagoFila, ProcesoFila } from "./tipos";

/*
 * The one place where CFO numbers are computed. KPIs, charts, tables, the
 * chart builder and every export read from here, so they always agree.
 *
 * Definitions (the "período" is [desde, hasta] inclusive, in the viewer's timezone):
 * - Gasto comprometido: sum of contracts/POs signed in the period, in the
 *   company's base currency. POs issued against a contrato marco are not
 *   added again (their amount is already inside the marco).
 * - Ahorro: presupuesto − precio final of every process signed in the period.
 *   Ahorro % = ahorro / presupuesto of those same processes.
 * - Ahorro por negociación: best initial offer − best final bid, in processes
 *   that went through a live negotiation round.
 * - Ciclo: days from the requerimiento's creation to its contract signature.
 * - Competencia: offers received per process signed in the period.
 * - Pagos pendientes / vencidos and contratos por vencer are "as of today".
 * - Entrega a tiempo: milestones due in the period (and already due) that were
 *   completed on or before their committed date.
 * Money in other currencies is never summed with the base one; it is counted
 * in `excluidos` so the screen can say so.
 */

const MS_DIA = 86_400_000;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export interface Rango {
  desde: number;
  hasta: number; // exclusive
}

function dia(fecha: string): number {
  const [y, m, d] = fecha.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function rangos(datos: Pick<DatosCfo, "desde" | "hasta" | "desdeAnterior">): { actual: Rango; anterior: Rango } {
  const desde = dia(datos.desde);
  const hasta = dia(datos.hasta) + MS_DIA;
  return { actual: { desde, hasta }, anterior: { desde: dia(datos.desdeAnterior), hasta: desde } };
}

function en(iso: string | null | undefined, r: Rango): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= r.desde && t < r.hasta;
}

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const ratio = (a: number, b: number) => (b > 0 ? a / b : null);
const diasEntre = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / MS_DIA);

function mediana(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// --- Filtering ---------------------------------------------------------------

export interface DatosFiltrados {
  moneda: Moneda;
  procesos: ProcesoFila[];
  contratos: ContratoFila[];
  pagos: PagoFila[];
  hitos: DatosCfo["hitos"];
  evaluaciones: DatosCfo["evaluaciones"];
  /** centroCostoId → unidadId, learned from the rows (payments/milestones only carry the centro). */
  unidadDeCentro: Map<string, string | null>;
}

export function filtrar(datos: DatosCfo, f: FiltrosCfo): DatosFiltrados {
  const unidadDeCentro = new Map<string, string | null>();
  for (const r of [...datos.procesos, ...datos.contratos]) {
    if (r.centroCostoId) unidadDeCentro.set(r.centroCostoId, r.unidadId);
  }
  const pasaCentro = (centroCostoId: string | null, unidadId?: string | null) => {
    if (f.centroCostoId && centroCostoId !== f.centroCostoId) return false;
    if (f.unidadId) {
      const u = unidadId !== undefined ? unidadId : centroCostoId ? unidadDeCentro.get(centroCostoId) : null;
      if (u !== f.unidadId) return false;
    }
    return true;
  };
  const pasaCategoria = (c: string) => !f.categoria || c === f.categoria;
  return {
    moneda: datos.moneda,
    procesos: datos.procesos.filter((p) => pasaCentro(p.centroCostoId, p.unidadId) && pasaCategoria(p.categoria)),
    contratos: datos.contratos.filter((c) => pasaCentro(c.centroCostoId, c.unidadId) && pasaCategoria(c.categoria)),
    pagos: datos.pagos.filter((p) => pasaCentro(p.centroCostoId) && pasaCategoria(p.categoria)),
    hitos: datos.hitos.filter((h) => pasaCentro(h.centroCostoId) && pasaCategoria(h.categoria)),
    evaluaciones: datos.evaluaciones.filter((e) => pasaCentro(e.centroCostoId) && pasaCategoria(e.categoria)),
    unidadDeCentro,
  };
}

// --- Row selections shared by KPIs, groupings and exports --------------------

/** Contracts that count as spend in a range: signed in it, not a PO under a marco. */
export function contratosDeGasto(d: DatosFiltrados, r: Rango) {
  return d.contratos.filter((c) => !c.contratoPadreId && en(c.firmado, r));
}

/** Processes whose contract was signed in the range — the basis for savings, cycle time and competition. */
export function procesosFirmados(d: DatosFiltrados, r: Rango) {
  return d.procesos.filter((p) => p.firmado && p.precioFinal != null && en(p.firmado, r));
}

export function procesosCreados(d: DatosFiltrados, r: Rango) {
  return d.procesos.filter((p) => en(p.creado, r));
}

const esBase = (moneda: Moneda, base: Moneda) => moneda === base;

// --- KPIs --------------------------------------------------------------------

export interface Kpis {
  gasto: number;
  contratos: number;
  ahorro: number;
  presupuestoAdjudicado: number;
  ahorroPct: number | null;
  ahorroNegociacion: number;
  tasaNegociacion: number | null;
  procesosCreados: number;
  procesosAdjudicados: number;
  cicloDias: number | null;
  cicloMediana: number | null;
  ofertasPromedio: number | null;
  tasaRechazo: number | null;
  proveedoresActivos: number;
  entregaATiempo: number | null;
  desempenoPromedio: number | null;
}

export function kpis(d: DatosFiltrados, r: Rango, ahora = Date.now()): Kpis {
  const base = d.moneda;
  const gastoRows = contratosDeGasto(d, r);
  const firmados = procesosFirmados(d, r);
  const firmadosBase = firmados.filter((p) => esBase(p.moneda, base));
  const creados = procesosCreados(d, r);
  const negociados = firmadosBase.filter((p) => p.negociado && p.negociacionInicial != null && p.negociacionFinal != null);
  const ciclos = firmados.map((p) => diasEntre(p.creado, p.firmado!));
  const presupuestoAdjudicado = suma(firmadosBase.map((p) => p.presupuesto));
  const ahorro = suma(firmadosBase.map((p) => p.presupuesto - (p.precioFinal ?? 0)));

  const hitosVencidos = d.hitos.filter((h) => en(h.comprometido, r) && new Date(h.comprometido).getTime() <= ahora);
  const aTiempo = hitosVencidos.filter(
    (h) => h.estado === "COMPLETADO" && h.real && dia(h.real) <= dia(h.comprometido),
  ).length;
  const evals = d.evaluaciones.filter((e) => en(e.fecha, r));

  return {
    gasto: suma(gastoRows.filter((c) => esBase(c.moneda, base)).map((c) => c.monto)),
    contratos: gastoRows.length,
    ahorro,
    presupuestoAdjudicado,
    ahorroPct: ratio(ahorro, presupuestoAdjudicado),
    ahorroNegociacion: suma(negociados.map((p) => p.negociacionInicial! - p.negociacionFinal!)),
    tasaNegociacion: ratio(firmados.filter((p) => p.negociado).length, firmados.length),
    procesosCreados: creados.length,
    procesosAdjudicados: firmados.length,
    cicloDias: ciclos.length ? suma(ciclos) / ciclos.length : null,
    cicloMediana: mediana(ciclos),
    ofertasPromedio: firmados.length ? suma(firmados.map((p) => p.ofertas)) / firmados.length : null,
    tasaRechazo: ratio(creados.filter((p) => p.rechazos > 0).length, creados.length),
    proveedoresActivos: new Set(gastoRows.map((c) => c.proveedor)).size,
    entregaATiempo: ratio(aTiempo, hitosVencidos.length),
    desempenoPromedio: evals.length ? suma(evals.map((e) => e.puntaje)) / evals.length : null,
  };
}

/** Relative change vs. the previous period; null when there is no base to compare. */
export function variacion(actual: number | null, anterior: number | null): number | null {
  if (actual == null || anterior == null || anterior === 0) return null;
  return (actual - anterior) / Math.abs(anterior);
}

// --- "As of today" exposure --------------------------------------------------

export interface Exposicion {
  pagosPendientes: number;
  pagosVencidos: number;
  nPagosVencidos: number;
  pagosProximos30: number;
  contratosPorVencer: { codigo: string; proveedor: string; categoria: string; monto: number; moneda: Moneda; vigenciaFin: string; dias: number }[];
  montoPorVencer: number;
}

export function exposicion(d: DatosFiltrados, ahora = Date.now()): Exposicion {
  const base = d.moneda;
  const abiertos = d.pagos.filter((p) => p.estado !== "PAGADO" && esBase(p.moneda, base));
  const vencidos = abiertos.filter((p) => p.estado === "VENCIDO" || new Date(p.pactada).getTime() < ahora);
  const proximos = abiertos.filter((p) => {
    const t = new Date(p.pactada).getTime();
    return t >= ahora && t < ahora + 30 * MS_DIA;
  });
  const porVencer = d.contratos
    .filter((c) => !c.contratoPadreId)
    .map((c) => ({ c, dias: Math.ceil((new Date(c.vigenciaFin).getTime() - ahora) / MS_DIA) }))
    .filter(({ dias }) => dias >= 0 && dias <= 90)
    .sort((a, b) => a.dias - b.dias)
    .map(({ c, dias }) => ({ codigo: c.codigo, proveedor: c.proveedor, categoria: c.categoria, monto: c.monto, vigenciaFin: c.vigenciaFin, dias, moneda: c.moneda }));
  return {
    pagosPendientes: suma(abiertos.map((p) => p.monto)),
    pagosVencidos: suma(vencidos.map((p) => p.monto)),
    nPagosVencidos: vencidos.length,
    pagosProximos30: suma(proximos.map((p) => p.monto)),
    contratosPorVencer: porVencer,
    montoPorVencer: suma(porVencer.filter((c) => esBase(c.moneda, base)).map((c) => c.monto)),
  };
}

/** Rows left out of money totals because they are in another currency. */
export function excluidosPorMoneda(d: DatosFiltrados, r: Rango) {
  const otros = contratosDeGasto(d, r).filter((c) => c.moneda !== d.moneda);
  const porMoneda = new Map<Moneda, number>();
  for (const c of otros) porMoneda.set(c.moneda, (porMoneda.get(c.moneda) ?? 0) + c.monto);
  return { contratos: otros.length, porMoneda: [...porMoneda.entries()].map(([moneda, monto]) => ({ moneda, monto })) };
}

// --- Metric × dimension groupings (tables, charts, builder) ------------------

export const METRICAS = {
  gasto: { etiqueta: "Gasto comprometido", formato: "moneda" },
  contratos: { etiqueta: "Contratos firmados", formato: "entero" },
  ahorro: { etiqueta: "Ahorro vs. presupuesto", formato: "moneda" },
  ahorroPct: { etiqueta: "Ahorro %", formato: "porcentaje" },
  procesosCreados: { etiqueta: "Procesos creados", formato: "entero" },
  procesosAdjudicados: { etiqueta: "Procesos adjudicados", formato: "entero" },
  cicloDias: { etiqueta: "Ciclo promedio (días)", formato: "decimal" },
  ofertasPromedio: { etiqueta: "Ofertas por proceso", formato: "decimal" },
  ahorroNegociacion: { etiqueta: "Ahorro por negociación", formato: "moneda" },
  pagosPendientes: { etiqueta: "Pagos pendientes", formato: "moneda" },
} as const;
export type Metrica = keyof typeof METRICAS;

export const DIMENSIONES = {
  mes: "Mes",
  trimestre: "Trimestre",
  categoria: "Categoría",
  proveedor: "Proveedor",
  centroCosto: "Centro de costo",
  unidad: "Unidad de negocio",
  prioridad: "Prioridad",
  solicitante: "Solicitante",
} as const;
export type Dimension = keyof typeof DIMENSIONES;

/** Dimensions each metric can be broken down by (payments carry no priority or requester). */
export function dimensionesDe(m: Metrica): Dimension[] {
  const todas = Object.keys(DIMENSIONES) as Dimension[];
  if (m === "pagosPendientes") return ["mes", "trimestre", "categoria", "proveedor", "centroCosto", "unidad"];
  return todas;
}

export interface Grupo {
  clave: string;
  etiqueta: string;
  valor: number;
  /** Rows behind the value — shown in tooltips and tables. */
  n: number;
}

const PRIORIDAD: Record<string, string> = { NORMAL: "Normal", ALTA: "Alta", URGENTE: "Urgente" };

function claveTiempo(iso: string, dim: "mes" | "trimestre"): { clave: string; etiqueta: string } {
  const d = new Date(iso);
  const y = d.getFullYear();
  if (dim === "mes") return { clave: `${y}-${String(d.getMonth() + 1).padStart(2, "0")}`, etiqueta: `${MESES[d.getMonth()]} ${String(y).slice(2)}` };
  const q = Math.floor(d.getMonth() / 3) + 1;
  return { clave: `${y}-Q${q}`, etiqueta: `T${q} ${y}` };
}

/** Every month (or quarter) of the range, so charts show gaps as zero instead of skipping them. */
function periodosDelRango(r: Rango, dim: "mes" | "trimestre") {
  const out: { clave: string; etiqueta: string }[] = [];
  const cursor = new Date(r.desde);
  cursor.setDate(1);
  while (cursor.getTime() < r.hasta) {
    const k = claveTiempo(cursor.toISOString(), dim);
    if (!out.some((o) => o.clave === k.clave)) out.push(k);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

interface Acum {
  etiqueta: string;
  num: number;
  den: number;
  n: number;
}

export function agrupar(d: DatosFiltrados, metrica: Metrica, dim: Dimension, r: Rango): Grupo[] {
  const base = d.moneda;
  const acc = new Map<string, Acum>();
  const procesoPorId = new Map(d.procesos.map((p) => [p.id, p]));
  const add = (k: { clave: string; etiqueta: string }, num: number, den = 1) => {
    const a = acc.get(k.clave) ?? { etiqueta: k.etiqueta, num: 0, den: 0, n: 0 };
    a.num += num;
    a.den += den;
    a.n += 1;
    acc.set(k.clave, a);
  };
  const etiquetaUnidad = (unidad: string | null) => ({ clave: unidad ?? "—", etiqueta: unidad ?? "Sin unidad" });
  const nombreUnidad = new Map<string, string>();
  for (const r0 of [...d.procesos, ...d.contratos]) if (r0.unidadId && r0.unidad) nombreUnidad.set(r0.unidadId, r0.unidad);
  const nombreCentro = new Map<string, string>();
  for (const r0 of [...d.procesos, ...d.contratos]) if (r0.centroCostoId && r0.centroCosto) nombreCentro.set(r0.centroCostoId, r0.centroCosto);

  const claveProceso = (p: ProcesoFila, fecha: string): { clave: string; etiqueta: string } => {
    switch (dim) {
      case "mes":
      case "trimestre":
        return claveTiempo(fecha, dim);
      case "categoria":
        return { clave: p.categoria, etiqueta: p.categoria };
      case "proveedor":
        return { clave: p.proveedorAdjudicado ?? "—", etiqueta: p.proveedorAdjudicado ?? "Sin adjudicar" };
      case "centroCosto":
        return { clave: p.centroCostoId ?? "—", etiqueta: p.centroCosto ?? "Sin centro de costo" };
      case "unidad":
        return etiquetaUnidad(p.unidad);
      case "prioridad":
        return { clave: p.prioridad, etiqueta: PRIORIDAD[p.prioridad] ?? p.prioridad };
      case "solicitante":
        return { clave: p.solicitante, etiqueta: p.solicitante };
    }
  };
  const claveContrato = (c: ContratoFila): { clave: string; etiqueta: string } => {
    const proceso = c.requerimientoId ? procesoPorId.get(c.requerimientoId) : undefined;
    switch (dim) {
      case "mes":
      case "trimestre":
        return claveTiempo(c.firmado, dim);
      case "categoria":
        return { clave: c.categoria, etiqueta: c.categoria };
      case "proveedor":
        return { clave: c.proveedor, etiqueta: c.proveedor };
      case "centroCosto":
        return { clave: c.centroCostoId ?? "—", etiqueta: c.centroCosto ?? "Sin centro de costo" };
      case "unidad":
        return etiquetaUnidad(c.unidad);
      case "prioridad":
        return proceso ? { clave: proceso.prioridad, etiqueta: PRIORIDAD[proceso.prioridad] } : { clave: "—", etiqueta: "Sin requerimiento" };
      case "solicitante":
        return proceso ? { clave: proceso.solicitante, etiqueta: proceso.solicitante } : { clave: "—", etiqueta: "Sin requerimiento" };
    }
  };

  switch (metrica) {
    case "gasto":
      for (const c of contratosDeGasto(d, r)) if (esBase(c.moneda, base)) add(claveContrato(c), c.monto);
      break;
    case "contratos":
      for (const c of contratosDeGasto(d, r)) add(claveContrato(c), 1);
      break;
    case "procesosCreados":
      for (const p of procesosCreados(d, r)) add(claveProceso(p, p.creado), 1);
      break;
    case "procesosAdjudicados":
      for (const p of procesosFirmados(d, r)) add(claveProceso(p, p.firmado!), 1);
      break;
    case "ahorro":
      for (const p of procesosFirmados(d, r)) if (esBase(p.moneda, base)) add(claveProceso(p, p.firmado!), p.presupuesto - p.precioFinal!);
      break;
    case "ahorroPct":
      for (const p of procesosFirmados(d, r)) if (esBase(p.moneda, base)) add(claveProceso(p, p.firmado!), p.presupuesto - p.precioFinal!, p.presupuesto);
      break;
    case "ahorroNegociacion":
      for (const p of procesosFirmados(d, r))
        if (esBase(p.moneda, base) && p.negociado && p.negociacionInicial != null && p.negociacionFinal != null)
          add(claveProceso(p, p.firmado!), p.negociacionInicial - p.negociacionFinal);
      break;
    case "cicloDias":
      for (const p of procesosFirmados(d, r)) add(claveProceso(p, p.firmado!), diasEntre(p.creado, p.firmado!));
      break;
    case "ofertasPromedio":
      for (const p of procesosFirmados(d, r)) add(claveProceso(p, p.firmado!), p.ofertas);
      break;
    case "pagosPendientes":
      for (const p of d.pagos) {
        if (p.estado === "PAGADO" || !esBase(p.moneda, base)) continue;
        const unidadId = p.centroCostoId ? d.unidadDeCentro.get(p.centroCostoId) ?? null : null;
        const k =
          dim === "mes" || dim === "trimestre"
            ? claveTiempo(p.pactada, dim)
            : dim === "categoria"
              ? { clave: p.categoria, etiqueta: p.categoria }
              : dim === "proveedor"
                ? { clave: p.proveedor, etiqueta: p.proveedor }
                : dim === "centroCosto"
                  ? { clave: p.centroCostoId ?? "—", etiqueta: (p.centroCostoId && nombreCentro.get(p.centroCostoId)) || "Sin centro de costo" }
                  : dim === "unidad"
                    ? etiquetaUnidad(unidadId ? nombreUnidad.get(unidadId) ?? null : null)
                    : { clave: "—", etiqueta: "—" };
        add(k, p.monto);
      }
      break;
  }

  const promedio = metrica === "cicloDias" || metrica === "ofertasPromedio";
  const grupos: Grupo[] = [...acc.entries()].map(([clave, a]) => ({
    clave,
    etiqueta: a.etiqueta,
    valor: metrica === "ahorroPct" ? (a.den > 0 ? a.num / a.den : 0) : promedio ? a.num / a.n : a.num,
    n: a.n,
  }));

  if (dim === "mes" || dim === "trimestre") {
    // Payments are due in the future too, so their time axis follows the rows, not the period.
    if (metrica === "pagosPendientes") return grupos.sort((a, b) => a.clave.localeCompare(b.clave));
    const porClave = new Map(grupos.map((g) => [g.clave, g]));
    return periodosDelRango(r, dim).map((p) => porClave.get(p.clave) ?? { ...p, valor: 0, n: 0 });
  }
  return grupos.sort((a, b) => b.valor - a.valor);
}

/**
 * Charts show at most `max` bars: the rest folds into "Otros" (never a 9th
 * color, never a hidden tail). Averages and ratios are not foldable, so the
 * tail is simply left to the table view there.
 */
export function plegar(grupos: Grupo[], metrica: Metrica, max = 8): Grupo[] {
  if (grupos.length <= max) return grupos;
  const cabeza = grupos.slice(0, max - 1);
  const cola = grupos.slice(max - 1);
  if (metrica === "ahorroPct" || metrica === "cicloDias" || metrica === "ofertasPromedio") return grupos.slice(0, max);
  return [...cabeza, { clave: "__otros", etiqueta: `Otros (${cola.length})`, valor: suma(cola.map((g) => g.valor)), n: suma(cola.map((g) => g.n)) }];
}

// --- Concentration, funnel, budget -------------------------------------------

export interface Concentracion {
  hhi: number;
  nivel: "baja" | "moderada" | "alta";
  top1: { nombre: string; share: number } | null;
  top5Share: number;
  proveedores: { nombre: string; gasto: number; share: number; contratos: number }[];
}

/** Herfindahl-Hirschman index over spend shares (0–10 000): <1 500 low, 1 500–2 500 moderate, >2 500 high. */
export function concentracion(d: DatosFiltrados, r: Rango): Concentracion {
  const rows = contratosDeGasto(d, r).filter((c) => esBase(c.moneda, d.moneda));
  const total = suma(rows.map((c) => c.monto));
  const porProv = new Map<string, { gasto: number; contratos: number }>();
  for (const c of rows) {
    const a = porProv.get(c.proveedor) ?? { gasto: 0, contratos: 0 };
    a.gasto += c.monto;
    a.contratos += 1;
    porProv.set(c.proveedor, a);
  }
  const proveedores = [...porProv.entries()]
    .map(([nombre, a]) => ({ nombre, gasto: a.gasto, contratos: a.contratos, share: total ? a.gasto / total : 0 }))
    .sort((a, b) => b.gasto - a.gasto);
  const hhi = Math.round(suma(proveedores.map((p) => (p.share * 100) ** 2)));
  return {
    hhi,
    nivel: hhi > 2500 ? "alta" : hhi >= 1500 ? "moderada" : "baja",
    top1: proveedores[0] ? { nombre: proveedores[0].nombre, share: proveedores[0].share } : null,
    top5Share: suma(proveedores.slice(0, 5).map((p) => p.share)),
    proveedores,
  };
}

export interface EtapaEmbudo {
  etapa: string;
  procesos: number;
  /** Share of the first stage. */
  pct: number;
}

const ESTADOS_APROBADOS = new Set(["EN_LICITACION", "EN_NEGOCIACION", "ADJUDICADO", "EN_CUMPLIMIENTO", "CERRADO"]);

/** Processes created in the period, by how far they got. */
export function embudo(d: DatosFiltrados, r: Rango): EtapaEmbudo[] {
  const creados = procesosCreados(d, r);
  const etapas: [string, number][] = [
    ["Creados", creados.length],
    ["Aprobados", creados.filter((p) => p.aprobado || ESTADOS_APROBADOS.has(p.estado)).length],
    ["Con ofertas", creados.filter((p) => p.ofertas > 0).length],
    ["Adjudicados", creados.filter((p) => p.precioFinal != null).length],
    ["Contrato firmado", creados.filter((p) => p.firmado).length],
  ];
  const base = etapas[0][1];
  return etapas.map(([etapa, procesos]) => ({ etapa, procesos, pct: base ? procesos / base : 0 }));
}

export function presupuestoDelAnio(datos: DatosCfo, f: FiltrosCfo, anio: number) {
  const bloque = datos.presupuestos.find((p) => p.anio === anio);
  if (!bloque) return [];
  const nombreUnidad = f.unidadId
    ? [...datos.procesos, ...datos.contratos].find((r0) => r0.unidadId === f.unidadId)?.unidad ?? null
    : null;
  return bloque.centros.filter(
    (c) => (!f.centroCostoId || c.centroCostoId === f.centroCostoId) && (!f.unidadId || c.unidad === nombreUnidad),
  );
}

// --- Filter options ----------------------------------------------------------

export function opcionesFiltro(datos: DatosCfo) {
  const unidades = new Map<string, string>();
  const centros = new Map<string, { nombre: string; unidadId: string | null }>();
  const categorias = new Set<string>();
  for (const r0 of [...datos.procesos, ...datos.contratos]) {
    if (r0.unidadId && r0.unidad) unidades.set(r0.unidadId, r0.unidad);
    if (r0.centroCostoId && r0.centroCosto) centros.set(r0.centroCostoId, { nombre: r0.centroCosto, unidadId: r0.unidadId });
    categorias.add(r0.categoria);
  }
  return {
    unidades: [...unidades.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    centros: [...centros.entries()].map(([id, c]) => ({ id, ...c })).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    categorias: [...categorias].sort((a, b) => a.localeCompare(b)),
  };
}
