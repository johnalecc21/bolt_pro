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

/** Public, login-free profile of a homologated proveedor ("vitrina"). */
export interface VitrinaProveedor {
  id: string;
  nombre: string;
  iniciales: string;
  color: string;
  categorias: string[];
  ubicacion: string;
  certificaciones: string[];
  score: number;
  procesosGanados: number;
  entregasATiempo: number;
  desempenoPromedio: number | null;
  evaluacionesCount: number;
  homologadoHasta: string | null;
  categoriasVerificadas: string[];
  miembroDesde: string;
}

export async function fetchVitrina(id: string): Promise<VitrinaProveedor> {
  const { data } = await api.get<VitrinaProveedor>(`/proveedores/vitrina/${id}`);
  return data;
}

export function urlVitrina(id: string): string {
  return `${window.location.origin}/vitrina/${id}`;
}
