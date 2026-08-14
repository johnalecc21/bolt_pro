import { api } from "@/lib/api/http";
import { supabase } from "@/lib/supabase/client";
import type { EstadoReq, Requerimiento } from "@/lib/mockData";

const BUCKET = "requerimientos-documentos";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

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

export interface DocumentoRequerimiento {
  id: string;
  nombre: string;
  estado: "pendiente" | "subido";
}

interface ApiDocumentoRequerimiento {
  id: string;
  nombre: string;
  estado: "PENDIENTE" | "SUBIDO";
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
  documentos?: ApiDocumentoRequerimiento[];
  adjudicacion?: unknown;
  ofertas?: unknown[];
  aprobaciones?: AprobacionRequerimiento[];
  invitaciones?: InvitacionRequerimiento[];
}

function toDocumento(d: ApiDocumentoRequerimiento): DocumentoRequerimiento {
  return { id: d.id, nombre: d.nombre, estado: d.estado.toLowerCase() as DocumentoRequerimiento["estado"] };
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
  documentos: DocumentoRequerimiento[];
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
    documentos: (r.documentos ?? []).map(toDocumento),
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

// Creates the document row, uploads straight to Supabase Storage with a
// signed URL scoped to that row, then confirms — same 3-step pattern as
// contratos.ts / homologacion.ts.
export async function subirDocumentoRequerimiento(id: string, file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("El archivo supera el tamaño máximo permitido (10 MB). Comprime el PDF e inténtalo de nuevo.");
  }

  const { data: uploadUrlData } = await api.post<{ docId: string; path: string; token: string }>(
    `/requerimientos/${id}/documentos/upload-url`,
    { filename: file.name },
  );

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(uploadUrlData.path, uploadUrlData.token, file);
  if (uploadError) throw uploadError;

  const { data } = await api.post(
    `/requerimientos/${id}/documentos/${uploadUrlData.docId}/confirmar`,
    { path: uploadUrlData.path },
  );
  return data;
}

export async function obtenerUrlDescargaDocumento(id: string, docId: string): Promise<{ url: string; nombre: string }> {
  const { data } = await api.get<{ url: string; nombre: string }>(`/requerimientos/${id}/documentos/${docId}/url`);
  return data;
}
