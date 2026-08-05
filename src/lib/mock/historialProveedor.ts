export interface ProcesoHistorico {
  id: string;
  titulo: string;
  cliente: string;
  resultado: "ganado" | "perdido";
  fecha: string;
  monto: number;
  feedback?: string;
  diferenciaPct?: number;
}

export const historialProcesos: ProcesoHistorico[] = [
  { id: "RFP-2024-0025", titulo: "Licencias software de diseño", cliente: "Acme S.A.", resultado: "ganado", fecha: "2024-06-15", monto: 38000 },
  { id: "RFP-2024-0019", titulo: "Infraestructura cloud Q1", cliente: "RetailCo", resultado: "ganado", fecha: "2024-03-10", monto: 142000 },
  { id: "RFP-2024-0012", titulo: "Migración de datos", cliente: "Industries Ltd", resultado: "perdido", fecha: "2024-01-22", monto: 95000, feedback: "Perdiste por precio — tu oferta estaba 8% sobre el ganador.", diferenciaPct: 8 },
  { id: "RFP-2023-0087", titulo: "Consultoría de seguridad", cliente: "TechCorp", resultado: "perdido", fecha: "2023-11-05", monto: 67000, feedback: "Perdiste por plazo de entrega — el ganador ofreció 15 días menos.", diferenciaPct: 0 },
];

export const competitividad = {
  tuOfertaPromedioVsMercado: -3,
  percentilPrecio: 62,
  percentilPlazo: 78,
};
