import { z } from "zod";
import { api, parseApiResponse } from "@/lib/api/http";
import type { Aprobacion } from "@/lib/types";
import { monedaSchema } from "@/lib/moneda";

const apiAprobacionSchema = z.object({
  id: z.string(),
  tipo: z.enum(["SALIDA_LICITACION", "ADJUDICACION", "EXCEPCION_PRESUPUESTO"]),
  monto: z.number(),
  urgente: z.boolean(),
  createdAt: z.string(),
  tipoRegla: z.enum(["UNICA", "SECUENCIAL"]),
  pasoActual: z.number(),
  rolesRequeridos: z.array(z.string()),
  requerimiento: z.object({
    titulo: z.string(),
    moneda: monedaSchema,
    solicitante: z.object({ nombre: z.string() }).optional(),
  }),
});
type ApiAprobacion = z.infer<typeof apiAprobacionSchema>;

const TIPO_LABEL: Record<ApiAprobacion["tipo"], Aprobacion["tipo"]> = {
  SALIDA_LICITACION: "Salida a licitación",
  ADJUDICACION: "Adjudicación",
  EXCEPCION_PRESUPUESTO: "Excepción de presupuesto",
};

const DESCRIPCION_PREFIX: Record<ApiAprobacion["tipo"], string> = {
  SALIDA_LICITACION: "Aprobar salida a licitación",
  ADJUDICACION: "Aprobar adjudicación de",
  EXCEPCION_PRESUPUESTO: "Aprobar excepción de presupuesto en",
};

function toAprobacion(a: ApiAprobacion): Aprobacion {
  return {
    id: a.id,
    tipo: TIPO_LABEL[a.tipo],
    descripcion: `${DESCRIPCION_PREFIX[a.tipo]} ${a.requerimiento.titulo}`,
    solicitante: a.requerimiento.solicitante?.nombre ?? "",
    monto: a.monto,
    moneda: a.requerimiento.moneda,
    fecha: a.createdAt.slice(0, 10),
    urgente: a.urgente,
    pasoActual: a.tipoRegla === "SECUENCIAL" ? a.pasoActual + 1 : undefined,
    totalPasos: a.tipoRegla === "SECUENCIAL" ? a.rolesRequeridos.length : undefined,
  };
}

export async function fetchAprobaciones(): Promise<Aprobacion[]> {
  const { data } = await api.get<unknown>("/aprobaciones");
  return parseApiResponse(z.array(apiAprobacionSchema), data, "aprobaciones").map(toAprobacion);
}

export async function aprobarSolicitud(id: string) {
  const { data } = await api.post(`/aprobaciones/${id}/aprobar`);
  return data;
}

export async function rechazarSolicitud(id: string, motivo: string) {
  const { data } = await api.post(`/aprobaciones/${id}/rechazar`, { motivo });
  return data;
}
