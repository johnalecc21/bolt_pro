import { api } from "@/lib/api/http";
import { assertFileSizeOk, uploadToSignedUrl } from "@/lib/api/storage";

const BUCKET = "homologacion-documentos";

export type EstadoHomologacion = "borrador" | "en_revision" | "aprobado" | "rechazado" | "zona_gris";
export type EstadoDocumento = "pendiente" | "subido" | "validado" | "vencido";
export type CategoriaDocumento = "legal" | "financiero" | "certificaciones" | "referencias";

export interface DocumentoHomologacion {
  id: string;
  nombre: string;
  categoria: CategoriaDocumento;
  estado: EstadoDocumento;
}

/** Mirrors the backend's HomologacionService guard: when a document can be (re)uploaded. */
export function puedeSubirDocumento(homologacionEstado: EstadoHomologacion, doc: DocumentoHomologacion): boolean {
  if (homologacionEstado === "en_revision" || homologacionEstado === "zona_gris") return false;
  if (homologacionEstado === "aprobado") return doc.estado === "vencido";
  return true;
}

export interface RegistroHomologacion {
  id: string;
  estado: EstadoHomologacion;
  score: number;
  alertas: string[];
  fechaSolicitud: string;
  proximaRevalidacion: string;
  nitDetectado: string | null;
  documentos: DocumentoHomologacion[];
}

interface ApiHomologacion {
  id: string;
  estado: "BORRADOR" | "EN_REVISION" | "APROBADO" | "RECHAZADO" | "ZONA_GRIS";
  score: number;
  alertas: string[];
  fechaSolicitud: string;
  proximaRevalidacion: string | null;
  nitDetectado: string | null;
  documentos: {
    id: string;
    nombre: string;
    categoria: "LEGAL" | "FINANCIERO" | "CERTIFICACIONES" | "REFERENCIAS";
    estado: "PENDIENTE" | "SUBIDO" | "VALIDADO" | "VENCIDO";
  }[];
  proveedor?: { nombre: string; iniciales: string };
}

function toRegistro(h: ApiHomologacion): RegistroHomologacion {
  return {
    id: h.id,
    estado: h.estado.toLowerCase() as EstadoHomologacion,
    score: h.score,
    alertas: h.alertas,
    fechaSolicitud: h.fechaSolicitud.slice(0, 10),
    proximaRevalidacion: h.proximaRevalidacion ? h.proximaRevalidacion.slice(0, 10) : "—",
    nitDetectado: h.nitDetectado,
    documentos: h.documentos.map((d) => ({
      id: d.id,
      nombre: d.nombre,
      categoria: d.categoria.toLowerCase() as CategoriaDocumento,
      estado: d.estado.toLowerCase() as EstadoDocumento,
    })),
  };
}

export async function fetchMiHomologacion(): Promise<RegistroHomologacion> {
  const { data } = await api.get<ApiHomologacion>("/homologacion/mine");
  return toRegistro(data);
}

export async function subirDocumento(documentoId: string, file: File) {
  assertFileSizeOk(file);

  const { data: uploadUrlData } = await api.post<{ path: string; token: string }>(
    `/homologacion/documentos/${documentoId}/upload-url`,
    { filename: file.name },
  );

  await uploadToSignedUrl(BUCKET, uploadUrlData.path, uploadUrlData.token, file);

  const { data } = await api.post(`/homologacion/documentos/${documentoId}/subir`, { path: uploadUrlData.path });
  return data;
}

export async function obtenerUrlDescarga(documentoId: string): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/homologacion/documentos/${documentoId}/download-url`);
  return data.url;
}

export async function enviarHomologacion(): Promise<RegistroHomologacion> {
  const { data } = await api.post<ApiHomologacion>("/homologacion/enviar");
  return toRegistro(data);
}

export interface ColaHomologacionItem extends RegistroHomologacion {
  proveedorId: string;
  proveedorNombre: string;
  proveedorIniciales: string;
}

export async function fetchColaHomologacion(): Promise<ColaHomologacionItem[]> {
  const { data } = await api.get<(ApiHomologacion & { proveedorId: string })[]>("/homologacion/cola");
  return data.map((h) => ({
    ...toRegistro(h),
    proveedorId: h.proveedorId,
    proveedorNombre: h.proveedor?.nombre ?? "",
    proveedorIniciales: h.proveedor?.iniciales ?? "",
  }));
}

export async function resolverHomologacion(proveedorId: string, estado: "APROBADO" | "RECHAZADO", score: number, motivo?: string) {
  const { data } = await api.post(`/homologacion/${proveedorId}/resolver`, { estado, score, motivo });
  return data;
}
