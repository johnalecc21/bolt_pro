import { api } from "@/lib/api/http";
import type { Disputa } from "@/lib/mockData";

interface ApiDisputa {
  id: string;
  poReferencia: string;
  severidad: "BAJA" | "MEDIA" | "ALTA";
  estado: "ABIERTA" | "EN_MEDIACION" | "RESUELTA";
  createdAt: string;
  proveedor?: { nombre: string } | null;
  mediador?: { nombre: string } | null;
  mensajes?: { id: string; autor: string; texto: string; createdAt: string }[];
  company?: { nombre: string };
}

const SEVERIDAD_LABEL: Record<ApiDisputa["severidad"], Disputa["severidad"]> = {
  BAJA: "Baja", MEDIA: "Media", ALTA: "Alta",
};

const ESTADO_LABEL: Record<ApiDisputa["estado"], Disputa["estado"]> = {
  ABIERTA: "Abierta", EN_MEDIACION: "En mediación", RESUELTA: "Resuelta",
};

function toDisputa(d: ApiDisputa): Disputa {
  const diasAbierta = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000);
  return {
    id: d.id,
    poReferencia: d.poReferencia,
    proveedor: d.proveedor?.nombre ?? "Por confirmar",
    severidad: SEVERIDAD_LABEL[d.severidad],
    estado: ESTADO_LABEL[d.estado],
    diasAbierta,
    mediador: d.mediador?.nombre ?? "Sin asignar",
  };
}

export interface DisputaDetalle extends Disputa {
  mensajes: { id: string; autor: string; texto: string }[];
}

export async function fetchDisputas(): Promise<Disputa[]> {
  const { data } = await api.get<ApiDisputa[]>("/disputas");
  return data.map(toDisputa);
}

export async function fetchDisputa(id: string): Promise<DisputaDetalle> {
  const { data } = await api.get<ApiDisputa>(`/disputas/${id}`);
  return { ...toDisputa(data), mensajes: (data.mensajes ?? []).map((m) => ({ id: m.id, autor: m.autor, texto: m.texto })) };
}

export async function crearDisputa(payload: { poReferencia: string; severidad: "BAJA" | "MEDIA" | "ALTA"; descripcion: string }): Promise<Disputa> {
  const { data } = await api.post<ApiDisputa>("/disputas", payload);
  return toDisputa(data);
}

export async function enviarMensajeDisputa(id: string, texto: string) {
  const { data } = await api.post(`/disputas/${id}/mensajes`, { texto });
  return data;
}

export interface DisputaInterno extends Disputa {
  empresa: string;
}

export async function fetchDisputasInterno(): Promise<DisputaInterno[]> {
  const { data } = await api.get<ApiDisputa[]>("/disputas/interno/todas");
  return data.map((d) => ({ ...toDisputa(d), empresa: d.company?.nombre ?? "" }));
}

export async function asignarMediador(id: string) {
  const { data } = await api.post(`/disputas/${id}/asignar`);
  return data;
}

export async function resolverDisputa(id: string, decision: string, impacto: "positivo" | "negativo") {
  const { data } = await api.post(`/disputas/${id}/resolver`, { decision, impacto });
  return data;
}
