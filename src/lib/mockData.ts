export type EstadoReq =
  | "borrador"
  | "pendiente_aprobacion"
  | "en_licitacion"
  | "en_negociacion"
  | "adjudicado"
  | "en_cumplimiento"
  | "cerrado";

export interface Requerimiento {
  id: string;
  titulo: string;
  categoria: string;
  estado: EstadoReq;
  montoEstimado: number;
  fechaLimite: string;
  progreso: number;
  proveedoresInvitados: number;
  ofertasRecibidas: number;
  solicitante: string;
  /** Defaults to "acme" when omitted — most seed data predates multi-tenant support. */
  companyId?: string;
}

export const requerimientos: Requerimiento[] = [
  { id: "RFP-2024-0032", titulo: "Servicios de nube y migración AWS", categoria: "TI", estado: "en_licitacion", montoEstimado: 185000, fechaLimite: "2024-08-12", progreso: 45, proveedoresInvitados: 8, ofertasRecibidas: 5, solicitante: "Carlos Méndez" },
  { id: "RFP-2024-0031", titulo: "Insumos de embalaje industrial", categoria: "Materia Prima", estado: "en_negociacion", montoEstimado: 92000, fechaLimite: "2024-08-08", progreso: 70, proveedoresInvitados: 6, ofertasRecibidas: 6, solicitante: "Laura Torres" },
  { id: "RFP-2024-0030", titulo: "Servicios de limpieza corporativa", categoria: "Servicios Generales", estado: "adjudicado", montoEstimado: 64000, fechaLimite: "2024-07-30", progreso: 85, proveedoresInvitados: 5, ofertasRecibidas: 4, solicitante: "Carlos Méndez" },
  { id: "RFP-2024-0029", titulo: "Flota vehicular logística", categoria: "Logística", estado: "en_cumplimiento", montoEstimado: 320000, fechaLimite: "2024-07-15", progreso: 95, proveedoresInvitados: 7, ofertasRecibidas: 7, solicitante: "Ana Ruiz" },
  { id: "RFP-2024-0028", titulo: "Campaña de marketing digital Q4", categoria: "Marketing", estado: "pendiente_aprobacion", montoEstimado: 78000, fechaLimite: "2024-08-20", progreso: 15, proveedoresInvitados: 0, ofertasRecibidas: 0, solicitante: "Laura Torres" },
  { id: "RFP-2024-0027", titulo: "Plataforma de capacitación RR.HH.", categoria: "RR.HH.", estado: "borrador", montoEstimado: 45000, fechaLimite: "2024-08-25", progreso: 5, proveedoresInvitados: 0, ofertasRecibidas: 0, solicitante: "Carlos Méndez" },
  { id: "RFP-2024-0026", titulo: "Auditoría externa anual", categoria: "Servicios Generales", estado: "cerrado", montoEstimado: 58000, fechaLimite: "2024-06-30", progreso: 100, proveedoresInvitados: 4, ofertasRecibidas: 4, solicitante: "Ana Ruiz" },
  { id: "RFP-2024-0025", titulo: "Licencias software de diseño", categoria: "TI", estado: "cerrado", montoEstimado: 38000, fechaLimite: "2024-06-15", progreso: 100, proveedoresInvitados: 5, ofertasRecibidas: 5, solicitante: "Carlos Méndez" },
  { id: "RFP-2024-0044", titulo: "Renovación de licencias Microsoft 365", categoria: "TI", estado: "en_licitacion", montoEstimado: 96000, fechaLimite: "2024-08-28", progreso: 30, proveedoresInvitados: 4, ofertasRecibidas: 2, solicitante: "María Gómez", companyId: "techcorp" },
  { id: "RFP-2024-0043", titulo: "Servicios de seguridad perimetral", categoria: "Servicios Generales", estado: "pendiente_aprobacion", montoEstimado: 54000, fechaLimite: "2024-09-05", progreso: 10, proveedoresInvitados: 0, ofertasRecibidas: 0, solicitante: "María Gómez", companyId: "techcorp" },
  { id: "RFP-2024-0045", titulo: "Consultoría de transformación digital", categoria: "TI", estado: "adjudicado", montoEstimado: 210000, fechaLimite: "2024-06-20", progreso: 100, proveedoresInvitados: 6, ofertasRecibidas: 5, solicitante: "María Gómez", companyId: "techcorp" },
];

export interface Proveedor {
  id: string;
  nombre: string;
  iniciales: string;
  categorias: string[];
  score: number;
  ubicacion: string;
  certificaciones: string[];
  procesosGanados: number;
  entregasATiempo: number;
  disputas: number;
  color: string;
}

export const proveedores: Proveedor[] = [
  { id: "P-001", nombre: "CloudSphere Technologies", iniciales: "CS", categorias: ["TI", "Cloud"], score: 94, ubicacion: "Bogotá, CO", certificaciones: ["ISO 27001", "ISO 9001", "ESG"], procesosGanados: 18, entregasATiempo: 97, disputas: 0, color: "oklch(0.60 0.22 280)" },
  { id: "P-002", nombre: "EcoPack Industrial", iniciales: "EP", categorias: ["Materia Prima", "Embalaje"], score: 88, ubicacion: "Medellín, CO", certificaciones: ["ISO 14001", "BASC"], procesosGanados: 12, entregasATiempo: 92, disputas: 1, color: "oklch(0.60 0.18 155)" },
  { id: "P-003", nombre: "CleanPro Services", iniciales: "CP", categorias: ["Servicios Generales"], score: 81, ubicacion: "Cali, CO", certificaciones: ["ISO 9001"], procesosGanados: 9, entregasATiempo: 88, disputas: 2, color: "oklch(0.70 0.18 68)" },
  { id: "P-004", nombre: "LogiFleet LATAM", iniciales: "LF", categorias: ["Logística", "Transporte"], score: 91, ubicacion: "Ciudad de México, MX", certificaciones: ["BASC", "ISO 39001", "ESG"], procesosGanados: 22, entregasATiempo: 95, disputas: 0, color: "oklch(0.65 0.20 200)" },
  { id: "P-005", nombre: "DigitalWave Marketing", iniciales: "DW", categorias: ["Marketing", "Digital"], score: 85, ubicacion: "Lima, PE", certificaciones: ["ESG"], procesosGanados: 7, entregasATiempo: 90, disputas: 1, color: "oklch(0.65 0.22 340)" },
  { id: "P-006", nombre: "TalentHub Solutions", iniciales: "TH", categorias: ["RR.HH.", "Capacitación"], score: 79, ubicacion: "Santiago, CL", certificaciones: ["ISO 9001"], procesosGanados: 5, entregasATiempo: 84, disputas: 0, color: "oklch(0.60 0.18 230)" },
  { id: "P-007", nombre: "AuditTrust Asociados", iniciales: "AT", categorias: ["Servicios Generales", "Auditoría"], score: 96, ubicacion: "Bogotá, CO", certificaciones: ["ISO 9001", "ISO 27001"], procesosGanados: 14, entregasATiempo: 99, disputas: 0, color: "oklch(0.55 0.22 280)" },
  { id: "P-008", nombre: "SoftDesign Studio", iniciales: "SD", categorias: ["TI", "Software"], score: 83, ubicacion: "Buenos Aires, AR", certificaciones: ["ISO 9001", "ESG"], procesosGanados: 11, entregasATiempo: 89, disputas: 1, color: "oklch(0.70 0.18 200)" },
  { id: "P-009", nombre: "GlobalChem Supplies", iniciales: "GC", categorias: ["Materia Prima", "Químicos"], score: 87, ubicacion: "Quito, EC", certificaciones: ["ISO 14001", "BASC", "ISO 9001"], procesosGanados: 16, entregasATiempo: 93, disputas: 0, color: "oklch(0.60 0.18 155)" },
  { id: "P-010", nombre: "NovaTech Consulting", iniciales: "NT", categorias: ["TI", "Consultoría"], score: 92, ubicacion: "Montevideo, UY", certificaciones: ["ISO 27001", "ESG", "ISO 9001"], procesosGanados: 20, entregasATiempo: 96, disputas: 0, color: "oklch(0.50 0.24 280)" },
  { id: "P-011", nombre: "PrimeBuild Constructora", iniciales: "PB", categorias: ["Servicios Generales", "Construcción"], score: 78, ubicacion: "Bogotá, CO", certificaciones: ["ISO 9001"], procesosGanados: 8, entregasATiempo: 82, disputas: 2, color: "oklch(0.72 0.18 68)" },
  { id: "P-012", nombre: "FleetMaster Logistics", iniciales: "FM", categorias: ["Logística"], score: 89, ubicacion: "São Paulo, BR", certificaciones: ["BASC", "ISO 39001"], procesosGanados: 15, entregasATiempo: 94, disputas: 1, color: "oklch(0.65 0.20 200)" },
];

export interface Contrato {
  id: string;
  tipo: "Contrato" | "PO" | "Addendum";
  proveedor: string;
  categoria: string;
  monto: number;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: "Activo" | "Por vencer" | "Vencido" | "En renovación";
  /** Defaults to "acme" when omitted — most seed data predates multi-tenant support. */
  companyId?: string;
}

export const contratos: Contrato[] = [
  { id: "CTO-2024-0042", tipo: "Contrato", proveedor: "CloudSphere Technologies", categoria: "TI", monto: 185000, vigenciaInicio: "2024-01-15", vigenciaFin: "2025-01-14", estado: "Activo" },
  { id: "CTO-2024-0041", tipo: "Contrato", proveedor: "LogiFleet LATAM", categoria: "Logística", monto: 320000, vigenciaInicio: "2024-02-01", vigenciaFin: "2025-01-31", estado: "Activo" },
  { id: "CTO-2024-0040", tipo: "PO", proveedor: "CleanPro Services", categoria: "Servicios Generales", monto: 64000, vigenciaInicio: "2024-07-15", vigenciaFin: "2024-10-15", estado: "Activo" },
  { id: "CTO-2024-0039", tipo: "Contrato", proveedor: "AuditTrust Asociados", categoria: "Servicios Generales", monto: 58000, vigenciaInicio: "2024-01-01", vigenciaFin: "2024-08-25", estado: "Por vencer" },
  { id: "CTO-2024-0038", tipo: "Contrato", proveedor: "SoftDesign Studio", categoria: "TI", monto: 38000, vigenciaInicio: "2024-03-01", vigenciaFin: "2024-09-01", estado: "Por vencer" },
  { id: "CTO-2024-0037", tipo: "Addendum", proveedor: "EcoPack Industrial", categoria: "Materia Prima", monto: 28000, vigenciaInicio: "2024-04-10", vigenciaFin: "2024-10-10", estado: "Por vencer" },
  { id: "CTO-2024-0036", tipo: "PO", proveedor: "GlobalChem Supplies", categoria: "Materia Prima", monto: 92000, vigenciaInicio: "2024-05-01", vigenciaFin: "2024-11-01", estado: "Activo" },
  { id: "CTO-2024-0035", tipo: "Contrato", proveedor: "NovaTech Consulting", categoria: "TI", monto: 145000, vigenciaInicio: "2023-12-01", vigenciaFin: "2024-07-31", estado: "Vencido" },
  { id: "CTO-2024-0046", tipo: "Contrato", proveedor: "NovaTech Consulting", categoria: "TI", monto: 210000, vigenciaInicio: "2024-06-25", vigenciaFin: "2025-06-24", estado: "Activo", companyId: "techcorp" },
  { id: "CTO-2024-0047", tipo: "Contrato", proveedor: "SoftDesign Studio", categoria: "TI", monto: 96000, vigenciaInicio: "2023-09-01", vigenciaFin: "2024-08-31", estado: "Por vencer", companyId: "techcorp" },
];

export interface Aprobacion {
  id: string;
  tipo: "Salida a licitación" | "Adjudicación" | "Excepción de presupuesto";
  descripcion: string;
  solicitante: string;
  monto: number;
  fecha: string;
  urgente: boolean;
}

export const aprobaciones: Aprobacion[] = [
  { id: "AP-001", tipo: "Adjudicación", descripcion: "Adjudicar RFP-2024-0030 a CleanPro Services", solicitante: "Carlos Méndez", monto: 64000, fecha: "2024-08-05", urgente: true },
  { id: "AP-002", tipo: "Salida a licitación", descripcion: "Aprobar salida a licitación RFP-2024-0032", solicitante: "Carlos Méndez", monto: 185000, fecha: "2024-08-04", urgente: true },
  { id: "AP-003", tipo: "Excepción de presupuesto", descripcion: "Exceder presupuesto en RFP-2024-0028 (15% sobre)", solicitante: "Laura Torres", monto: 89700, fecha: "2024-08-03", urgente: false },
];

export interface Disputa {
  id: string;
  poReferencia: string;
  proveedor: string;
  severidad: "Baja" | "Media" | "Alta";
  estado: "Abierta" | "En mediación" | "Resuelta";
  diasAbierta: number;
  mediador: string;
}

export const disputas: Disputa[] = [
  { id: "DIS-001", poReferencia: "PO-2024-0036", proveedor: "GlobalChem Supplies", severidad: "Media", estado: "En mediación", diasAbierta: 5, mediador: "Ana Consultora" },
  { id: "DIS-002", poReferencia: "PO-2024-0034", proveedor: "PrimeBuild Constructora", severidad: "Alta", estado: "Abierta", diasAbierta: 2, mediador: "Sin asignar" },
  { id: "DIS-003", poReferencia: "PO-2024-0030", proveedor: "CleanPro Services", severidad: "Baja", estado: "Resuelta", diasAbierta: 12, mediador: "Ana Consultora" },
];

export const ahorroMensual = [
  { mes: "Mar", reportado: 98000, auditado: 82000 },
  { mes: "Abr", reportado: 112000, auditado: 95000 },
  { mes: "May", reportado: 134000, auditado: 118000 },
  { mes: "Jun", reportado: 145000, auditado: 127000 },
  { mes: "Jul", reportado: 158000, auditado: 139000 },
  { mes: "Ago", reportado: 167000, auditado: 148000 },
];

export const tiempoCicloCategoria = [
  { categoria: "TI", dias: 22 },
  { categoria: "Logística", dias: 18 },
  { categoria: "Materia Prima", dias: 14 },
  { categoria: "Servicios", dias: 12 },
  { categoria: "Marketing", dias: 16 },
  { categoria: "RR.HH.", dias: 20 },
];

export const concentracionGasto = [
  { name: "TI", value: 38, color: "var(--chart-1)" },
  { name: "Logística", value: 27, color: "var(--chart-2)" },
  { name: "Materia Prima", value: 18, color: "var(--chart-3)" },
  { name: "Servicios", value: 12, color: "var(--chart-4)" },
  { name: "Otros", value: 5, color: "var(--chart-5)" },
];

export const topProveedoresGasto = [
  { proveedor: "LogiFleet", gasto: 320000 },
  { proveedor: "CloudSphere", gasto: 185000 },
  { proveedor: "NovaTech", gasto: 145000 },
  { proveedor: "GlobalChem", gasto: 92000 },
  { proveedor: "CleanPro", gasto: 64000 },
];

export const actividadReciente = [
  { id: 1, tipo: "oferta", texto: "CloudSphere envió su oferta para RFP-2024-0032", tiempo: "Hace 15 min" },
  { id: 2, tipo: "aprobacion", texto: "Aprobación requerida para adjudicación RFP-2024-0030", tiempo: "Hace 1 h" },
  { id: 3, tipo: "contrato", texto: "Contrato CTO-2024-0039 vence en 20 días", tiempo: "Hace 3 h" },
  { id: 4, tipo: "negociacion", texto: "Ronda de negociación cerrada en RFP-2024-0031", tiempo: "Hace 5 h" },
  { id: 5, tipo: "proveedor", texto: "NovaTech Consulting completó homologación", tiempo: "Ayer" },
];

export const ofertasComparativo = [
  { proveedor: "CloudSphere", precio: 172000, plazo: 45, calidad: 92, pago: 30, score: 88 },
  { proveedor: "NovaTech", precio: 168000, plazo: 38, calidad: 95, pago: 45, score: 92 },
  { proveedor: "SoftDesign", precio: 155000, plazo: 52, calidad: 78, pago: 30, score: 79 },
  { proveedor: "AuditTrust", precio: 195000, plazo: 30, calidad: 96, pago: 60, score: 85 },
];

export const notificaciones = [
  { id: 1, tipo: "aprobacion", titulo: "Aprobación pendiente", desc: "RFP-2024-0030 requiere tu firma", tiempo: "Hace 15 min", leida: false },
  { id: 2, tipo: "oferta", titulo: "Nueva oferta recibida", desc: "CloudSphere cotizó en RFP-2024-0032", tiempo: "Hace 1 h", leida: false },
  { id: 3, tipo: "contrato", titulo: "Contrato por vencer", desc: "CTO-2024-0039 vence en 20 días", tiempo: "Hace 3 h", leida: false },
  { id: 4, tipo: "negociacion", titulo: "Ronda de negociación cerrada", desc: "RFP-2024-0031 — ahorro +$15,200", tiempo: "Hace 5 h", leida: true },
];

export const casosConsultor = [
  { id: "C-001", cliente: "Acme S.A.", tipo: "Revisión RFP", prioridad: "Alta", sla: "2 h restantes", estado: "En progreso" },
  { id: "C-002", cliente: "TechCorp", tipo: "Negociación", prioridad: "Media", sla: "1 día", estado: "Pendiente" },
  { id: "C-003", cliente: "RetailCo", tipo: "Disputa", prioridad: "Alta", sla: "Vencido", estado: "Escalado" },
  { id: "C-004", cliente: "Industries Ltd", tipo: "Onboarding", prioridad: "Baja", sla: "3 días", estado: "En progreso" },
  { id: "C-005", cliente: "Acme S.A.", tipo: "Auditoría ahorro", prioridad: "Media", sla: "4 h restantes", estado: "Pendiente" },
];

export const colaHomologacion = [
  { id: "H-001", proveedor: "PrimeBuild Constructora", score: 62, estado: "Zona gris", documentos: 8, alertas: 2 },
  { id: "H-002", proveedor: "TalentHub Solutions", score: 71, estado: "Zona gris", documentos: 6, alertas: 1 },
  { id: "H-003", proveedor: "DigitalWave Marketing", score: 68, estado: "Zona gris", documentos: 7, alertas: 1 },
];
