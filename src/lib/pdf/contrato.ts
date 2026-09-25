import { formatMoney, type Moneda } from "@/lib/moneda";
import { jsPDF } from "jspdf";
import type { MarcaPdf } from "@/lib/api/contratos";

/** The buyer's letterhead, with the logo already loaded as a data URL. */
export type MarcaDocumento = Omit<MarcaPdf, "logoUrl"> & { logo?: { dataUrl: string; formato: "PNG" | "JPEG" | "WEBP"; ancho: number; alto: number } | null };

/** Loads the (signed) logo URL into something jsPDF can draw; null on failure. */
export async function cargarLogo(url: string): Promise<MarcaDocumento["logo"]> {
  try {
    const blob = await (await fetch(url)).blob();
    const dataUrl = await new Promise<string>((ok, mal) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result));
      r.onerror = mal;
      r.readAsDataURL(blob);
    });
    const dims = await new Promise<{ ancho: number; alto: number }>((ok, mal) => {
      const img = new Image();
      img.onload = () => ok({ ancho: img.naturalWidth, alto: img.naturalHeight });
      img.onerror = mal;
      img.src = dataUrl;
    });
    const formato = blob.type.includes("png") ? "PNG" : blob.type.includes("webp") ? "WEBP" : "JPEG";
    return { dataUrl, formato, ...dims };
  } catch {
    return null;
  }
}

export interface ContratoPdfHito {
  label: string;
  comprometido: string;
  real: string | null;
  estado: string;
  /** % of the contract paid when the milestone is received. */
  porcentaje?: number;
}

export interface ContratoPdfLinea {
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ContratoPdfData {
  id: string;
  /** Human-readable code (CTO-0001 / PO-0001); shown instead of the id. */
  codigo?: string;
  /** Awarded lines, when the process was itemized. */
  lineas?: ContratoPdfLinea[];
  /** Set on a Contrato Marco: it's a ceiling paid through POs. */
  esMarco?: boolean;
  tipo: string;
  proveedor: string;
  cliente?: string;
  categoria: string;
  monto: number;
  moneda?: Moneda;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: string;
  hitos: ContratoPdfHito[];
  objeto?: string;
  garantiaMeses?: number;
  plazoDias?: number;
  condicionesPagoDias?: number;
}

const PRIMARY = "#0B7DBB";
const NAVY = "#001635";
const MUTED = "#5B6B82";
const PAGE_WIDTH = 595;
const MARGIN_X = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const PAGE_HEIGHT = 842;
const MARGIN_BOTTOM = 60;

export function generateContratoPdf(data: ContratoPdfData, marca?: MarcaDocumento | null) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const color = marca?.colorPrimario || PRIMARY;
  const empresa = marca?.razonSocial || data.cliente || "Procurex";

  doc.setFillColor(color);
  doc.rect(0, 0, PAGE_WIDTH, 90, "F");
  // Logo on a white card at the right of the band, keeping its proportions.
  let anchoLogo = 0;
  if (marca?.logo) {
    const maxW = 120;
    const maxH = 54;
    const k = Math.min(maxW / marca.logo.ancho, maxH / marca.logo.alto);
    const w = marca.logo.ancho * k;
    const h = marca.logo.alto * k;
    doc.setFillColor("#FFFFFF");
    doc.roundedRect(PAGE_WIDTH - MARGIN_X - w - 12, 18, w + 12, 54, 6, 6, "F");
    try {
      doc.addImage(marca.logo.dataUrl, marca.logo.formato, PAGE_WIDTH - MARGIN_X - w - 6, 18 + (54 - h) / 2, w, h);
      anchoLogo = w + 24;
    } catch {
      anchoLogo = 0;
    }
  }
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(marca ? 16 : 20);
  doc.text(doc.splitTextToSize(empresa, CONTENT_WIDTH - anchoLogo)[0] as string, MARGIN_X, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const datosEmpresa = marca ? [marca.nit ? `NIT ${marca.nit}` : "", [marca.direccion, marca.ciudad].filter(Boolean).join(", "), marca.telefono ?? ""].filter(Boolean).join(" · ") : "";
  if (datosEmpresa) doc.text(doc.splitTextToSize(datosEmpresa, CONTENT_WIDTH - anchoLogo)[0] as string, MARGIN_X, 56);
  doc.setFontSize(11);
  doc.text(`${data.tipo} — ${data.codigo ?? data.id}`, MARGIN_X, datosEmpresa ? 74 : 64);

  let y = 130;
  doc.setTextColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Orden de Compra / Contrato", MARGIN_X, y);
  y += 32;

  const rows: [string, string][] = [
    ["Proveedor", data.proveedor],
    ...(data.cliente ? ([["Cliente", data.cliente]] as [string, string][]) : []),
    ["Categoría", data.categoria],
    ["Monto", formatMoney(data.monto, data.moneda)],
    ["Vigencia", `${data.vigenciaInicio} — ${data.vigenciaFin}`],
    ["Estado", data.estado],
  ];
  doc.setFontSize(11);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(label, MARGIN_X, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(NAVY);
    doc.text(value, MARGIN_X + 150, y);
    y += 22;
  }

  y += 16;
  doc.setDrawColor("#E5E7EB");
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 30;

  if (data.objeto) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(NAVY);
    doc.text("Objeto del contrato", MARGIN_X, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(MUTED);
    const objetoLines = doc.splitTextToSize(data.objeto, CONTENT_WIDTH);
    doc.text(objetoLines, MARGIN_X, y);
    y += objetoLines.length * 14 + 20;

    doc.setDrawColor("#E5E7EB");
    doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
    y += 30;
  }

  if (data.lineas?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(NAVY);
    doc.text("Ítems adjudicados", MARGIN_X, y);
    y += 20;
    doc.setFontSize(9.5);
    for (const l of data.lineas) {
      if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 20) {
        doc.addPage();
        y = 60;
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(NAVY);
      const desc = doc.splitTextToSize(l.descripcion, CONTENT_WIDTH - 230)[0] as string;
      doc.text(desc, MARGIN_X, y);
      doc.setTextColor(MUTED);
      doc.text(`${l.cantidad.toLocaleString("es-CO", { maximumFractionDigits: 3 })} ${l.unidad} × ${formatMoney(l.precioUnitario, data.moneda)}`, PAGE_WIDTH - MARGIN_X - 110, y, { align: "right" });
      doc.setTextColor(NAVY);
      doc.text(formatMoney(l.subtotal, data.moneda), PAGE_WIDTH - MARGIN_X, y, { align: "right" });
      y += 16;
    }
    y += 12;
    doc.setDrawColor("#E5E7EB");
    doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
    y += 30;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(NAVY);
  doc.text("Hitos de entrega", MARGIN_X, y);
  y += 24;

  doc.setFontSize(10.5);
  if (data.hitos.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(
      data.esMarco
        ? "Contrato Marco: se ejecuta y se paga mediante órdenes de compra emitidas contra él."
        : "Sin hitos de entrega definidos todavía.",
      MARGIN_X,
      y,
    );
    y += 20;
  } else {
    for (const h of data.hitos) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(NAVY);
      if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 36) {
        doc.addPage();
        y = 60;
      }
      doc.text(`• ${h.label}${h.porcentaje ? ` — ${h.porcentaje}% del valor (${formatMoney(Math.round((data.monto * h.porcentaje) / 100), data.moneda)})` : ""}`, MARGIN_X, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(MUTED);
      const fecha = h.real ? `Comprometido ${h.comprometido} · Real ${h.real}` : `Comprometido ${h.comprometido}`;
      doc.text(`${fecha} — ${h.estado}`, MARGIN_X + 14, y + 15);
      y += 36;
    }
  }

  y += 14;
  doc.setDrawColor("#E5E7EB");
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 30;

  if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 160) {
    doc.addPage();
    y = 60;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(NAVY);
  doc.text("Cláusulas contractuales", MARGIN_X, y);
  y += 24;

  const condicionesPagoDias = data.condicionesPagoDias ?? 30;
  const clausulaRows: [string, string][] = [
    ...(data.garantiaMeses ? ([["Garantía", `${data.garantiaMeses} meses posteriores a la entrega final`]] as [string, string][]) : []),
    ...(data.plazoDias ? ([["Plazo de ejecución", `${data.plazoDias} días calendario`]] as [string, string][]) : []),
    ["Condiciones de pago", `${condicionesPagoDias} días desde la radicación de la factura de cada hito recibido`],
  ];
  doc.setFontSize(11);
  for (const [label, value] of clausulaRows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(label, MARGIN_X, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(NAVY);
    doc.text(value, MARGIN_X + 150, y);
    y += 22;
  }
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(NAVY);
  doc.text("Penalidades por incumplimiento", MARGIN_X, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED);
  const penalidadTexto =
    `En caso de atraso injustificado en cualquiera de los hitos pactados, el PROVEEDOR reconocerá al CLIENTE una penalidad ` +
    `del 0.5% del monto del hito afectado por cada día calendario de atraso, hasta un máximo acumulado del 10% del monto ` +
    `total del contrato. El incumplimiento reiterado (más de dos hitos consecutivos atrasados) faculta al CLIENTE a dar ` +
    `por terminado el contrato sin perjuicio de las acciones legales a que haya lugar.`;
  const penalidadLines = doc.splitTextToSize(penalidadTexto, CONTENT_WIDTH);
  doc.text(penalidadLines, MARGIN_X, y);
  y += penalidadLines.length * 13 + 20;

  if (marca?.clausulas?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(NAVY);
    if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 40) {
      doc.addPage();
      y = 60;
    }
    doc.text(`Cláusulas de ${empresa}`, MARGIN_X, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(MUTED);
    for (const linea of doc.splitTextToSize(marca.clausulas.trim(), CONTENT_WIDTH) as string[]) {
      if (y > PAGE_HEIGHT - MARGIN_BOTTOM) {
        doc.addPage();
        y = 60;
      }
      doc.text(linea, MARGIN_X, y);
      y += 13;
    }
    y += 20;
  }

  if (marca?.representanteLegal) {
    if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 70) {
      doc.addPage();
      y = 80;
    }
    y += 30;
    const mitad = CONTENT_WIDTH / 2;
    doc.setDrawColor(NAVY);
    doc.line(MARGIN_X, y, MARGIN_X + mitad - 30, y);
    doc.line(MARGIN_X + mitad + 10, y, PAGE_WIDTH - MARGIN_X, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(NAVY);
    doc.text(marca.representanteLegal, MARGIN_X, y + 14);
    doc.text(data.proveedor, MARGIN_X + mitad + 10, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(`${marca.cargoRepresentante ? `${marca.cargoRepresentante} · ` : ""}${empresa}`, MARGIN_X, y + 28);
    doc.text("Contratista", MARGIN_X + mitad + 10, y + 28);
    y += 50;
  }

  doc.setDrawColor("#E5E7EB");
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(marca?.piePagina?.trim() || `Documento generado automáticamente por Procurex el ${new Date().toLocaleDateString("es-CO")}.`, MARGIN_X, y);

  doc.save(`${data.codigo ?? data.id}.pdf`);
}
