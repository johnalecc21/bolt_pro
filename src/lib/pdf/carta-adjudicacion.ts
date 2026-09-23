import { formatMoney, type Moneda } from "@/lib/moneda";
import { jsPDF } from "jspdf";

export interface CartaAdjudicacionData {
  poId: string;
  cliente: string;
  proveedor: string;
  tituloProceso: string;
  precioFinal: number;
  moneda?: Moneda;
  plazoDias: number;
  condicionesPagoDias: number;
  garantiaMeses: number;
}

const PRIMARY = "#0B7DBB";
const NAVY = "#001635";
const MUTED = "#5B6B82";
const PAGE_WIDTH = 595;
const MARGIN_X = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

export function generateCartaAdjudicacionPdf(data: CartaAdjudicacionData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, PAGE_WIDTH, 90, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Procurex", MARGIN_X, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Carta de Adjudicación — ${data.poId}`, MARGIN_X, 64);

  let y = 130;
  doc.setTextColor(MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }), MARGIN_X, y);
  y += 26;

  doc.setFontSize(11);
  doc.setTextColor(NAVY);
  doc.setFont("helvetica", "bold");
  doc.text("Para:", MARGIN_X, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.proveedor, MARGIN_X + 60, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.text("De:", MARGIN_X, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.cliente, MARGIN_X + 60, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.text("Asunto:", MARGIN_X, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Adjudicación de "${data.tituloProceso}"`, MARGIN_X + 60, y);
  y += 34;

  doc.setDrawColor("#E5E7EB");
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 28;

  doc.setFontSize(10.5);
  doc.setTextColor(NAVY);
  doc.setFont("helvetica", "normal");

  const intro = `Por medio de la presente, ${data.cliente} le informa que, luego de un proceso de evaluación técnica y comercial, su oferta para el proceso "${data.tituloProceso}" ha sido seleccionada como ganadora.`;
  for (const line of doc.splitTextToSize(intro, CONTENT_WIDTH)) {
    doc.text(line, MARGIN_X, y);
    y += 15;
  }
  y += 12;

  const condicion = "Esta comunicación constituye una notificación de intención de adjudicación (Award Letter) y se encuentra condicionada a la firma del contrato u orden de compra correspondiente, así como al cumplimiento de los requisitos legales y administrativos aplicables. No constituye, por sí sola, un compromiso vinculante de compra.";
  for (const line of doc.splitTextToSize(condicion, CONTENT_WIDTH)) {
    doc.text(line, MARGIN_X, y);
    y += 15;
  }
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Términos preliminares acordados", MARGIN_X, y);
  y += 24;

  const rows: [string, string][] = [
    ["Precio final", formatMoney(data.precioFinal, data.moneda)],
    ["Plazo de entrega", `${data.plazoDias} días`],
    ["Condiciones de pago", `${data.condicionesPagoDias} días`],
    ["Garantía", `${data.garantiaMeses} meses`],
  ];
  doc.setFontSize(10.5);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(label, MARGIN_X, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(NAVY);
    doc.text(value, MARGIN_X + 150, y);
    y += 20;
  }
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(NAVY);
  const cierre = "Nos pondremos en contacto a la brevedad para coordinar la firma del contrato u orden de compra y los siguientes pasos del proceso.";
  for (const line of doc.splitTextToSize(cierre, CONTENT_WIDTH)) {
    doc.text(line, MARGIN_X, y);
    y += 15;
  }
  y += 30;

  doc.setFont("helvetica", "bold");
  doc.text(data.cliente, MARGIN_X, y);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED);
  doc.text("Emitido a través de Procurex", MARGIN_X, y);

  doc.setDrawColor("#E5E7EB");
  doc.line(MARGIN_X, 780, PAGE_WIDTH - MARGIN_X, 780);
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(`Documento generado automáticamente por Procurex el ${new Date().toLocaleDateString("es-CO")}.`, MARGIN_X, 800);

  doc.save(`carta-adjudicacion-${data.poId}.pdf`);
}
