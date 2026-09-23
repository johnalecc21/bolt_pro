import { api } from "@/lib/api/http";
import { assertFileSizeOk, uploadToSignedUrl } from "@/lib/api/storage";
import type { Moneda } from "@/lib/moneda";

const BUCKET = "vitrina-proveedores";

export type TipoArchivoVitrina = "IMAGEN" | "BROCHURE" | "CATALOGO";

export interface ImagenVitrina {
  id: string;
  titulo: string;
  /** Short-lived signed URL; null if the file couldn't be signed. */
  url: string | null;
}

export interface DocumentoVitrina extends ImagenVitrina {
  tipo: Exclude<TipoArchivoVitrina, "IMAGEN">;
}

export interface ItemCatalogo {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  unidad: string | null;
  precioReferencia: number | null;
  moneda: Moneda | null;
  imagenPath: string | null;
  imagenUrl: string | null;
}

/** What the proveedor manages itself — shared by the public page and the editor. */
export interface ContenidoVitrina {
  descripcion: string | null;
  telefonoContacto: string | null;
  emailContacto: string | null;
  videoUrl: string | null;
  galeria: ImagenVitrina[];
  documentos: DocumentoVitrina[];
  catalogo: ItemCatalogo[];
}

/** Public, login-free profile of a homologated proveedor. */
export interface VitrinaProveedor extends ContenidoVitrina {
  id: string;
  nombre: string;
  iniciales: string;
  color: string;
  categorias: string[];
  ubicacion: string;
  sitioWeb: string | null;
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

export interface MiVitrina extends ContenidoVitrina {
  id: string;
  vitrinaVistas: number;
  /** False until the homologación is approved — the public page 404s until then. */
  publicada: boolean;
}

export interface ItemCatalogoInput {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  unidad?: string;
  precioReferencia?: number;
  moneda?: Moneda;
  /** Path from subirImagenItem; "" removes the photo; omit to keep it. */
  imagenPath?: string;
}

export function urlVitrina(id: string): string {
  return `${window.location.origin}/vitrina/${id}`;
}

export async function fetchVitrina(id: string): Promise<VitrinaProveedor> {
  const { data } = await api.get<VitrinaProveedor>(`/vitrina/${id}`);
  return data;
}

export async function fetchMiVitrina(): Promise<MiVitrina> {
  const { data } = await api.get<MiVitrina>("/vitrina/mine");
  return data;
}

export async function actualizarVitrina(payload: {
  descripcion?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  videoUrl?: string;
}): Promise<MiVitrina> {
  const { data } = await api.patch<MiVitrina>("/vitrina/mine", payload);
  return data;
}

async function subir(file: File, uso: TipoArchivoVitrina | "ITEM"): Promise<string> {
  assertFileSizeOk(file);
  const { data } = await api.post<{ path: string; token: string }>("/vitrina/mine/upload-url", {
    filename: file.name,
    uso,
  });
  await uploadToSignedUrl(BUCKET, data.path, data.token, file);
  return data.path;
}

/** Uploads an image or PDF and registers it on the vitrina. */
export async function subirArchivoVitrina(file: File, tipo: TipoArchivoVitrina, titulo: string) {
  const path = await subir(file, tipo);
  const { data } = await api.post("/vitrina/mine/archivos", { tipo, titulo, path });
  return data;
}

export async function eliminarArchivoVitrina(id: string) {
  await api.delete(`/vitrina/mine/archivos/${id}`);
}

/** Uploads a catalog item's photo; pass the returned path in the item payload. */
export function subirImagenItem(file: File): Promise<string> {
  return subir(file, "ITEM");
}

export async function crearItemCatalogo(payload: ItemCatalogoInput) {
  const { data } = await api.post("/vitrina/mine/items", payload);
  return data;
}

export async function actualizarItemCatalogo(id: string, payload: ItemCatalogoInput) {
  const { data } = await api.put(`/vitrina/mine/items/${id}`, payload);
  return data;
}

export async function eliminarItemCatalogo(id: string) {
  await api.delete(`/vitrina/mine/items/${id}`);
}
