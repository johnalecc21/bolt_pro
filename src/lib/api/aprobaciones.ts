import { api } from "@/lib/api/http";
import type { Aprobacion } from "@/lib/types";
import type { Moneda } from "@/lib/moneda";

interface ApiAprobacion {
  id: string;
  tipo: "SALIDA_LICITACION" | "ADJUDICACION" | "EXCEPCION_PRESUPUESTO";
  monto: number;
  urgente: boolean;
  createdAt: string;
  tipoRegla: "UNICA" | "SECUENCIAL";
  pasoActual: number;
  rolesRequeridos: string[];
  requerimiento: { titulo: string; moneda: Moneda; solicitante?: { nombre: string } };
}

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
  const { data } = await api.get<ApiAprobacion[]>("/aprobaciones");
  return data.map(toAprobacion);
}

export async function aprobarSolicitud(id: string) {
  const { data } = await api.post(`/aprobaciones/${id}/aprobar`);
  return data;
}

export async function rechazarSolicitud(id: string, motivo: string) {
  const { data } = await api.post(`/aprobaciones/${id}/rechazar`, { motivo });
  return data;
}
