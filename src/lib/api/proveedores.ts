import { api } from "@/lib/api/http";
import type { Proveedor } from "@/lib/types";

interface ApiProveedor {
  id: string;
  nombre: string;
  iniciales: string;
  categorias: string[];
  score: number;
  ubicacion: string;
  sitioWeb?: string | null;
  certificaciones: string[];
  procesosGanados: number;
  entregasATiempo: number;
  disputasCount: number;
  color: string;
  desempenoPromedio: number | null;
  evaluacionesCount: number;
  descripcion?: string | null;
  onboardingCompletado?: boolean;
}

export interface MiPerfilProveedor extends Proveedor {
  onboardingCompletado: boolean;
}

function toProveedor(p: ApiProveedor): Proveedor {
  return {
    id: p.id,
    nombre: p.nombre,
    iniciales: p.iniciales,
    categorias: p.categorias,
    score: p.score,
    ubicacion: p.ubicacion,
    sitioWeb: p.sitioWeb ?? null,
    certificaciones: p.certificaciones,
    procesosGanados: p.procesosGanados,
    entregasATiempo: p.entregasATiempo,
    disputas: p.disputasCount,
    color: p.color,
    desempenoPromedio: p.desempenoPromedio ?? null,
    evaluacionesCount: p.evaluacionesCount ?? 0,
    descripcion: p.descripcion ?? null,
  };
}

export async function fetchProveedores(params?: { categoria?: string; minScore?: number; query?: string }): Promise<Proveedor[]> {
  const { data } = await api.get<ApiProveedor[]>("/proveedores", { params });
  return data.map(toProveedor);
}

export async function fetchProveedor(id: string): Promise<Proveedor> {
  const { data } = await api.get<ApiProveedor>(`/proveedores/${id}`);
  return toProveedor(data);
}

export async function createProveedorExterno(nombre: string): Promise<Proveedor> {
  const { data } = await api.post<ApiProveedor>("/proveedores/externo", { nombre });
  return toProveedor(data);
}

export async function fetchMiPerfil(): Promise<MiPerfilProveedor> {
  const { data } = await api.get<ApiProveedor>("/proveedores/mine");
  return { ...toProveedor(data), onboardingCompletado: data.onboardingCompletado ?? false };
}

export async function actualizarMiPerfil(payload: { nombre?: string; categorias?: string[]; ubicacion?: string; sitioWeb?: string; certificaciones?: string[] }): Promise<MiPerfilProveedor> {
  const { data } = await api.patch<ApiProveedor>("/proveedores/mine", payload);
  return { ...toProveedor(data), onboardingCompletado: data.onboardingCompletado ?? false };
}

export async function completarOnboardingProveedor(): Promise<void> {
  await api.post("/proveedores/mine/onboarding/completar");
}
