export interface ClientePlan {
  id: string;
  nombre: string;
  plan: "Starter" | "Growth" | "Enterprise";
  facturacion: "Al día" | "Pendiente" | "Vencida";
  procesosActivos: number;
  adopcion: number;
  contactoPrincipal: string;
}

export const clientesPlanes: ClientePlan[] = [
  { id: "CL-001", nombre: "Acme S.A.", plan: "Growth", facturacion: "Al día", procesosActivos: 8, adopcion: 82, contactoPrincipal: "Roberto Silva" },
  { id: "CL-002", nombre: "TechCorp", plan: "Enterprise", facturacion: "Al día", procesosActivos: 15, adopcion: 91, contactoPrincipal: "María Gómez" },
  { id: "CL-003", nombre: "RetailCo", plan: "Starter", facturacion: "Pendiente", procesosActivos: 3, adopcion: 45, contactoPrincipal: "Jorge Pineda" },
  { id: "CL-004", nombre: "Industries Ltd", plan: "Growth", facturacion: "Vencida", procesosActivos: 5, adopcion: 38, contactoPrincipal: "Elena Vidal" },
];
