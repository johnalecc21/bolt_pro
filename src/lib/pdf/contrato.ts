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
}

const PRIMARY = "#0B7DBB";
const NAVY = "#001635";
const MUTED = "#5B6B82";
const PAGE_WIDTH = 595;
const MARGIN_X = 48;

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
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(`Documento generado automáticamente por Procurex el ${new Date().toLocaleDateString("es-CO")}.`, MARGIN_X, y);

  doc.save(`${data.id}.pdf`);
}
