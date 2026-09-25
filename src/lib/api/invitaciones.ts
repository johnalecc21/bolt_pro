import { api } from "@/lib/api/http";
import type { Moneda } from "@/lib/moneda";
import { fechaLocal } from "@/lib/fecha";

export type EstadoInvitacion = "nueva" | "vista" | "respondida" | "vencida" | "declinada";

export interface Invitacion {
  id: string;
  requerimientoId: string;
  /** Human code (REQ-0012); never show the internal id. */
  codigo: string;
  titulo: string;
  categoria: string;
  cliente: string;
  /** Local calendar date, for display. */
  fechaLimite: string;
  /** Exact closing timestamp (ISO). */
  cierre: string;
  estado: EstadoInvitacion;
  moneda: Moneda;
  /** Number of lines in the bill of quantities (0 = lump sum). */
  items: number;
  /** When the invitation arrived. */
  recibida: string;
}

interface ApiInvitacion {
  id: string;
  requerimientoId: string;
  codigo: string | null;
  categoria: string;
  fechaLimite: string;
  createdAt: string;
  estado: "NUEVA" | "VISTA" | "RESPONDIDA" | "VENCIDA" | "DECLINADA";
  company: { nombre: string };
  requerimiento?: { titulo: string; moneda: Moneda; _count?: { items: number } } | null;
}

function toInvitacion(i: ApiInvitacion): Invitacion {
  return {
    id: i.id,
    requerimientoId: i.requerimientoId,
    codigo: i.codigo ?? "Proceso",
    titulo: i.requerimiento?.titulo ?? "",
    categoria: i.categoria,
    cliente: i.company.nombre,
    fechaLimite: fechaLocal(i.fechaLimite),
    cierre: i.fechaLimite,
    estado: i.estado.toLowerCase() as EstadoInvitacion,
    moneda: i.requerimiento?.moneda ?? "USD",
    items: i.requerimiento?._count?.items ?? 0,
    recibida: i.createdAt,
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

/** The full requerimiento as an invited supplier sees it (no budget). */
export interface RequerimientoInvitado {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  prioridad: "NORMAL" | "ALTA" | "URGENTE";
  moneda: Moneda;
  cliente: string;
  publicado: string;
  fechaLimite: string;
  especificaciones: { name: string; value: string }[];
  criterios: Record<string, number> | null;
  items: { id: string; orden: number; descripcion: string; cantidad: number; unidad: string; especificacion: string | null }[];
  documentos: { id: string; nombre: string }[];
  invitacion: { id: string; estado: "NUEVA" | "VISTA" | "RESPONDIDA" | "VENCIDA" | "DECLINADA" };
}

export async function fetchRequerimientoInvitado(requerimientoId: string): Promise<RequerimientoInvitado> {
  const { data } = await api.get<RequerimientoInvitado>(`/invitaciones/requerimiento/${requerimientoId}`);
  return data;
}

export async function urlDocumentoInvitado(requerimientoId: string, docId: string): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/invitaciones/requerimiento/${requerimientoId}/documentos/${docId}`);
  return data.url;
}
