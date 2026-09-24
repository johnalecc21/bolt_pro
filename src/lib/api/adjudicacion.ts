import { z } from "zod";
import { api, parseApiResponse } from "@/lib/api/http";
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
  /** Decided server-side from the amount and the requerimiento's currency. */
  requiereRevisionLegal: boolean;
  umbralRevisionLegal: number;
  yaFirmado: boolean;
}

const apiAdjudicacionSchema = z.object({
  proveedorId: z.string(),
  precioFinal: z.number(),
  plazoDias: z.number(),
  condicionesPagoDias: z.number(),
  garantiaMeses: z.number(),
  poId: z.string(),
  confirmada: z.boolean(),
  revisionLegal: z.boolean(),
  firmado: z.boolean(),
  requiereRevisionLegal: z.boolean(),
  umbralRevisionLegal: z.number(),
});

const firmarResponseSchema = z.object({ ok: z.boolean(), poId: z.string() });

export async function fetchAdjudicacion(requerimientoId: string): Promise<Adjudicacion | null> {
  const { data: raw } = await api.get<unknown>(`/adjudicacion/${requerimientoId}`);
  if (!raw) return null;
  const data = parseApiResponse(apiAdjudicacionSchema, raw, "adjudicación");
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
    requiereRevisionLegal: data.requiereRevisionLegal,
    umbralRevisionLegal: data.umbralRevisionLegal,
    yaFirmado: data.firmado,
  };
}

/** Price and terms are set by the server from the offer (or the final negotiated bid). */
export async function crearAdjudicacion(payload: { requerimientoId: string; proveedorId: string }) {
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

export async function firmarAdjudicacion(requerimientoId: string, notificarPerdedores: boolean): Promise<{ ok: boolean; poId: string }> {
  const { data } = await api.post<unknown>(`/adjudicacion/${requerimientoId}/firmar`, { notificarPerdedores });
  return parseApiResponse(firmarResponseSchema, data, "firmar adjudicación");
}
