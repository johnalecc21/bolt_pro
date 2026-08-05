export interface Invitacion {
  id: string;
  requerimientoId: string;
  cliente: string;
  categoria: string;
  fechaLimite: string;
  estado: "nueva" | "vista" | "respondida" | "vencida" | "declinada";
}

export const invitacionesIniciales: Invitacion[] = [
  { id: "INV-001", requerimientoId: "RFP-2024-0032", cliente: "Acme S.A.", categoria: "TI · Cloud", fechaLimite: "2024-08-12", estado: "respondida" },
  { id: "INV-002", requerimientoId: "RFP-2024-0040", cliente: "Cliente anonimizado", categoria: "TI · Software", fechaLimite: "2024-08-22", estado: "nueva" },
  { id: "INV-003", requerimientoId: "RFP-2024-0038", cliente: "TechCorp", categoria: "TI · Consultoría", fechaLimite: "2024-08-18", estado: "vista" },
  { id: "INV-004", requerimientoId: "RFP-2024-0021", cliente: "Cliente anonimizado", categoria: "TI · Cloud", fechaLimite: "2024-07-10", estado: "vencida" },
];
