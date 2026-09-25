import axios from "axios";
import { api } from "@/lib/api/http";
import { uploadToSignedUrl } from "@/lib/api/storage";

const BUCKET = "plantillas-documentos";

export type TipoPlantilla = "CONTRATO_MARCO" | "ORDEN_COMPRA";

export const TIPO_PLANTILLA_LABEL: Record<TipoPlantilla, string> = {
  ORDEN_COMPRA: "Orden de compra",
  CONTRATO_MARCO: "Contrato marco",
};

export interface Plantilla {
  id: string;
  tipo: TipoPlantilla;
  categoria: string | null;
  nombre: string;
  archivoNombre: string;
  tamanoBytes: number | null;
  activa: boolean;
  marcadores: string[];
  advertencias: string[];
  subidaPor: string;
  createdAt: string;
}

export interface GrupoMarcadores {
  titulo: string;
  bucle?: string;
  marcadores: { clave: string; descripcion: string; ejemplo: string }[];
}

export interface PlantillasResp {
  plantillas: Plantilla[];
  marcadores: GrupoMarcadores[];
  /** False when the server has no PDF converter: filled Word files are delivered. */
  pdfDisponible: boolean;
}

export interface Marca {
  nombreEmpresa: string;
  razonSocial: string;
  nit: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  representanteLegal: string;
  cargoRepresentante: string;
  colorPrimario: string;
  clausulas: string;
  piePagina: string;
  /** Penalty clause: off unless the company sets it and writes the text. */
  penalidadActiva: boolean;
  /** % per day of delay. */
  penalidadDiaria: number | null;
  /** Cap, % of the contract value. */
  penalidadTope: number | null;
  penalidadDiasGracia: number;
  penalidadBase: "HITO" | "CONTRATO";
  penalidadTexto: string;
  tieneLogo: boolean;
  logoUrl: string | null;
}

export type CamposMarca = Omit<Marca, "nombreEmpresa" | "tieneLogo" | "logoUrl">;

/** Validation problems returned when a template is rejected. */
export function erroresPlantilla(err: unknown): string[] {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { errores?: unknown } | undefined;
    if (Array.isArray(data?.errores)) return data.errores.map(String);
  }
  return [];
}

export async function fetchPlantillas(): Promise<PlantillasResp> {
  const { data } = await api.get<PlantillasResp>("/plantillas");
  return data;
}

export async function subirPlantilla(file: File, datos: { nombre: string; tipo: TipoPlantilla; categoria?: string }): Promise<Plantilla> {
  if (!/\.docx$/i.test(file.name)) throw new Error("Sube la plantilla en formato Word (.docx).");
  if (file.size > 10 * 1024 * 1024) throw new Error("La plantilla no puede pasar de 10 MB.");
  const { data: subida } = await api.post<{ path: string; token: string }>("/plantillas/upload-url", { filename: file.name, tamanoBytes: file.size });
  await uploadToSignedUrl(BUCKET, subida.path, subida.token, file);
  const { data } = await api.post<Plantilla>("/plantillas", {
    path: subida.path,
    archivoNombre: file.name,
    tamanoBytes: file.size,
    nombre: datos.nombre,
    tipo: datos.tipo,
    categoria: datos.categoria || undefined,
  });
  return data;
}

export async function activarPlantilla(id: string, activa: boolean): Promise<PlantillasResp> {
  const { data } = await api.patch<PlantillasResp>(`/plantillas/${id}`, { activa });
  return data;
}

export async function eliminarPlantilla(id: string) {
  await api.delete(`/plantillas/${id}`);
}

export async function urlPlantilla(id: string): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/plantillas/${id}/url`);
  return data.url;
}

function nombreDe(disposition: string | undefined, porDefecto: string) {
  return /filename="?([^";]+)"?/.exec(disposition ?? "")?.[1] ?? porDefecto;
}

/** Saves (or opens, for a PDF) a file the API streams back. */
function entregar(blob: Blob, nombre: string, abrir: boolean) {
  const url = URL.createObjectURL(blob);
  if (abrir) {
    window.open(url, "_blank", "noopener");
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function descargarEjemplo(tipo: TipoPlantilla) {
  const res = await api.get<Blob>("/plantillas/ejemplo", { params: { tipo }, responseType: "blob" });
  entregar(res.data, nombreDe(res.headers["content-disposition"] as string | undefined, "plantilla.docx"), false);
}

/** Preview filled with the latest real contract of that kind (or sample data). */
export async function vistaPrevia(id: string, formato: "pdf" | "docx"): Promise<{ conDatosReales: boolean; formato: "pdf" | "docx" }> {
  const res = await api.get<Blob>(`/plantillas/${id}/vista-previa`, { params: { formato }, responseType: "blob" });
  const nombre = nombreDe(res.headers["content-disposition"] as string | undefined, `vista-previa.${formato}`);
  const esPdf = nombre.endsWith(".pdf");
  entregar(res.data, nombre, esPdf);
  return { conDatosReales: res.headers["x-datos-reales"] === "1", formato: esPdf ? "pdf" : "docx" };
}

export async function fetchMarca(): Promise<Marca> {
  const { data } = await api.get<Marca>("/plantillas/marca");
  return data;
}

export async function guardarMarca(campos: Partial<CamposMarca>): Promise<Marca> {
  const { data } = await api.put<Marca>("/plantillas/marca", campos);
  return data;
}

export async function subirLogo(file: File): Promise<Marca> {
  if (!/\.(png|jpe?g|webp)$/i.test(file.name)) throw new Error("El logo debe ser PNG, JPG o WebP.");
  if (file.size > 2 * 1024 * 1024) throw new Error("El logo no puede pasar de 2 MB.");
  const { data: subida } = await api.post<{ path: string; token: string }>("/plantillas/marca/logo/upload-url", { filename: file.name, tamanoBytes: file.size });
  await uploadToSignedUrl(BUCKET, subida.path, subida.token, file);
  const { data } = await api.put<Marca>("/plantillas/marca/logo", { path: subida.path });
  return data;
}

export async function quitarLogo(): Promise<Marca> {
  const { data } = await api.delete<Marca>("/plantillas/marca/logo");
  return data;
}
