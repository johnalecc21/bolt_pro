import { api } from "@/lib/api/http";
import { mapPaginado, type Paginado } from "@/lib/api/paginacion";
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
  color: string;
  desempenoPromedio: number | null;
  evaluacionesCount: number;
  descripcion?: string | null;
  onboardingCompletado?: boolean;
  nit?: string | null;
}

export interface MiPerfilProveedor extends Proveedor {
  onboardingCompletado: boolean;
  /** Tax id — how buyers' ERPs identify the supplier. */
  nit: string | null;
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
    color: p.color,
    desempenoPromedio: p.desempenoPromedio ?? null,
    evaluacionesCount: p.evaluacionesCount ?? 0,
    descripcion: p.descripcion ?? null,
  };
}

export async function fetchProveedores(params?: { categoria?: string; minScore?: number; query?: string }): Promise<Proveedor[]> {
  // The API names the text filter `q` (it matches name, description and catalog items).
  const { query, ...rest } = params ?? {};
  const { data } = await api.get<ApiProveedor[]>("/proveedores", { params: { ...rest, ...(query ? { q: query } : {}) } });
  return data.map(toProveedor);
}

/** Server-side paginated directory (search matches name, description and catalog items). */
export async function fetchProveedoresPagina(params: {
  page: number;
  limit?: number;
  query?: string;
  categoria?: string;
  minScore?: number;
}): Promise<Paginado<Proveedor>> {
  const { data } = await api.get<Paginado<ApiProveedor>>("/proveedores/pagina", {
    params: {
      page: params.page,
      limit: params.limit ?? 24,
      ...(params.query ? { q: params.query } : {}),
      ...(params.categoria && params.categoria !== "Todas" ? { categoria: params.categoria } : {}),
      ...(params.minScore ? { minScore: params.minScore } : {}),
    },
  });
  return mapPaginado(data, toProveedor);
}

export async function fetchCategoriasProveedores(): Promise<string[]> {
  const { data } = await api.get<string[]>("/proveedores/categorias");
  return data;
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
  return { ...toProveedor(data), onboardingCompletado: data.onboardingCompletado ?? false, nit: data.nit ?? null };
}

export async function actualizarMiPerfil(payload: { nombre?: string; categorias?: string[]; ubicacion?: string; sitioWeb?: string; nit?: string; certificaciones?: string[] }): Promise<MiPerfilProveedor> {
  const { data } = await api.patch<ApiProveedor>("/proveedores/mine", payload);
  return { ...toProveedor(data), onboardingCompletado: data.onboardingCompletado ?? false, nit: data.nit ?? null };
}

export async function completarOnboardingProveedor(): Promise<void> {
  await api.post("/proveedores/mine/onboarding/completar");
}
