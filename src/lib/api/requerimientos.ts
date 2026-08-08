import { api } from "@/lib/api/http";
import type { EstadoReq, Requerimiento } from "@/lib/mockData";

interface ApiRequerimiento {
  id: string;
  companyId: string;
  titulo: string;
  categoria: string;
  estado: string;
  montoEstimado: number;
  fechaLimite: string;
  progreso: number;
  proveedoresInvitados: number;
  ofertasRecibidas: number;
  criteriosPeso: Record<string, number> | null;
  solicitante?: { nombre: string };
  comentarios?: { id: string; autor: string; texto: string; createdAt: string }[];
  documentos?: { id: string; nombre: string }[];
  adjudicacion?: unknown;
  ofertas?: unknown[];
}

function toRequerimiento(r: ApiRequerimiento): Requerimiento {
  return {
    id: r.id,
    titulo: r.titulo,
    categoria: r.categoria,
    estado: r.estado.toLowerCase() as EstadoReq,
    montoEstimado: r.montoEstimado,
    fechaLimite: r.fechaLimite.slice(0, 10),
    progreso: r.progreso,
    proveedoresInvitados: r.proveedoresInvitados,
    ofertasRecibidas: r.ofertasRecibidas,
    solicitante: r.solicitante?.nombre ?? "",
    companyId: r.companyId,
  };
}

export interface RequerimientoDetalle extends Requerimiento {
  criteriosPeso: Record<string, number> | null;
  comentarios: { id: string; autor: string; texto: string; createdAt: string }[];
  documentos: { id: string; nombre: string }[];
}

function toRequerimientoDetalle(r: ApiRequerimiento): RequerimientoDetalle {
  return {
    ...toRequerimiento(r),
    criteriosPeso: r.criteriosPeso ?? null,
    comentarios: r.comentarios ?? [],
    documentos: r.documentos ?? [],
  };
}

export async function fetchRequerimientos(): Promise<Requerimiento[]> {
  const { data } = await api.get<ApiRequerimiento[]>("/requerimientos");
  return data.map(toRequerimiento);
}

export async function fetchRequerimiento(id: string): Promise<RequerimientoDetalle> {
  const { data } = await api.get<ApiRequerimiento>(`/requerimientos/${id}`);
  return toRequerimientoDetalle(data);
}

export async function createRequerimiento(payload: {
  titulo: string;
  categoria: string;
  montoEstimado: number;
  fechaLimite: string;
  criteriosPeso?: Record<string, number>;
}): Promise<Requerimiento> {
  const { data } = await api.post<ApiRequerimiento>("/requerimientos", payload);
  return toRequerimiento(data);
}

export async function updateRequerimientoEstado(id: string, estado: EstadoReq): Promise<Requerimiento> {
  const { data } = await api.patch<ApiRequerimiento>(`/requerimientos/${id}/estado`, {
    estado: estado.toUpperCase(),
  });
  return toRequerimiento(data);
}

export async function extenderPlazo(id: string, dias: number, motivo?: string): Promise<Requerimiento> {
  const { data } = await api.patch<ApiRequerimiento>(`/requerimientos/${id}/extender-plazo`, { dias, motivo });
  return toRequerimiento(data);
}

export async function addComentario(id: string, texto: string) {
  const { data } = await api.post(`/requerimientos/${id}/comentarios`, { texto });
  return data;
}

export interface InvitarProveedoresResultado {
  requerimiento: Requerimiento;
  excluidos: { id: string; nombre: string }[];
}

export async function invitarProveedores(id: string, proveedorIds: string[]): Promise<InvitarProveedoresResultado> {
  const { data } = await api.post<ApiRequerimiento & { excluidosPorHomologacion?: { id: string; nombre: string }[] }>(
    `/requerimientos/${id}/invitaciones`,
    { proveedorIds },
  );
  return { requerimiento: toRequerimiento(data), excluidos: data.excluidosPorHomologacion ?? [] };
}
