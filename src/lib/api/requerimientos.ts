import { api } from "@/lib/api/http";
import { assertFileSizeOk, uploadToSignedUrl } from "@/lib/api/storage";
import { formatRequerimientoCodigo } from "@/lib/codigo";
import type { EstadoReq, Prioridad, Requerimiento } from "@/lib/types";
import type { Moneda } from "@/lib/moneda";
import { mapPaginado, type Paginado } from "@/lib/api/paginacion";
import { fechaLocal } from "@/lib/fecha";

const BUCKET = "requerimientos-documentos";

export interface Especificacion {
  name: string;
  value: string;
}

/** One line of the bill of quantities; suppliers price each line. */
export interface ItemRequerimiento {
  descripcion: string;
  cantidad: number;
  unidad: string;
  especificacion?: string | null;
}

export interface ItemRequerimientoGuardado extends ItemRequerimiento {
  id: string;
  orden: number;
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
  numero: number;
  companyId: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  estado: string;
  montoEstimado: number;
  moneda: Moneda;
  fechaLimite: string;
  prioridad?: "NORMAL" | "ALTA" | "URGENTE";
  progreso: number;
  proveedoresInvitados: number;
  ofertasRecibidas: number;
  criteriosPeso: Record<string, number> | null;
  especificaciones: Especificacion[] | null;
  solicitante?: { nombre: string };
  centroCostoId?: string | null;
  centroCosto?: { codigo: string; nombre: string } | null;
  comentarios?: { id: string; autor: string; texto: string; createdAt: string }[];
  documentos?: ApiDocumentoRequerimiento[];
  items?: ItemRequerimientoGuardado[];
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
    codigo: formatRequerimientoCodigo(r.numero),
    titulo: r.titulo,
    categoria: r.categoria,
    estado: r.estado.toLowerCase() as EstadoReq,
    montoEstimado: r.montoEstimado,
    moneda: r.moneda,
    fechaLimite: fechaLocal(r.fechaLimite),
    cierre: r.fechaLimite,
    prioridad: (r.prioridad ?? "NORMAL").toLowerCase() as Prioridad,
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
  items: ItemRequerimientoGuardado[];
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
    items: r.items ?? [],
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

/** A proveedor left out of an invitation, with why (homologación or a missing required document). */
export interface ProveedorExcluido {
  id: string;
  nombre: string;
  motivo?: string;
}

/** "Acme (Faltan documentos validados: HSE), Beta (Homologación no aprobada)" — for toasts. */
export function describirExcluidos(excluidos: ProveedorExcluido[]): string {
  return excluidos.map((e) => (e.motivo ? `${e.nombre} (${e.motivo})` : e.nombre)).join(", ");
}

/** Budget check of the chosen centro de costo — null when it has no budget in that currency. */
export interface EvaluacionPresupuesto {
  centroCosto: string;
  presupuesto: number;
  disponible: number;
  moneda: Moneda;
  excede: boolean;
}

export interface CreateRequerimientoResultado {
  requerimiento: Requerimiento;
  excluidos: ProveedorExcluido[];
  presupuesto: EvaluacionPresupuesto | null;
}

export async function createRequerimiento(payload: {
  titulo: string;
  descripcion?: string;
  categoria: string;
  montoEstimado: number;
  moneda?: Moneda;
  fechaLimite: string;
  criteriosPeso?: Record<string, number>;
  especificaciones?: Especificacion[];
  proveedorIds?: string[];
  centroCostoId?: string;
  prioridad?: Prioridad;
  items?: ItemRequerimiento[];
}): Promise<CreateRequerimientoResultado> {
  const { data } = await api.post<
    ApiRequerimiento & { excluidosPorHomologacion?: ProveedorExcluido[]; presupuesto?: EvaluacionPresupuesto | null }
  >("/requerimientos", { ...payload, prioridad: payload.prioridad?.toUpperCase() });
  return {
    requerimiento: toRequerimiento(data),
    excluidos: data.excluidosPorHomologacion ?? [],
    presupuesto: data.presupuesto ?? null,
  };
}

export interface RequerimientoListado extends Requerimiento {
  centroCosto: string | null;
}

/** Server-side paginated list (search by code/title/category, state and cost center). */
export async function fetchRequerimientosPagina(params: {
  page: number;
  limit?: number;
  q?: string;
  estado?: EstadoReq;
  centroCostoId?: string;
}): Promise<Paginado<RequerimientoListado>> {
  const { data } = await api.get<Paginado<ApiRequerimiento>>("/requerimientos/pagina", {
    params: {
      page: params.page,
      limit: params.limit ?? 20,
      ...(params.q ? { q: params.q } : {}),
      ...(params.estado ? { estado: params.estado.toUpperCase() } : {}),
      ...(params.centroCostoId ? { centroCostoId: params.centroCostoId } : {}),
    },
  });
  return mapPaginado(data, (r) => ({
    ...toRequerimiento(r),
    centroCosto: r.centroCosto ? `${r.centroCosto.codigo} — ${r.centroCosto.nombre}` : null,
  }));
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
  excluidos: ProveedorExcluido[];
}

export async function invitarProveedores(id: string, proveedorIds: string[]): Promise<InvitarProveedoresResultado> {
  const { data } = await api.post<ApiRequerimiento & { excluidosPorHomologacion?: ProveedorExcluido[] }>(
    `/requerimientos/${id}/invitaciones`,
    { proveedorIds },
  );
  return { requerimiento: toRequerimiento(data), excluidos: data.excluidosPorHomologacion ?? [] };
}

// Creates the document row, uploads straight to Supabase Storage with a
// signed URL scoped to that row, then confirms — same 3-step pattern as
// contratos.ts / homologacion.ts.
export async function subirDocumentoRequerimiento(id: string, file: File) {
  assertFileSizeOk(file);

  const { data: uploadUrlData } = await api.post<{ docId: string; path: string; token: string }>(
    `/requerimientos/${id}/documentos/upload-url`,
    { filename: file.name, tamanoBytes: file.size },
  );

  await uploadToSignedUrl(BUCKET, uploadUrlData.path, uploadUrlData.token, file);

  const { data } = await api.post(
    `/requerimientos/${id}/documentos/${uploadUrlData.docId}/confirmar`,
    { path: uploadUrlData.path, tamanoBytes: file.size },
  );
  return data;
}

export async function obtenerUrlDescargaDocumento(id: string, docId: string): Promise<{ url: string; nombre: string }> {
  const { data } = await api.get<{ url: string; nombre: string }>(`/requerimientos/${id}/documentos/${docId}/url`);
  return data;
}

/** Ends the tender now; the API rejects new or edited offers from this moment. */
export async function cerrarLicitacion(id: string): Promise<Requerimiento> {
  const { data } = await api.post<ApiRequerimiento>(`/requerimientos/${id}/cerrar-licitacion`);
  return toRequerimiento(data);
}

/** Corrects a rejected (back-to-borrador) requerimiento and sends it to approval again. */
export async function reenviarRequerimiento(
  id: string,
  cambios: { titulo?: string; descripcion?: string; montoEstimado?: number; fechaLimite?: string; prioridad?: Prioridad },
): Promise<Requerimiento> {
  const { data } = await api.post<ApiRequerimiento>(`/requerimientos/${id}/reenviar`, {
    ...cambios,
    prioridad: cambios.prioridad?.toUpperCase(),
  });
  return toRequerimiento(data);
}
