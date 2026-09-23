import { api } from "@/lib/api/http";
import type { Moneda } from "@/lib/moneda";

export type TipoUnidad = "SEDE" | "UNIDAD_NEGOCIO";

export interface UnidadNegocio {
  id: string;
  nombre: string;
  codigo: string;
  tipo: TipoUnidad;
  ciudad: string | null;
  activa: boolean;
}

export interface CentroCosto {
  id: string;
  nombre: string;
  codigo: string;
  unidadNegocioId: string | null;
  unidadNegocio: { nombre: string } | null;
  responsable: string | null;
  activo: boolean;
  /** Budget for the requested year, if set. */
  presupuesto: { anio: number; monto: number; moneda: Moneda } | null;
}

export interface Estructura {
  exigeCentroCosto: boolean;
  anio: number;
  unidades: UnidadNegocio[];
  centros: CentroCosto[];
}

export interface EjecucionCentro {
  centroCostoId: string;
  codigo: string;
  nombre: string;
  unidad: string | null;
  activo: boolean;
  moneda: Moneda | null;
  ejecucion: {
    presupuesto: number;
    comprometido: number;
    enProceso: number;
    disponible: number;
    porcentajeUsado: number;
  } | null;
}

export async function fetchEstructura(anio?: number): Promise<Estructura> {
  const { data } = await api.get<Estructura>("/estructura", { params: anio ? { anio } : undefined });
  return data;
}

export async function fetchEjecucion(anio: number): Promise<{ anio: number; centros: EjecucionCentro[] }> {
  const { data } = await api.get("/estructura/ejecucion", { params: { anio } });
  return data;
}

export async function guardarConfigEstructura(exigeCentroCosto: boolean) {
  const { data } = await api.put("/estructura/config", { exigeCentroCosto });
  return data;
}

export interface UnidadInput {
  nombre: string;
  codigo: string;
  tipo: TipoUnidad;
  ciudad?: string;
  activa?: boolean;
}

export async function guardarUnidad(id: string | null, payload: UnidadInput) {
  const { data } = id ? await api.patch(`/estructura/unidades/${id}`, payload) : await api.post("/estructura/unidades", payload);
  return data;
}

export interface CentroInput {
  nombre: string;
  codigo: string;
  /** "" detaches it from any unit. */
  unidadNegocioId: string;
  responsable?: string;
  activo?: boolean;
}

export async function guardarCentro(id: string | null, payload: CentroInput) {
  const { data } = id ? await api.patch(`/estructura/centros/${id}`, payload) : await api.post("/estructura/centros", payload);
  return data;
}

export async function fijarPresupuesto(centroId: string, anio: number, monto: number, moneda: Moneda) {
  const { data } = await api.put(`/estructura/centros/${centroId}/presupuestos/${anio}`, { monto, moneda });
  return data;
}
