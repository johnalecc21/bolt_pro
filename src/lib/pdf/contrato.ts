import { jsPDF } from "jspdf";

export interface ContratoPdfHito {
  label: string;
  comprometido: string;
  real: string | null;
  estado: string;
}

export interface ContratoPdfData {
  id: string;
  tipo: string;
  proveedor: string;
  cliente?: string;
  categoria: string;
  monto: number;
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

export function generateContratoPdf(data: ContratoPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, PAGE_WIDTH, 90, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Procurex", MARGIN_X, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${data.tipo} — ${data.id}`, MARGIN_X, 64);

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
    ["Monto", `$${data.monto.toLocaleString()}`],
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(NAVY);
  doc.text("Hitos de entrega", MARGIN_X, y);
  y += 24;

  doc.setFontSize(10.5);
  if (data.hitos.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text("Sin hitos de entrega definidos todavía.", MARGIN_X, y);
    y += 20;
  } else {
    for (const h of data.hitos) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(NAVY);
      doc.text(`• ${h.label}`, MARGIN_X, y);
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
    ["Condiciones de pago", `${condicionesPagoDias} días desde la aprobación de cada hito`],
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

  doc.setDrawColor("#E5E7EB");
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(`Documento generado automáticamente por Procurex el ${new Date().toLocaleDateString("es-CO")}.`, MARGIN_X, y);

  doc.save(`${data.id}.pdf`);
}
