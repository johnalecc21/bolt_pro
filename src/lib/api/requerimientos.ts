import { api } from "@/lib/api/http";
import type { EstadoReq, Requerimiento } from "@/lib/mockData";

export interface Especificacion {
  name: string;
  value: string;
}

export interface AprobacionPaso {
  rol: string;
  aprobadoAt: string;
  aprobadoPor: { nombre: string };
}

export interface AprobacionRequerimiento {
  id: string;
  tipo: string;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  monto: number;
  tipoRegla: "UNICA" | "SECUENCIAL";
  rolesRequeridos: string[];
  pasoActual: number;
  motivoRechazo: string | null;
  resueltoPor: { nombre: string } | null;
  resueltoAt: string | null;
  pasos: AprobacionPaso[];
}

export interface InvitacionRequerimiento {
  proveedorId: string;
  estado: "NUEVA" | "VISTA" | "RESPONDIDA" | "VENCIDA" | "DECLINADA";
  createdAt: string;
  proveedor: { id: string; nombre: string; iniciales: string; color: string };
}

interface ApiRequerimiento {
  id: string;
  companyId: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  estado: string;
  montoEstimado: number;
  fechaLimite: string;
  progreso: number;
  proveedoresInvitados: number;
  ofertasRecibidas: number;
  criteriosPeso: Record<string, number> | null;
  especificaciones: Especificacion[] | null;
  solicitante?: { nombre: string };
  comentarios?: { id: string; autor: string; texto: string; createdAt: string }[];
  documentos?: { id: string; nombre: string }[];
  adjudicacion?: unknown;
  ofertas?: unknown[];
  aprobaciones?: AprobacionRequerimiento[];
  invitaciones?: InvitacionRequerimiento[];
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
  descripcion: string | null;
  criteriosPeso: Record<string, number> | null;
  especificaciones: Especificacion[];
  comentarios: { id: string; autor: string; texto: string; createdAt: string }[];
  documentos: { id: string; nombre: string }[];
  aprobaciones: AprobacionRequerimiento[];
  invitaciones: InvitacionRequerimiento[];
}

function toRequerimientoDetalle(r: ApiRequerimiento): RequerimientoDetalle {
  return {
    ...toRequerimiento(r),
    descripcion: r.descripcion ?? null,
    criteriosPeso: r.criteriosPeso ?? null,
    especificaciones: r.especificaciones ?? [],
    comentarios: r.comentarios ?? [],
    documentos: r.documentos ?? [],
    aprobaciones: r.aprobaciones ?? [],
    invitaciones: r.invitaciones ?? [],
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

export interface CreateRequerimientoResultado {
  requerimiento: Requerimiento;
  excluidos: { id: string; nombre: string }[];
}

export async function createRequerimiento(payload: {
  titulo: string;
  descripcion?: string;
  categoria: string;
  montoEstimado: number;
  fechaLimite: string;
  criteriosPeso?: Record<string, number>;
  especificaciones?: Especificacion[];
  proveedorIds?: string[];
}): Promise<CreateRequerimientoResultado> {
  const { data } = await api.post<ApiRequerimiento & { excluidosPorHomologacion?: { id: string; nombre: string }[] }>(
    "/requerimientos",
    payload,
  );
  return { requerimiento: toRequerimiento(data), excluidos: data.excluidosPorHomologacion ?? [] };
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
