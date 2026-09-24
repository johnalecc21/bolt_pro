import { api } from "@/lib/api/http";
import type { Moneda } from "@/lib/moneda";
import { fechaLocal } from "@/lib/fecha";

export type EstadoInvitacion = "nueva" | "vista" | "respondida" | "vencida" | "declinada";

export interface Invitacion {
  id: string;
  requerimientoId: string;
  titulo: string;
  categoria: string;
  cliente: string;
  /** Local calendar date, for display. */
  fechaLimite: string;
  /** Exact closing timestamp (ISO). */
  cierre: string;
  estado: EstadoInvitacion;
  moneda: Moneda;
}

interface ApiInvitacion {
  id: string;
  requerimientoId: string;
  categoria: string;
  fechaLimite: string;
  estado: "NUEVA" | "VISTA" | "RESPONDIDA" | "VENCIDA" | "DECLINADA";
  company: { nombre: string };
  requerimiento?: { titulo: string; moneda: Moneda } | null;
}

function toInvitacion(i: ApiInvitacion): Invitacion {
  return {
    id: i.id,
    requerimientoId: i.requerimientoId,
    titulo: i.requerimiento?.titulo ?? "",
    categoria: i.categoria,
    cliente: i.company.nombre,
    fechaLimite: fechaLocal(i.fechaLimite),
    cierre: i.fechaLimite,
    estado: i.estado.toLowerCase() as EstadoInvitacion,
    moneda: i.requerimiento?.moneda ?? "USD",
  };
}

export async function fetchInvitaciones(): Promise<Invitacion[]> {
  const { data } = await api.get<ApiInvitacion[]>("/invitaciones");
  return data.map(toInvitacion);
}

export async function aceptarInvitacion(id: string) {
  const { data } = await api.post(`/invitaciones/${id}/aceptar`);
  return data;
}

export async function declinarInvitacion(id: string) {
  const { data } = await api.post(`/invitaciones/${id}/declinar`);
  return data;
}
