export interface PagoPO {
  id: string;
  cliente: string;
  monto: number;
  fechaEmision: string;
  fechaPagoPactada: string;
  estado: "pendiente" | "pagado" | "vencido";
  disputaAbierta: boolean;
}

export const pagosPOs: PagoPO[] = [
  { id: "PO-2024-0025", cliente: "Acme S.A.", monto: 38000, fechaEmision: "2024-06-16", fechaPagoPactada: "2024-08-15", estado: "pendiente", disputaAbierta: false },
  { id: "PO-2024-0019", cliente: "RetailCo", monto: 142000, fechaEmision: "2024-03-11", fechaPagoPactada: "2024-05-11", estado: "pagado", disputaAbierta: false },
  { id: "PO-2024-0036", cliente: "GlobalChem (subcontrato)", monto: 12000, fechaEmision: "2024-05-02", fechaPagoPactada: "2024-07-02", estado: "vencido", disputaAbierta: true },
];
