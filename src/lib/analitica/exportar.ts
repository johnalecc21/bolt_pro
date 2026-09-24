import { formatMoney, formatMoneyCompact, type Moneda } from "@/lib/moneda";
import type { Celda, Informe, Seccion, TipoColumna } from "./informe";

const PDF_TEXTO_SEGURO = /[\u202f\u2009]/g;
/** jsPDF's standard fonts are WinAnsi: characters outside it (like U+2212 minus) break its text layout. */
function pdfSeguro(s: string) {
  return s.replace(PDF_TEXTO_SEGURO, " ").replace(/\u2212/g, "-").replace(/[\u2018\u2019]/g, "'");
}

function nombreArchivo(informe: Informe, ext: string) {
  return `analitica-cfo_${informe.periodo.desde}_${informe.periodo.hasta}.${ext}`;
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function tipoCelda(s: Seccion, fila: number, col: number): TipoColumna {
  if (s.tipoPorFila && col > 0 && col < s.columnas.length - 1) return s.tipoPorFila[fila];
  return s.columnas[col].tipo;
}

/** Human-readable value, used by CSV text columns and the PDF. */
export function textoCelda(v: Celda, tipo: TipoColumna, moneda: Moneda, compacto = false): string {
  if (v == null || v === "") return "—";
  if (typeof v === "string") {
    if (tipo === "fecha")
      return compacto
        ? new Date(v).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })
        : new Date(v).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
    return v;
  }
  switch (tipo) {
    case "moneda":
      return (compacto ? formatMoneyCompact(v, moneda) : formatMoney(v, moneda)).replace(PDF_TEXTO_SEGURO, " ");
    case "pct":
      return `${(v * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })}%`;
    case "decimal":
      return v.toLocaleString("es-CO", { maximumFractionDigits: 1 });
    default:
      return Math.round(v).toLocaleString("es-CO");
  }
}

// --- CSV ------------------------------------------------------------------------

function csvEscape(v: string) {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** One table as CSV: raw numbers (dot decimal), dates as YYYY-MM-DD, UTF-8 with BOM so Excel keeps accents. */
export function seccionACsv(s: Seccion): string {
  const header = s.columnas.map((c) => csvEscape(c.titulo)).join(",");
  const filas = s.filas.map((f, i) =>
    f
      .map((v, j) => {
        if (v == null) return "";
        if (typeof v === "number") return String(Math.round(v * 10000) / 10000);
        return csvEscape(tipoCelda(s, i, j) === "fecha" ? v.slice(0, 10) : v);
      })
      .join(","),
  );
  return [header, ...filas].join("\n");
}

/** Downloads one table as CSV; `sufijo` usually carries the period. */
export function descargarSeccionCsv(s: Seccion, sufijo: string) {
  descargar(new Blob(["\ufeff" + seccionACsv(s)], { type: "text/csv;charset=utf-8" }), `${s.id}_${sufijo}.csv`);
}

export function exportarCsv(informe: Informe, seccionId: string) {
  const s = informe.secciones.find((x) => x.id === seccionId);
  if (s) descargarSeccionCsv(s, `${informe.periodo.desde}_${informe.periodo.hasta}`);
}

// --- Excel ------------------------------------------------------------------------

const FORMATO_XLSX: Partial<Record<TipoColumna, string>> = {
  moneda: "#,##0",
  entero: "#,##0",
  decimal: "#,##0.0",
  pct: "0.0%",
};

function nombreHoja(t: string) {
  return t.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
}

/** One sheet per section plus a cover sheet with period, filters and notes. */
export function exportarExcel(informe: Informe) {
  return generarExcel({
    titulo: "Informe de gestión de compras",
    portada: [
      informe.empresa,
      `Período: ${informe.periodo.desde} a ${informe.periodo.hasta}`,
      `Comparado con: ${informe.periodo.desdeAnterior} a ${informe.periodo.desde}`,
      `Filtros: ${informe.filtros.length ? informe.filtros.join(" · ") : "ninguno"}`,
      `Generado: ${new Date(informe.generadoEn).toLocaleString("es-CO")}`,
    ],
    notas: informe.notas,
    secciones: informe.secciones,
    archivo: nombreArchivo(informe, "xlsx"),
  });
}

/** Cover sheet (title, context lines, notes) plus one sheet per section. */
export async function generarExcel(libro: { titulo: string; portada: string[]; notas: string[]; secciones: Seccion[]; archivo: string }) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  type Hoja = Parameters<typeof writeXlsxFile>[0];
  const negrita = (value: string) => ({ value, fontWeight: "bold" as const });

  const portada = [
    [negrita(libro.titulo)],
    ...libro.portada.map((l) => [l]),
    [null],
    [negrita("Notas")],
    ...libro.notas.map((n) => [n]),
  ];

  const hojas = libro.secciones.map((s) => {
    const data = [
      s.columnas.map((c) => ({ value: c.titulo, fontWeight: "bold" as const, backgroundColor: "#E6EFFB" })),
      ...s.filas.map((f, i) =>
        f.map((v, j) => {
          const tipo = tipoCelda(s, i, j);
          if (v == null) return null;
          if (tipo === "fecha" && typeof v === "string") return { value: new Date(v), type: Date, format: "yyyy-mm-dd" };
          if (typeof v === "number") return { value: v, type: Number, format: FORMATO_XLSX[tipo] };
          return { value: v, type: String };
        }),
      ),
    ];
    const columns = s.columnas.map((c) => ({ width: c.tipo === "texto" ? 28 : 16 }));
    return { data, sheet: nombreHoja(s.titulo), columns };
  });

  const sheets = [{ data: portada, sheet: "Portada", columns: [{ width: 110 }] }, ...hojas] as unknown as Hoja;
  const blob = await writeXlsxFile(sheets).toBlob();
  descargar(blob, libro.archivo);
}

// --- PDF ------------------------------------------------------------------------

const AZUL: [number, number, number] = [42, 120, 214]; // --viz-1
const TINTA: [number, number, number] = [11, 11, 11];
const TINTA_2: [number, number, number] = [82, 81, 78];
const GRIS: [number, number, number] = [137, 135, 129];
const HAIRLINE: [number, number, number] = [225, 224, 217];
const NIVEL_COLOR: Record<string, [number, number, number]> = {
  Crítico: [208, 59, 59],
  Atención: [236, 131, 90],
  Positivo: [12, 163, 12],
  Información: [42, 120, 214],
};

/** Executive report: KPIs vs. previous period, findings, charts and the key tables. */
export interface TarjetaPdf {
  t: string;
  v: string;
  /** Current and previous value for the delta line; null = not comparable. */
  a: number | null;
  b: number | null;
  subirEsBueno: boolean;
  /** Replaces the delta line (e.g. "A hoy"). */
  nota?: string;
}

export interface GraficaPdf {
  titulo: string;
  tipo: "vertical" | "horizontal";
  datos: [string, number][];
  formato: TipoColumna;
}

/** Everything a PDF report needs; each dashboard builds one from its own report data. */
export interface DocumentoPdf {
  titulo: string;
  linea1: string;
  linea2: string;
  pie: string;
  archivo: string;
  moneda: Moneda;
  tarjetas: TarjetaPdf[];
  hallazgos: { nivel: "critico" | "atencion" | "positivo" | "info"; titulo: string; detalle: string }[];
  graficas: GraficaPdf[];
  tablas: { seccion: Seccion; limite: number }[];
  notas: string[];
}

/** CFO executive report: KPIs vs. previous period, findings, charts and the key tables. */
export function exportarPdf(informe: Informe) {
  const m = informe.moneda;
  const k = informe.kpis;
  const kp = informe.kpisAnterior;
  const sec = (id: string) => informe.secciones.find((s) => s.id === id)!;
  const mensual = sec("mensual");
  return generarPdf({
    titulo: "Informe de gestión de compras",
    linea1: `${informe.empresa} · ${informe.periodo.desde} a ${informe.periodo.hasta} · montos en ${m}`,
    linea2: `Filtros: ${informe.filtros.length ? informe.filtros.join(" · ") : "ninguno"} · generado ${new Date(informe.generadoEn).toLocaleString("es-CO")}`,
    pie: `${informe.empresa} · Analítica de compras`,
    archivo: nombreArchivo(informe, "pdf"),
    moneda: m,
    tarjetas: [
      { t: "Gasto comprometido", v: formatMoneyCompact(k.gasto, m), a: k.gasto, b: kp.gasto, subirEsBueno: false },
      { t: "Ahorro vs. presupuesto", v: `${formatMoneyCompact(k.ahorro, m)} (${textoCelda(k.ahorroPct, "pct", m)})`, a: k.ahorro, b: kp.ahorro, subirEsBueno: true },
      { t: "Ahorro por negociación", v: formatMoneyCompact(k.ahorroNegociacion, m), a: k.ahorroNegociacion, b: kp.ahorroNegociacion, subirEsBueno: true },
      { t: "Procesos adjudicados", v: String(k.procesosAdjudicados), a: k.procesosAdjudicados, b: kp.procesosAdjudicados, subirEsBueno: true },
      { t: "Ciclo promedio", v: k.cicloDias != null ? `${textoCelda(k.cicloDias, "decimal", m)} días` : "—", a: k.cicloDias, b: kp.cicloDias, subirEsBueno: false },
      { t: "Ofertas por proceso", v: textoCelda(k.ofertasPromedio, "decimal", m), a: k.ofertasPromedio, b: kp.ofertasPromedio, subirEsBueno: true },
      { t: "Entrega a tiempo", v: textoCelda(k.entregaATiempo, "pct", m), a: k.entregaATiempo, b: kp.entregaATiempo, subirEsBueno: true },
      { t: "Proveedores con contrato", v: String(k.proveedoresActivos), a: k.proveedoresActivos, b: kp.proveedoresActivos, subirEsBueno: true },
    ],
    hallazgos: informe.insights,
    graficas: [
      { titulo: "Gasto comprometido por mes", tipo: "vertical", datos: mensual.filas.map((f) => [String(f[0]), Number(f[1] ?? 0)]), formato: "moneda" },
      { titulo: "Ahorro por mes", tipo: "vertical", datos: mensual.filas.map((f) => [String(f[0]), Number(f[3] ?? 0)]), formato: "moneda" },
      { titulo: "Gasto por categoría", tipo: "horizontal", datos: sec("categorias").filas.slice(0, 8).map((f) => [String(f[0]), Number(f[1] ?? 0)]), formato: "moneda" },
      { titulo: "Top proveedores por gasto", tipo: "horizontal", datos: sec("proveedores").filas.slice(0, 8).map((f) => [String(f[0]), Number(f[1] ?? 0)]), formato: "moneda" },
    ],
    tablas: (
      [
        ["categorias", 30],
        ["proveedores", 20],
        ["centros", 30],
        ["embudo", 10],
        ["vencimientos", 20],
        ["pagos", 25],
      ] as [string, number][]
    ).map(([id, limite]) => ({ seccion: sec(id), limite })),
    notas: informe.notas,
  });
}

export async function generarPdf(dp: DocumentoPdf) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  let y = M;
  const m = dp.moneda;
  const t = pdfSeguro;
  /** Cuts a cell to its column width (no wrapping inside table rows). */
  const ajustar = (texto: string, ancho: number) => {
    if (doc.getTextWidth(texto) <= ancho) return texto;
    let x = texto;
    while (x.length > 1 && doc.getTextWidth(`${x}…`) > ancho) x = x.slice(0, -1);
    return `${x}…`;
  };
  /** Round axis maximum: 1, 2, 2.5, 5 × 10^n. */
  const redondo = (v: number) => {
    if (v <= 0) return 1;
    const p = 10 ** Math.floor(Math.log10(v));
    return ([1, 2, 2.5, 5, 10].find((f) => f * p >= v) ?? 10) * p;
  };

  const nuevaPagina = () => {
    doc.addPage();
    y = M;
  };
  const espacio = (alto: number) => {
    if (y + alto > H - 16) nuevaPagina();
  };
  const titulo = (texto: string, sub?: string) => {
    espacio(16);
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...TINTA).text(t(texto), M, y);
    y += 5;
    if (sub) {
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...TINTA_2);
      const lineas = doc.splitTextToSize(t(sub), W - 2 * M);
      doc.text(lineas, M, y);
      y += lineas.length * 3.6;
    }
    y += 2;
  };

  // Header band
  doc.setFillColor(0, 22, 53).rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(16).text(t(dp.titulo), M, 13);
  doc.setFont("helvetica", "normal").setFontSize(9).text(t(dp.linea1), M, 20);
  doc.setFontSize(8).text(t(dp.linea2), M, 25);
  doc.setFont("helvetica", "bold").setFontSize(10).text("Procurex", W - M, 13, { align: "right" });
  y = 38;

  // KPI grid (4 per row)
  const tarjetas = dp.tarjetas;
  const cw = (W - 2 * M - 3 * 4) / 4;
  tarjetas.forEach((c, i) => {
    const x = M + (i % 4) * (cw + 4);
    const yy = y + Math.floor(i / 4) * 24;
    doc.setDrawColor(...HAIRLINE).setLineWidth(0.2).roundedRect(x, yy, cw, 20, 2, 2, "S");
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...TINTA_2).text(t(c.t), x + 3, yy + 5);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...TINTA).text(t(c.v), x + 3, yy + 11.5, { maxWidth: cw - 6 });
    if (c.nota) {
      doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...GRIS).text(t(c.nota), x + 3, yy + 17);
    } else if (c.a != null && c.b != null && c.b !== 0) {
      const delta = (c.a - c.b) / Math.abs(c.b);
      const bueno = delta === 0 ? null : (delta > 0) === c.subirEsBueno;
      doc.setFont("helvetica", "normal").setFontSize(7);
      if (bueno === null) doc.setTextColor(...GRIS);
      else if (bueno) doc.setTextColor(0, 99, 0);
      else doc.setTextColor(208, 59, 59);
      doc.text(`${delta > 0 ? "+" : ""}${textoCelda(delta, "pct", m)} vs. período anterior`, x + 3, yy + 17);
    } else {
      doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...GRIS).text("sin base de comparación", x + 3, yy + 17);
    }
  });
  y += Math.ceil(tarjetas.length / 4) * 24 + 4;

  // Findings
  if (dp.hallazgos.length) {
    titulo("Hallazgos", "Derivados de los datos del período; cada uno se puede verificar en las tablas de este informe.");
    const niveles: Record<string, string> = { critico: "Crítico", atencion: "Atención", positivo: "Positivo", info: "Información" };
    for (const ins of dp.hallazgos) {
      const lineas = doc.splitTextToSize(t(ins.detalle), W - 2 * M - 30);
      espacio(6 + lineas.length * 3.6);
      const nivel = niveles[ins.nivel];
      doc.setFillColor(...(NIVEL_COLOR[nivel] ?? GRIS)).circle(M + 1.5, y - 1.2, 1.3, "F");
      doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...TINTA).text(nivel, M + 5, y);
      doc.text(t(ins.titulo), M + 26, y, { maxWidth: W - 2 * M - 26 });
      y += 4;
      doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...TINTA_2).text(lineas, M + 26, y);
      y += lineas.length * 3.4 + 2;
    }
  }

  // Charts drawn with the same numbers as the tables
  for (const g of dp.graficas) {
    if (g.tipo === "vertical") barrasVerticales(doc, g.titulo, g.datos, g.formato);
    else barrasHorizontales(doc, g.titulo, g.datos, g.formato);
  }

  function barrasVerticales(d: typeof doc, tituloGrafica: string, datos: [string, number][], formato: TipoColumna) {
    const alto = 48;
    espacio(alto + 22); // keep the title with its chart
    titulo(tituloGrafica);
    const x0 = M + 18;
    const ancho = W - M - x0;
    const max = redondo(Math.max(0, ...datos.map(([, v]) => v)));
    const min = Math.min(0, ...datos.map(([, v]) => v));
    const rango = max - min || 1;
    const yBase = y + alto * (max / rango);
    d.setDrawColor(...HAIRLINE).setLineWidth(0.15);
    for (let i = 0; i <= 4; i++) {
      const gy = y + (alto * i) / 4;
      d.line(x0, gy, W - M, gy);
      const valor = max - (rango * i) / 4;
      d.setFont("helvetica", "normal").setFontSize(6).setTextColor(...GRIS).text(t(textoCelda(valor, formato, m, true)), x0 - 2, gy + 1, { align: "right" });
    }
    const paso = ancho / Math.max(1, datos.length);
    const bw = Math.min(14, paso * 0.6);
    datos.forEach(([etq, v], i) => {
      const cx = x0 + paso * i + paso / 2;
      const h = (Math.abs(v) / rango) * alto;
      d.setFillColor(...AZUL).rect(cx - bw / 2, v >= 0 ? yBase - h : yBase, bw, Math.max(h, 0.01), "F");
      d.setFontSize(6).setTextColor(...GRIS).text(t(etq), cx, y + alto + 4, { align: "center" });
    });
    y += alto + 9;
  }

  function barrasHorizontales(d: typeof doc, tituloGrafica: string, datos: [string, number][], formato: TipoColumna) {
    if (!datos.length) return;
    const fila = 6;
    espacio(datos.length * fila + 18);
    titulo(tituloGrafica);
    const x0 = M + 48;
    const ancho = W - M - x0 - 28;
    const max = Math.max(1, ...datos.map(([, v]) => v));
    datos.forEach(([etq, v], i) => {
      const yy = y + i * fila;
      d.setFont("helvetica", "normal").setFontSize(7).setTextColor(...TINTA_2).text(ajustar(t(etq), 44), x0 - 2, yy + 3.2, { align: "right" });
      const w = (Math.max(0, v) / max) * ancho;
      d.setFillColor(...AZUL).rect(x0, yy, Math.max(w, 0.01), 4, "F");
      d.setTextColor(...TINTA).text(t(textoCelda(v, formato, m, true)), x0 + w + 2, yy + 3.2);
    });
    y += datos.length * fila + 4;
  }

  // Tables
  for (const { seccion, limite } of dp.tablas) {
    if (seccion && seccion.filas.length) tabla(seccion, limite);
  }

  function tabla(s: Seccion, limite: number) {
    titulo(s.titulo, s.descripcion);
    const cols = s.columnas;
    const anchoTotal = W - 2 * M;
    // Numeric columns get at least the width of their longest header word; text columns share the rest.
    doc.setFont("helvetica", "bold").setFontSize(6.5);
    const cabeceraMin = cols.map((c) => Math.max(...t(c.titulo).split(" ").map((w) => doc.getTextWidth(w) + 4)));
    doc.setFont("helvetica", "normal");
    const minimo = cols.map((c, j) =>
      c.tipo === "texto"
        ? 0
        : Math.max(
            12,
            cabeceraMin[j],
            ...s.filas.slice(0, limite).map((f, r) => doc.getTextWidth(t(textoCelda(f[j], tipoCelda(s, r, j), m, true))) + 4),
          ),
    );
    const fijo = minimo.reduce((a, b) => a + b, 0);
    const nTexto = cols.filter((c) => c.tipo === "texto").length || 1;
    const anchos = cols.map((c, i) => (c.tipo === "texto" ? Math.max(18, (anchoTotal - fijo) / nTexto) : minimo[i]));
    const escala = anchoTotal / anchos.reduce((a, b) => a + b, 0);
    for (let i = 0; i < anchos.length; i++) anchos[i] *= escala;
    const cabecera = () => {
      doc.setFont("helvetica", "bold").setFontSize(6.5).setTextColor(...TINTA);
      const lineas = cols.map((c, i) => doc.splitTextToSize(t(c.titulo), anchos[i] - 3) as string[]);
      const nLineas = Math.max(...lineas.map((l) => l.length));
      const alto = nLineas * 2.8 + 2.7;
      doc.setFillColor(230, 239, 251).rect(M, y - 3.5, anchoTotal, alto, "F");
      let x = M;
      cols.forEach((c, i) => {
        const der = c.tipo !== "texto";
        doc.text(lineas[i], der ? x + anchos[i] - 1.5 : x + 1.5, y, { align: der ? "right" : "left" });
        x += anchos[i];
      });
      y += alto;
    };
    espacio(12);
    cabecera();
    const filas = s.filas.slice(0, limite);
    filas.forEach((f, r) => {
      if (y > H - 18) {
        nuevaPagina();
        cabecera();
      }
      doc.setFont("helvetica", "normal").setFontSize(6.5).setTextColor(...TINTA_2);
      let x = M;
      f.forEach((v, j) => {
        const tipo = tipoCelda(s, r, j);
        const der = cols[j].tipo !== "texto";
        const texto = ajustar(t(textoCelda(v, tipo, m, true)), anchos[j] - 3);
        doc.text(texto, der ? x + anchos[j] - 1.5 : x + 1.5, y, { align: der ? "right" : "left" });
        x += anchos[j];
      });
      doc.setDrawColor(...HAIRLINE).setLineWidth(0.1).line(M, y + 1.5, M + anchoTotal, y + 1.5);
      y += 4.6;
    });
    if (s.filas.length > limite) {
      doc.setFontSize(6.5).setTextColor(...GRIS).text(`Mostrando ${limite} de ${s.filas.length}. El detalle completo está en la exportación a Excel.`, M, y + 1);
      y += 4;
    }
    y += 4;
  }

  // Notes
  titulo("Notas metodológicas");
  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...TINTA_2);
  for (const n of dp.notas) {
    const lineas = doc.splitTextToSize(`• ${t(n)}`, W - 2 * M);
    espacio(lineas.length * 3.6 + 1);
    doc.text(lineas, M, y);
    y += lineas.length * 3.6 + 1;
  }

  // Footer with page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...GRIS);
    doc.text(t(dp.pie), M, H - 8);
    doc.text(`Página ${i} de ${total}`, W - M, H - 8, { align: "right" });
  }

  doc.save(dp.archivo);
}
