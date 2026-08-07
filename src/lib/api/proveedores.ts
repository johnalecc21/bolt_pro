import { api } from "@/lib/api/http";
import type { Proveedor } from "@/lib/mockData";

interface ApiProveedor {
  id: string;
  nombre: string;
  iniciales: string;
  categorias: string[];
  score: number;
  ubicacion: string;
  certificaciones: string[];
  procesosGanados: number;
  entregasATiempo: number;
  disputasCount: number;
  color: string;
}

function toProveedor(p: ApiProveedor): Proveedor {
  return {
    id: p.id,
    nombre: p.nombre,
    iniciales: p.iniciales,
    categorias: p.categorias,
    score: p.score,
    ubicacion: p.ubicacion,
    certificaciones: p.certificaciones,
    procesosGanados: p.procesosGanados,
    entregasATiempo: p.entregasATiempo,
    disputas: p.disputasCount,
    color: p.color,
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

export async function fetchMiPerfil(): Promise<Proveedor> {
  const { data } = await api.get<ApiProveedor>("/proveedores/mine");
  return toProveedor(data);
}
