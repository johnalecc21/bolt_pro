import { api } from "@/lib/api/http";

export interface Pregunta {
  id: string;
  pregunta: string;
  respuesta: string | null;
  createdAt: string;
  respondidoAt: string | null;
  proveedor?: { nombre: string };
}

export async function fetchPreguntas(requerimientoId: string): Promise<Pregunta[]> {
  const { data } = await api.get<Pregunta[]>(`/preguntas/${requerimientoId}`);
  return data;
}

export async function preguntar(requerimientoId: string, pregunta: string): Promise<Pregunta> {
  const { data } = await api.post<Pregunta>(`/preguntas/${requerimientoId}`, { pregunta });
  return data;
}

export async function responderPregunta(id: string, respuesta: string): Promise<Pregunta> {
  const { data } = await api.post<Pregunta>(`/preguntas/${id}/responder`, { respuesta });
  return data;
}
