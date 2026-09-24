import { z } from "zod";
import { api, parseApiResponse } from "@/lib/api/http";
import type { Moneda } from "@/lib/moneda";

export interface LineaAdjudicada {
  itemId: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** One proveedor's award: an itemized process split by lines has several. */
export interface Adjudicacion {
  id: string;
  proveedorId: string;
  proveedor: string;
  precioFinal: number;
  plazoDias: number;
  condicionesPagoDias: number;
  garantiaMeses: number;
  poId: string;
  confirmada: boolean;
  revisionLegal: boolean;
  /** Decided server-side from the amount and the requerimiento's currency. */
  requiereRevisionLegal: boolean;
  yaFirmado: boolean;
  lineas: LineaAdjudicada[];
}

export interface AdjudicacionProceso {
  moneda: Moneda;
  umbralRevisionLegal: number;
  total: number;
  adjudicaciones: Adjudicacion[];
  /** Lines nobody was awarded (declared void). */
  itemsDesiertos: { id: string; descripcion: string; cantidad: number; unidad: string }[];
  confirmada: boolean;
  firmada: boolean;
}

const itemSchema = z.object({ id: z.string(), descripcion: z.string(), cantidad: z.number(), unidad: z.string() });

const apiSchema = z.object({
  moneda: z.string(),
  umbralRevisionLegal: z.number(),
  total: z.number(),
  itemsDesiertos: z.array(itemSchema),
  adjudicaciones: z.array(
    z.object({
      id: z.string(),
      proveedorId: z.string(),
      proveedor: z.object({ nombre: z.string() }),
      precioFinal: z.number(),
      plazoDias: z.number(),
      condicionesPagoDias: z.number(),
      garantiaMeses: z.number(),
      poId: z.string(),
      confirmada: z.boolean(),
      revisionLegal: z.boolean(),
      firmado: z.boolean(),
      requiereRevisionLegal: z.boolean(),
      lineas: z.array(
        z.object({
          itemId: z.string(),
          cantidad: z.number(),
          precioUnitario: z.number(),
          subtotal: z.number(),
          item: itemSchema,
        }),
      ),
    }),
  ),
});

const firmarResponseSchema = z.object({ ok: z.boolean(), poId: z.string(), completo: z.boolean() });

export async function fetchAdjudicacion(requerimientoId: string): Promise<AdjudicacionProceso | null> {
  const { data: raw } = await api.get<unknown>(`/adjudicacion/${requerimientoId}`);
  if (!raw) return null;
  const data = parseApiResponse(apiSchema, raw, "adjudicación");
  const adjudicaciones: Adjudicacion[] = data.adjudicaciones.map((a) => ({
    id: a.id,
    proveedorId: a.proveedorId,
    proveedor: a.proveedor.nombre,
    precioFinal: a.precioFinal,
    plazoDias: a.plazoDias,
    condicionesPagoDias: a.condicionesPagoDias,
    garantiaMeses: a.garantiaMeses,
    poId: a.poId,
    confirmada: a.confirmada,
    revisionLegal: a.revisionLegal,
    requiereRevisionLegal: a.requiereRevisionLegal,
    yaFirmado: a.firmado,
    lineas: a.lineas.map((l) => ({
      itemId: l.itemId,
      descripcion: l.item.descripcion,
      unidad: l.item.unidad,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      subtotal: l.subtotal,
    })),
  }));
  return {
    moneda: data.moneda as Moneda,
    umbralRevisionLegal: data.umbralRevisionLegal,
    total: data.total,
    itemsDesiertos: data.itemsDesiertos,
    adjudicaciones,
    confirmada: adjudicaciones.every((a) => a.confirmada),
    firmada: adjudicaciones.every((a) => a.yaFirmado),
  };
}

/**
 * Whole process to one proveedor, or line by line (`asignaciones`) to several.
 * Price and terms are set by the server from the offers (or final negotiated bids).
 */
export async function crearAdjudicacion(
  payload: { requerimientoId: string; proveedorId: string } | { requerimientoId: string; asignaciones: { itemId: string; proveedorId: string }[] },
) {
  const { data } = await api.post("/adjudicacion", payload);
  return data;
}

export async function confirmarAdjudicacion(requerimientoId: string) {
  const { data } = await api.post(`/adjudicacion/${requerimientoId}/confirmar`);
  return data;
}

export async function revisionLegalAdjudicacion(requerimientoId: string, adjudicacionId: string) {
  const { data } = await api.post(`/adjudicacion/${requerimientoId}/revision-legal`, { adjudicacionId });
  return data;
}

export async function firmarAdjudicacion(
  requerimientoId: string,
  adjudicacionId: string,
  notificarPerdedores: boolean,
): Promise<{ ok: boolean; poId: string; completo: boolean }> {
  const { data } = await api.post<unknown>(`/adjudicacion/${requerimientoId}/firmar`, { adjudicacionId, notificarPerdedores });
  return parseApiResponse(firmarResponseSchema, data, "firmar adjudicación");
}
