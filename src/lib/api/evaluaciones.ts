import { api } from "@/lib/api/http";
import type { Criterios } from "@/lib/evaluacion";

export interface Evaluacion extends Criterios {
  id: string;
  puntaje: number;
  comentario: string | null;
  requierePlanMejora: boolean;
  createdAt: string;
}

export interface EvaluacionCliente extends Evaluacion {
  evaluador: { nombre: string };
  contratoCodigo?: string;
}

export interface EvaluacionProveedor extends Evaluacion {
  cliente: string;
  contratoCodigo: string;
}

export interface ResumenDesempeno {
  total: number;
  promedio: number | null;
  porCriterio: Record<keyof Criterios, number | null>;
  /** Only the caller's own company's evaluations — other clients' comments stay private. */
  propias: EvaluacionCliente[];
}

export async function crearEvaluacion(payload: Criterios & { contratoId: string; comentario?: string }): Promise<Evaluacion> {
  const { data } = await api.post<Evaluacion>("/evaluaciones", payload);
  return data;
}

export async function fetchEvaluacionesContrato(contratoId: string): Promise<EvaluacionCliente[]> {
  const { data } = await api.get<EvaluacionCliente[]>(`/evaluaciones/contrato/${contratoId}`);
  return data;
}

export async function fetchResumenDesempeno(proveedorId: string): Promise<ResumenDesempeno> {
  const { data } = await api.get<ResumenDesempeno>(`/evaluaciones/proveedor/${proveedorId}`);
  return data;
}

export async function fetchMisEvaluaciones(): Promise<EvaluacionProveedor[]> {
  const { data } = await api.get<EvaluacionProveedor[]>("/evaluaciones/mias");
  return data;
}
