import { api } from "@/lib/api/http";
import { fetchProveedor } from "@/lib/api/proveedores";

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
  confirmada: boolean;
  revisionLegal: boolean;
  yaFirmado: boolean;
}

interface ApiAdjudicacion {
  proveedorId: string;
  precioFinal: number;
  plazoDias: number;
  condicionesPagoDias: number;
  garantiaMeses: number;
  poId: string;
  confirmada: boolean;
  revisionLegal: boolean;
  firmado: boolean;
}

export async function fetchAdjudicacion(requerimientoId: string): Promise<Adjudicacion | null> {
  const { data } = await api.get<ApiAdjudicacion | null>(`/adjudicacion/${requerimientoId}`);
  if (!data) return null;
  const proveedor = await fetchProveedor(data.proveedorId);
  return {
    proveedorId: data.proveedorId,
    proveedor: proveedor.nombre,
    proveedorScore: proveedor.score,
    proveedorUbicacion: proveedor.ubicacion,
    precioFinal: data.precioFinal,
    plazoDias: data.plazoDias,
    condicionesPagoDias: data.condicionesPagoDias,
    garantiaMeses: data.garantiaMeses,
    poId: data.poId,
    confirmada: data.confirmada,
    revisionLegal: data.revisionLegal,
    yaFirmado: data.firmado,
  };
}

export async function crearAdjudicacion(payload: {
  requerimientoId: string;
  proveedorId: string;
  precioFinal: number;
  plazoDias: number;
  condicionesPagoDias: number;
  garantiaMeses: number;
}) {
  const { data } = await api.post("/adjudicacion", payload);
  return data;
}

export async function confirmarAdjudicacion(requerimientoId: string) {
  const { data } = await api.post(`/adjudicacion/${requerimientoId}/confirmar`);
  return data;
}

export async function revisionLegalAdjudicacion(requerimientoId: string) {
  const { data } = await api.post(`/adjudicacion/${requerimientoId}/revision-legal`);
  return data;
}

export async function firmarAdjudicacion(requerimientoId: string): Promise<{ ok: boolean; poId: string }> {
  const { data } = await api.post(`/adjudicacion/${requerimientoId}/firmar`);
  return data;
}
