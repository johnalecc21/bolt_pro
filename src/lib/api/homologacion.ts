import { api } from "@/lib/api/http";
import { supabase } from "@/lib/supabase/client";

const BUCKET = "homologacion-documentos";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type EstadoHomologacion = "en_revision" | "aprobado" | "rechazado" | "zona_gris";
export type EstadoDocumento = "pendiente" | "subido" | "validado" | "vencido";

export interface DocumentoHomologacion {
  id: string;
  nombre: string;
  estado: EstadoDocumento;
}

export interface RegistroHomologacion {
  id: string;
  estado: EstadoHomologacion;
  score: number;
  alertas: string[];
  fechaSolicitud: string;
  proximaRevalidacion: string;
  documentos: DocumentoHomologacion[];
}

interface ApiHomologacion {
  id: string;
  estado: "EN_REVISION" | "APROBADO" | "RECHAZADO" | "ZONA_GRIS";
  score: number;
  alertas: string[];
  fechaSolicitud: string;
  proximaRevalidacion: string | null;
  documentos: { id: string; nombre: string; estado: "PENDIENTE" | "SUBIDO" | "VALIDADO" | "VENCIDO" }[];
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
    documentos: h.documentos.map((d) => ({ id: d.id, nombre: d.nombre, estado: d.estado.toLowerCase() as EstadoDocumento })),
  };
}

export async function fetchMiHomologacion(): Promise<RegistroHomologacion> {
  const { data } = await api.get<ApiHomologacion>("/homologacion/mine");
  return toRegistro(data);
}

export async function subirDocumento(documentoId: string, file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("El archivo supera el tamaño máximo permitido (10 MB). Comprime el PDF e inténtalo de nuevo.");
  }

  const { data: uploadUrlData } = await api.post<{ path: string; token: string }>(
    `/homologacion/documentos/${documentoId}/upload-url`,
    { filename: file.name },
  );

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(uploadUrlData.path, uploadUrlData.token, file);
  if (uploadError) throw uploadError;

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
