export interface OfertaProceso {
  proveedorId: string;
  proveedor: string;
  precio: number;
  plazo: number;
  calidad: number;
  pago: number;
}

export interface Adjudicacion {
  proveedorId: string;
  proveedor: string;
  proveedorScore: number;
  proveedorUbicacion: string;
  precioFinal: number;
  plazoDias: number;
  condicionesPagoDias: number;
  garantiaMeses: number;
  poId: string;
  yaFirmado: boolean;
}

export interface ProcesoRequerimiento {
  id: string;
  titulo: string;
  cliente: string;
  presupuestoInicial: number;
  ofertas: OfertaProceso[];
  benchmark: number;
  notaConsultor: string;
  adjudicacion?: Adjudicacion;
}

export const procesos: Record<string, ProcesoRequerimiento> = {
  "RFP-2024-0032": {
    id: "RFP-2024-0032",
    titulo: "Servicios de nube y migración AWS",
    cliente: "Acme S.A.",
    presupuestoInicial: 185000,
    benchmark: 172000,
    notaConsultor: "NovaTech ofrece el mejor balance precio-calidad. Su score de homologación (92) y 96% de entregas a tiempo refuerzan la recomendación.",
    ofertas: [
      { proveedorId: "P-001", proveedor: "CloudSphere Technologies", precio: 172000, plazo: 45, calidad: 92, pago: 30 },
      { proveedorId: "P-010", proveedor: "NovaTech Consulting", precio: 168000, plazo: 38, calidad: 95, pago: 45 },
      { proveedorId: "P-008", proveedor: "SoftDesign Studio", precio: 155000, plazo: 52, calidad: 78, pago: 30 },
      { proveedorId: "P-007", proveedor: "AuditTrust Asociados", precio: 195000, plazo: 30, calidad: 96, pago: 60 },
    ],
    adjudicacion: {
      proveedorId: "P-010", proveedor: "NovaTech Consulting", proveedorScore: 92, proveedorUbicacion: "Montevideo, UY",
      precioFinal: 162000, plazoDias: 38, condicionesPagoDias: 45, garantiaMeses: 12,
      poId: "PO-2024-0033", yaFirmado: false,
    },
  },
  "RFP-2024-0031": {
    id: "RFP-2024-0031",
    titulo: "Insumos de embalaje industrial",
    cliente: "Acme S.A.",
    presupuestoInicial: 92000,
    benchmark: 89000,
    notaConsultor: "EcoPack Industrial mantiene el mejor precio con certificaciones ambientales completas — ideal para el compromiso ESG del cliente.",
    ofertas: [
      { proveedorId: "P-002", proveedor: "EcoPack Industrial", precio: 84000, plazo: 20, calidad: 88, pago: 30 },
      { proveedorId: "P-009", proveedor: "GlobalChem Supplies", precio: 91000, plazo: 15, calidad: 87, pago: 45 },
    ],
    adjudicacion: {
      proveedorId: "P-002", proveedor: "EcoPack Industrial", proveedorScore: 88, proveedorUbicacion: "Medellín, CO",
      precioFinal: 82000, plazoDias: 20, condicionesPagoDias: 30, garantiaMeses: 6,
      poId: "PO-2024-0034", yaFirmado: false,
    },
  },
  "RFP-2024-0030": {
    id: "RFP-2024-0030",
    titulo: "Servicios de limpieza corporativa",
    cliente: "Acme S.A.",
    presupuestoInicial: 70000,
    benchmark: 68000,
    notaConsultor: "CleanPro Services fue adjudicado por su relación costo-cobertura y buen historial de cumplimiento en la red.",
    ofertas: [
      { proveedorId: "P-003", proveedor: "CleanPro Services", precio: 64000, plazo: 15, calidad: 81, pago: 30 },
      { proveedorId: "P-011", proveedor: "PrimeBuild Constructora", precio: 69000, plazo: 20, calidad: 78, pago: 45 },
      { proveedorId: "P-007", proveedor: "AuditTrust Asociados", precio: 71000, plazo: 10, calidad: 96, pago: 60 },
    ],
    adjudicacion: {
      proveedorId: "P-003", proveedor: "CleanPro Services", proveedorScore: 81, proveedorUbicacion: "Cali, CO",
      precioFinal: 64000, plazoDias: 15, condicionesPagoDias: 30, garantiaMeses: 12,
      poId: "PO-2024-0040", yaFirmado: true,
    },
  },
};

export function getProceso(id: string | undefined): ProcesoRequerimiento | undefined {
  if (!id) return undefined;
  return procesos[id];
}
