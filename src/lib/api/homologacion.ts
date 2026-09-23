import { api } from "@/lib/api/http";
import { assertFileSizeOk, uploadToSignedUrl } from "@/lib/api/storage";

const BUCKET = "homologacion-documentos";

export type EstadoHomologacion = "borrador" | "en_revision" | "aprobado" | "rechazado" | "zona_gris";
export type EstadoDocumento = "pendiente" | "subido" | "validado" | "vencido";
export type CategoriaDocumento =
  | "legal"
  | "financiero"
  | "certificaciones"
  | "referencias"
  | "hse"
  | "sostenibilidad"
  | "riesgo_financiero"
  | "laft";

export const CATEGORIAS_DOCUMENTO: { value: CategoriaDocumento; label: string; descripcion: string }[] = [
  { value: "legal", label: "Legal", descripcion: "RUT / NIT, cámara de comercio" },
  { value: "financiero", label: "Financiero", descripcion: "Estados financieros" },
  { value: "certificaciones", label: "Certificaciones", descripcion: "ISO / BASC / ESG" },
  { value: "referencias", label: "Referencias", descripcion: "Referencias comerciales" },
  { value: "hse", label: "HSE", descripcion: "SG-SST / RUC — seguridad y salud en el trabajo" },
  { value: "sostenibilidad", label: "Sostenibilidad", descripcion: "Política o reporte ESG" },
  { value: "riesgo_financiero", label: "Centrales de riesgo", descripcion: "Reporte de centrales de riesgo" },
  { value: "laft", label: "SARLAFT / LAFT", descripcion: "Conocimiento del proveedor, prevención de lavado de activos" },
];

export const CATEGORIA_LABEL = Object.fromEntries(CATEGORIAS_DOCUMENTO.map((c) => [c.value, c.label])) as Record<
  CategoriaDocumento,
  string
>;

export interface DocumentoHomologacion {
  id: string;
  nombre: string;
  categoria: CategoriaDocumento;
  estado: EstadoDocumento;
  /** Required ones block "enviar"; optional ones matter when a client requires their category. */
  obligatorio: boolean;
}

export type ResultadoLista = "sin_coincidencia" | "coincidencia" | "no_disponible" | "pendiente_manual";

export interface VerificacionLista {
  lista: string;
  resultado: ResultadoLista;
  detalle: string | null;
  verificadoPor: string | null;
}

export const LISTA_LABEL: Record<string, string> = {
  OFAC: "OFAC / SDN (EE. UU.)",
  ONU: "Consejo de Seguridad ONU",
  PROCURADURIA: "Procuraduría (antecedentes disciplinarios)",
  CONTRALORIA: "Contraloría (responsables fiscales)",
  POLICIA: "Policía Nacional (antecedentes judiciales)",
};

/** Mandatory documents still without a file — "enviar" is rejected by the API while any remain. */
export function documentosObligatoriosFaltantes(documentos: DocumentoHomologacion[]): DocumentoHomologacion[] {
  return documentos.filter((d) => d.obligatorio && d.estado === "pendiente");
}

/** Mirrors the backend's HomologacionService guard: when a document can be (re)uploaded. */
export function puedeSubirDocumento(homologacionEstado: EstadoHomologacion, doc: DocumentoHomologacion): boolean {
  if (homologacionEstado === "en_revision" || homologacionEstado === "zona_gris") return false;
  // Approved: renew expired ones, or add an optional document never uploaded (validated on its own by Compliance).
  if (homologacionEstado === "aprobado") return doc.estado === "vencido" || (!doc.obligatorio && doc.estado === "pendiente");
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
  verificaciones: VerificacionLista[];
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
    categoria: Uppercase<CategoriaDocumento>;
    estado: "PENDIENTE" | "SUBIDO" | "VALIDADO" | "VENCIDO";
    obligatorio: boolean;
  }[];
  verificaciones?: {
    lista: string;
    resultado: Uppercase<ResultadoLista>;
    detalle: string | null;
    verificadoPor: string | null;
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
      obligatorio: d.obligatorio,
    })),
    verificaciones: (h.verificaciones ?? []).map((v) => ({
      lista: v.lista,
      resultado: v.resultado.toLowerCase() as ResultadoLista,
      detalle: v.detalle,
      verificadoPor: v.verificadoPor,
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

export async function registrarVerificacion(
  proveedorId: string,
  lista: string,
  resultado: "SIN_COINCIDENCIA" | "COINCIDENCIA",
  detalle?: string,
) {
  const { data } = await api.post(`/homologacion/${proveedorId}/verificaciones`, { lista, resultado, detalle });
  return data;
}

export async function fetchRequisitosHomologacion(): Promise<CategoriaDocumento[]> {
  const { data } = await api.get<{ categorias: Uppercase<CategoriaDocumento>[] }>("/homologacion/requisitos");
  return data.categorias.map((c) => c.toLowerCase() as CategoriaDocumento);
}

export async function guardarRequisitosHomologacion(categorias: CategoriaDocumento[]): Promise<CategoriaDocumento[]> {
  const { data } = await api.put<{ categorias: Uppercase<CategoriaDocumento>[] }>("/homologacion/requisitos", {
    categorias: categorias.map((c) => c.toUpperCase()),
  });
  return data.categorias.map((c) => c.toLowerCase() as CategoriaDocumento);
}

export async function validarDocumento(documentoId: string, valido: boolean, motivo?: string) {
  const { data } = await api.post(`/homologacion/documentos/${documentoId}/validar`, { valido, motivo });
  return data;
}
