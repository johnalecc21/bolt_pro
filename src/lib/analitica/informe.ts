import type { Moneda } from "@/lib/moneda";
import {
  agrupar,
  concentracion,
  embudo,
  excluidosPorMoneda,
  exposicion,
  filtrar,
  kpis,
  presupuestoDelAnio,
  procesosCreados,
  procesosFirmados,
  rangos,
  variacion,
  type Kpis,
} from "./agregador";
import { generarInsights, type Insight } from "./insights";
import type { DatosCfo, FiltrosCfo, ProcesoFila } from "./tipos";

export type TipoColumna = "texto" | "moneda" | "entero" | "decimal" | "pct" | "fecha";

export interface Columna {
  titulo: string;
  tipo: TipoColumna;
}

export type Celda = string | number | null;

export interface Seccion {
  id: string;
  titulo: string;
  descripcion?: string;
  columnas: Columna[];
  filas: Celda[][];
  /** When rows mix units (the summary): the type of each row's value cells, overriding the column's. */
  tipoPorFila?: TipoColumna[];
}

export interface Informe {
  empresa: string;
  moneda: Moneda;
  periodo: { desde: string; hasta: string; desdeAnterior: string };
  filtros: string[];
  generadoEn: string;
  notas: string[];
  kpis: Kpis;
  kpisAnterior: Kpis;
  insights: Insight[];
  secciones: Seccion[];
}

const NIVEL: Record<Insight["nivel"], string> = { critico: "Crítico", atencion: "Atención", positivo: "Positivo", info: "Información" };
const PRIORIDAD: Record<string, string> = { NORMAL: "Normal", ALTA: "Alta", URGENTE: "Urgente" };
const ESTADO: Record<string, string> = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  EN_LICITACION: "En licitación",
  EN_NEGOCIACION: "En negociación",
  ADJUDICADO: "Adjudicado",
  EN_CUMPLIMIENTO: "En cumplimiento",
  CERRADO: "Cerrado",
};

export function etiquetaEstado(e: string) {
  return ESTADO[e] ?? e;
}

const dias = (a: string, b: string) => Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));

/** Everything the dashboard shows, as plain tables — the single source for Excel, CSV and PDF. */
export function construirInforme(datos: DatosCfo, f: FiltrosCfo, etiquetasFiltro: string[] = [], ahora = Date.now()): Informe {
  const { actual, anterior } = rangos(datos);
  const d = filtrar(datos, f);
  const k = kpis(d, actual, ahora);
  const kPrev = kpis(d, anterior, ahora);
  const anio = Number(datos.hasta.slice(0, 4));
  const centros = presupuestoDelAnio(datos, f, anio);
  const insights = generarInsights(d, actual, anterior, centros, ahora);
  const expo = exposicion(d, ahora);
  const conc = concentracion(d, actual);
  const excl = excluidosPorMoneda(d, actual);
  const m = datos.moneda;

  const notas: string[] = [
    `Montos en ${m}, moneda base de la empresa.`,
    "Gasto = contratos y POs firmados en el período (las POs emitidas contra un contrato marco no se suman de nuevo). Ahorro = presupuesto − precio final de los procesos firmados en el período.",
  ];
  if (excl.contratos) {
    notas.push(`${excl.contratos} contrato(s) en otra moneda no se suman: ${excl.porMoneda.map((x) => `${x.monto.toLocaleString("es-CO")} ${x.moneda}`).join(", ")}.`);
  }
  if (datos.truncado) notas.push("El período tiene más de 5.000 registros: se analizaron los más recientes. Acota el período para un análisis completo.");

  const tiposResumen: TipoColumna[] = [];
  const fila = (titulo: string, tipo: TipoColumna, a: number | null, b: number | null): Celda[] => {
    tiposResumen.push(tipo);
    return [titulo, a, b, variacion(a, b)];
  };
  const resumenFilas: Celda[][] = [
    fila("Gasto comprometido", "moneda", k.gasto, kPrev.gasto),
    fila("Contratos firmados", "entero", k.contratos, kPrev.contratos),
    fila("Ahorro vs. presupuesto", "moneda", k.ahorro, kPrev.ahorro),
    fila("Ahorro %", "pct", k.ahorroPct, kPrev.ahorroPct),
    fila("Ahorro por negociación", "moneda", k.ahorroNegociacion, kPrev.ahorroNegociacion),
    fila("Procesos creados", "entero", k.procesosCreados, kPrev.procesosCreados),
    fila("Procesos adjudicados", "entero", k.procesosAdjudicados, kPrev.procesosAdjudicados),
    fila("Ciclo promedio (días)", "decimal", k.cicloDias, kPrev.cicloDias),
    fila("Ofertas por proceso", "decimal", k.ofertasPromedio, kPrev.ofertasPromedio),
    fila("Procesos negociados", "pct", k.tasaNegociacion, kPrev.tasaNegociacion),
    fila("Procesos con rechazo", "pct", k.tasaRechazo, kPrev.tasaRechazo),
    fila("Proveedores con contrato", "entero", k.proveedoresActivos, kPrev.proveedoresActivos),
    fila("Entrega a tiempo", "pct", k.entregaATiempo, kPrev.entregaATiempo),
    fila("Desempeño promedio (0–100)", "decimal", k.desempenoPromedio, kPrev.desempenoPromedio),
  ];

  const porMes = (metrica: Parameters<typeof agrupar>[1]) => agrupar(d, metrica, "mes", actual);
  const gastoMes = porMes("gasto");
  const contratosMes = porMes("contratos");
  const ahorroMes = porMes("ahorro");
  const creadosMes = porMes("procesosCreados");
  const adjMes = porMes("procesosAdjudicados");

  const gastoCat = agrupar(d, "gasto", "categoria", actual);
  const totalGasto = gastoCat.reduce((s, g) => s + g.valor, 0);
  const porClave = (metrica: Parameters<typeof agrupar>[1]) => new Map(agrupar(d, metrica, "categoria", actual).map((g) => [g.clave, g.valor]));
  const ahorroCat = porClave("ahorro");
  const ahorroPctCat = porClave("ahorroPct");
  const cicloCat = porClave("cicloDias");
  const ofertasCat = porClave("ofertasPromedio");
  const contratosCat = porClave("contratos");
  const categorias = new Set([...gastoCat.map((g) => g.clave), ...ahorroCat.keys()]);

  const evalPorProv = new Map<string, number[]>();
  for (const e of d.evaluaciones) if (new Date(e.fecha).getTime() >= actual.desde && new Date(e.fecha).getTime() < actual.hasta) evalPorProv.set(e.proveedor, [...(evalPorProv.get(e.proveedor) ?? []), e.puntaje]);
  const hitosPorProv = new Map<string, { total: number; aTiempo: number }>();
  for (const h of d.hitos) {
    const t = new Date(h.comprometido).getTime();
    if (t < actual.desde || t >= actual.hasta || t > ahora) continue;
    const a = hitosPorProv.get(h.proveedor) ?? { total: 0, aTiempo: 0 };
    a.total += 1;
    if (h.estado === "COMPLETADO" && h.real && h.real.slice(0, 10) <= h.comprometido.slice(0, 10)) a.aTiempo += 1;
    hitosPorProv.set(h.proveedor, a);
  }

  const firmados = procesosFirmados(d, actual);
  const creados = procesosCreados(d, actual);
  const detalle = new Map<string, ProcesoFila>();
  for (const p of [...creados, ...firmados]) detalle.set(p.id, p);

  const secciones: Seccion[] = [
    {
      id: "resumen",
      titulo: "Resumen",
      descripcion: `Período ${datos.desde} a ${datos.hasta} frente a ${datos.desdeAnterior} a ${datos.desde}.`,
      columnas: [
        { titulo: "Indicador", tipo: "texto" },
        { titulo: "Período", tipo: "decimal" },
        { titulo: "Período anterior", tipo: "decimal" },
        { titulo: "Variación", tipo: "pct" },
      ],
      filas: resumenFilas,
      tipoPorFila: tiposResumen,
    },
    {
      id: "mensual",
      titulo: "Evolución mensual",
      columnas: [
        { titulo: "Mes", tipo: "texto" },
        { titulo: `Gasto (${m})`, tipo: "moneda" },
        { titulo: "Contratos", tipo: "entero" },
        { titulo: `Ahorro (${m})`, tipo: "moneda" },
        { titulo: "Procesos creados", tipo: "entero" },
        { titulo: "Procesos adjudicados", tipo: "entero" },
      ],
      filas: gastoMes.map((g, i) => [g.etiqueta, g.valor, contratosMes[i]?.valor ?? 0, ahorroMes[i]?.valor ?? 0, creadosMes[i]?.valor ?? 0, adjMes[i]?.valor ?? 0]),
    },
    {
      id: "categorias",
      titulo: "Categorías",
      columnas: [
        { titulo: "Categoría", tipo: "texto" },
        { titulo: `Gasto (${m})`, tipo: "moneda" },
        { titulo: "% del gasto", tipo: "pct" },
        { titulo: "Contratos", tipo: "entero" },
        { titulo: `Ahorro (${m})`, tipo: "moneda" },
        { titulo: "Ahorro %", tipo: "pct" },
        { titulo: "Ciclo (días)", tipo: "decimal" },
        { titulo: "Ofertas por proceso", tipo: "decimal" },
      ],
      filas: [...categorias].map((c) => {
        const g = gastoCat.find((x) => x.clave === c)?.valor ?? 0;
        return [c, g, totalGasto ? g / totalGasto : 0, contratosCat.get(c) ?? 0, ahorroCat.get(c) ?? 0, ahorroPctCat.get(c) ?? null, cicloCat.get(c) ?? null, ofertasCat.get(c) ?? null];
      }).sort((a, b) => (b[1] as number) - (a[1] as number)),
    },
    {
      id: "proveedores",
      titulo: "Proveedores",
      descripcion: `Concentración (HHI): ${conc.hhi.toLocaleString("es-CO")} — ${conc.nivel}. Top 5 = ${(conc.top5Share * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })}% del gasto.`,
      columnas: [
        { titulo: "Proveedor", tipo: "texto" },
        { titulo: `Gasto (${m})`, tipo: "moneda" },
        { titulo: "Participación", tipo: "pct" },
        { titulo: "Contratos", tipo: "entero" },
        { titulo: "Desempeño promedio", tipo: "decimal" },
        { titulo: "Entrega a tiempo", tipo: "pct" },
      ],
      filas: conc.proveedores.map((p) => {
        const ev = evalPorProv.get(p.nombre);
        const h = hitosPorProv.get(p.nombre);
        return [p.nombre, p.gasto, p.share, p.contratos, ev ? ev.reduce((a, b) => a + b, 0) / ev.length : null, h && h.total ? h.aTiempo / h.total : null];
      }),
    },
    {
      id: "centros",
      titulo: `Presupuesto ${anio} por centro`,
      descripcion: "Ejecución a hoy, igual que en Estructura y presupuestos.",
      columnas: [
        { titulo: "Centro de costo", tipo: "texto" },
        { titulo: "Unidad", tipo: "texto" },
        { titulo: "Moneda", tipo: "texto" },
        { titulo: "Presupuesto", tipo: "moneda" },
        { titulo: "Comprometido", tipo: "moneda" },
        { titulo: "En proceso", tipo: "moneda" },
        { titulo: "Disponible", tipo: "moneda" },
        { titulo: "% usado", tipo: "pct" },
      ],
      filas: centros.map((c) => [
        `${c.codigo} — ${c.nombre}`,
        c.unidad ?? "—",
        c.moneda ?? "—",
        c.ejecucion?.presupuesto ?? null,
        c.ejecucion?.comprometido ?? null,
        c.ejecucion?.enProceso ?? null,
        c.ejecucion?.disponible ?? null,
        c.ejecucion ? c.ejecucion.porcentajeUsado / 100 : null,
      ]),
    },
    {
      id: "embudo",
      titulo: "Embudo de procesos",
      descripcion: "Procesos creados en el período, según hasta dónde llegaron.",
      columnas: [
        { titulo: "Etapa", tipo: "texto" },
        { titulo: "Procesos", tipo: "entero" },
        { titulo: "% de creados", tipo: "pct" },
      ],
      filas: embudo(d, actual).map((e) => [e.etapa, e.procesos, e.pct]),
    },
    {
      id: "pagos",
      titulo: "Pagos abiertos",
      descripcion: "A la fecha de generación.",
      columnas: [
        { titulo: "Contrato", tipo: "texto" },
        { titulo: "Proveedor", tipo: "texto" },
        { titulo: "Monto", tipo: "moneda" },
        { titulo: "Moneda", tipo: "texto" },
        { titulo: "Fecha pactada", tipo: "fecha" },
        { titulo: "Estado", tipo: "texto" },
      ],
      filas: d.pagos
        .filter((p) => p.estado !== "PAGADO")
        .map((p) => [p.contrato, p.proveedor, p.monto, p.moneda, p.pactada, p.estado === "VENCIDO" || new Date(p.pactada).getTime() < ahora ? "Vencido" : "Pendiente"]),
    },
    {
      id: "vencimientos",
      titulo: "Contratos por vencer (90 días)",
      columnas: [
        { titulo: "Contrato", tipo: "texto" },
        { titulo: "Proveedor", tipo: "texto" },
        { titulo: "Categoría", tipo: "texto" },
        { titulo: "Monto", tipo: "moneda" },
        { titulo: "Moneda", tipo: "texto" },
        { titulo: "Vence", tipo: "fecha" },
        { titulo: "Días", tipo: "entero" },
      ],
      filas: expo.contratosPorVencer.map((c) => [c.codigo, c.proveedor, c.categoria, c.monto, c.moneda, c.vigenciaFin, c.dias]),
    },
    {
      id: "procesos",
      titulo: "Detalle de procesos",
      descripcion: "Procesos creados o firmados en el período.",
      columnas: [
        { titulo: "Código", tipo: "texto" },
        { titulo: "Título", tipo: "texto" },
        { titulo: "Categoría", tipo: "texto" },
        { titulo: "Centro de costo", tipo: "texto" },
        { titulo: "Unidad", tipo: "texto" },
        { titulo: "Prioridad", tipo: "texto" },
        { titulo: "Estado", tipo: "texto" },
        { titulo: "Solicitante", tipo: "texto" },
        { titulo: "Creado", tipo: "fecha" },
        { titulo: "Firmado", tipo: "fecha" },
        { titulo: "Proveedor", tipo: "texto" },
        { titulo: "Moneda", tipo: "texto" },
        { titulo: "Presupuesto", tipo: "moneda" },
        { titulo: "Precio final", tipo: "moneda" },
        { titulo: "Ahorro", tipo: "moneda" },
        { titulo: "Ahorro %", tipo: "pct" },
        { titulo: "Ofertas", tipo: "entero" },
        { titulo: "Negociado", tipo: "texto" },
        { titulo: "Ciclo (días)", tipo: "entero" },
      ],
      filas: [...detalle.values()]
        .sort((a, b) => b.creado.localeCompare(a.creado))
        .map((p) => {
          const ahorro = p.precioFinal != null ? p.presupuesto - p.precioFinal : null;
          return [
            p.codigo,
            p.titulo,
            p.categoria,
            p.centroCosto ?? "—",
            p.unidad ?? "—",
            PRIORIDAD[p.prioridad] ?? p.prioridad,
            etiquetaEstado(p.estado),
            p.solicitante,
            p.creado,
            p.firmado,
            p.proveedorAdjudicado ?? "—",
            p.moneda,
            p.presupuesto,
            p.precioFinal,
            ahorro,
            ahorro != null && p.presupuesto ? ahorro / p.presupuesto : null,
            p.ofertas,
            p.negociado ? "Sí" : "No",
            p.firmado ? dias(p.creado, p.firmado) : null,
          ];
        }),
    },
    {
      id: "hallazgos",
      titulo: "Hallazgos",
      columnas: [
        { titulo: "Nivel", tipo: "texto" },
        { titulo: "Hallazgo", tipo: "texto" },
        { titulo: "Detalle", tipo: "texto" },
      ],
      filas: insights.map((i) => [NIVEL[i.nivel], i.titulo, i.detalle]),
    },
  ];

  return {
    empresa: datos.empresa,
    moneda: m,
    periodo: { desde: datos.desde, hasta: datos.hasta, desdeAnterior: datos.desdeAnterior },
    filtros: etiquetasFiltro,
    generadoEn: new Date(ahora).toISOString(),
    notas,
    kpis: k,
    kpisAnterior: kPrev,
    insights,
    secciones,
  };
}
