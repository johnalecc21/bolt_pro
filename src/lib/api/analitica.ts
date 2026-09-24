import { api } from "@/lib/api/http";
import type { DatosCfo } from "@/lib/analitica/tipos";
import type { Dimension, Metrica } from "@/lib/analitica/agregador";

/** Row-level dataset for [desde, hasta] (YYYY-MM-DD, inclusive) plus the previous period of equal length. */
export async function fetchDatosCfo(desde: string, hasta: string): Promise<DatosCfo> {
  const { data } = await api.get<DatosCfo>("/analitica/cfo", { params: { desde, hasta } });
  return data;
}

export type TipoGrafica = "barras" | "barrasHorizontales" | "lineas" | "area";

export interface GraficaGuardada {
  id: string;
  titulo: string;
  metrica: Metrica;
  dimension: Dimension;
  tipo: TipoGrafica;
  createdAt: string;
}

export async function fetchGraficas(): Promise<GraficaGuardada[]> {
  const { data } = await api.get<GraficaGuardada[]>("/analitica/graficas");
  return data;
}

export async function crearGrafica(g: Omit<GraficaGuardada, "id" | "createdAt">): Promise<GraficaGuardada> {
  const { data } = await api.post<GraficaGuardada>("/analitica/graficas", g);
  return data;
}

export async function eliminarGrafica(id: string): Promise<void> {
  await api.delete(`/analitica/graficas/${id}`);
}
