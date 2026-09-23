import { api } from "@/lib/api/http";
import { assertFileSizeOk, uploadToSignedUrl } from "@/lib/api/storage";

const BUCKET = "homologacion-documentos";

export type EstadoHomologacion = "borrador" | "en_revision" | "aprobado" | "rechazado" | "zona_gris";
export type EstadoDocumento = "pendiente" | "subido" | "validado" | "vencido";
export type CategoriaDocumento = "legal" | "financiero" | "certificaciones" | "referencias";
export type NivelRiesgo = "bajo" | "medio" | "alto" | "critico";

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

/** Mirrors NIVEL_RIESGO_INFO on the backend — labels only, the actual periodicity/tier is computed server-side. */
export const NIVEL_RIESGO_INFO: Record<NivelRiesgo, { label: string; aprobacionesRequeridas: string[]; reevaluacion: string }> = {
  bajo: { label: "Bajo", aprobacionesRequeridas: ["Compras"], reevaluacion: "Anual" },
  medio: { label: "Medio", aprobacionesRequeridas: ["Compras", "Finanzas"], reevaluacion: "Semestral" },
  alto: { label: "Alto", aprobacionesRequeridas: ["Compras", "Finanzas", "Legal/Compliance"], reevaluacion: "Trimestral" },
  critico: { label: "Crítico", aprobacionesRequeridas: ["Compras", "Finanzas", "Legal/Compliance", "Dirección/Comité"], reevaluacion: "Mensual" },
};

export interface ScoreDesglose {
  financiero: number;
  legal: number;
  compliance: number;
  tecnico: number;
  operacional: number;
  comercial: number;
}

/** Peso de cada categoría — debe coincidir con HomologacionScoringService.PESOS en el backend. */
export const PESOS_SCORE: Record<keyof ScoreDesglose, number> = {
  financiero: 0.25,
  legal: 0.15,
  compliance: 0.1,
  tecnico: 0.2,
  operacional: 0.15,
  comercial: 0.15,
};

export interface ReferenciaComercial {
  empresa?: string;
  contacto?: string;
  telefono?: string;
  tiempoRelacion?: string;
}

/** Shape of the "Cuestionario de Homologación de Proveedores" — mirrors the backend's HomologacionCuestionario. */
export interface HomologacionCuestionario {
  // 1. Información general
  razonSocial?: string;
  nombreComercial?: string;
  nitRut?: string;
  paisConstitucion?: string;
  direccion?: string;
  ciudadPais?: string;
  telefono?: string;
  correoContacto?: string;
  sitioWeb?: string;
  representanteLegal?: string;
  cargoRepresentante?: string;
  tipoProveedor?: "bienes" | "servicios" | "ambos";
  bienServicioOfrecido?: string;

  // 2. Información legal
  fechaConstitucion?: string;
  numeroMatricula?: string;
  vigenciaMatricula?: string;
  tienePoderes?: boolean;
  esPep?: boolean;
  sancionado?: boolean;
  sancionadoDetalle?: string;
  litigios?: boolean;
  litigiosDetalle?: string;
  listaRestrictiva?: boolean;

  // 3. Información financiera
  ingresosAnioMenos1?: number;
  ingresosAnioMenos2?: number;
  patrimonio?: number;
  endeudamiento?: number;
  entidadBancaria?: string;
  cuentaBancaria?: string;
  tieneEstadosFinancierosAuditados?: boolean;
  firmaAuditora?: string;

  // 4. Información comercial y referencias
  referencias?: ReferenciaComercial[];

  // 5. Experiencia y capacidad operativa
  aniosExperienciaMercado?: number;
  aniosExperienciaBienServicio?: number;
  numeroEmpleados?: number;
  capacidadInstalada?: string;
  coberturaGeografica?: string;
  proyectosSimilares?: string;
  subcontrata?: boolean;
  subcontrataDetalle?: string;

  // 6. Seguridad, calidad y compliance
  politicaSst?: boolean;
  polizasVigentes?: boolean;
  polizasVigenciaDetalle?: string;
  certificacionesCalidad?: boolean;
  certificacionesCalidadCuales?: string;
  politicaAnticorrupcion?: boolean;
  politicaProteccionDatos?: boolean;
  incidentesGraves?: boolean;
  incidentesDetalle?: string;

  // 8. Declaración y firma
  declaracionAceptada?: boolean;
  firmanteNombre?: string;
  firmanteCargo?: string;
  firmaFecha?: string;
}

export interface RegistroHomologacion {
  id: string;
  estado: EstadoHomologacion;
  score: number;
  scoreDesglose: ScoreDesglose | null;
  nivelRiesgo: NivelRiesgo | null;
  alertas: string[];
  observaciones: string | null;
  fechaSolicitud: string;
  proximaRevalidacion: string;
  nitDetectado: string | null;
  documentos: DocumentoHomologacion[];
  cuestionario: HomologacionCuestionario;
}

interface ApiHomologacion {
  id: string;
  estado: "BORRADOR" | "EN_REVISION" | "APROBADO" | "RECHAZADO" | "ZONA_GRIS";
  score: number;
  scoreDesglose: ScoreDesglose | null;
  nivelRiesgo: "BAJO" | "MEDIO" | "ALTO" | "CRITICO" | null;
  alertas: string[];
  observaciones: string | null;
  fechaSolicitud: string;
  proximaRevalidacion: string | null;
  nitDetectado: string | null;
  cuestionario: HomologacionCuestionario | null;
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
    scoreDesglose: h.scoreDesglose,
    nivelRiesgo: h.nivelRiesgo ? (h.nivelRiesgo.toLowerCase() as NivelRiesgo) : null,
    alertas: h.alertas,
    observaciones: h.observaciones,
    fechaSolicitud: h.fechaSolicitud.slice(0, 10),
    proximaRevalidacion: h.proximaRevalidacion ? h.proximaRevalidacion.slice(0, 10) : "—",
    nitDetectado: h.nitDetectado,
    cuestionario: h.cuestionario ?? {},
    documentos: h.documentos.map((d) => ({
      id: d.id,
      nombre: d.nombre,
      categoria: d.categoria.toLowerCase() as CategoriaDocumento,
      estado: d.estado.toLowerCase() as EstadoDocumento,
    })),
  };
}

/** Campos mínimos exigidos antes de enviar a validación — mirrors CUESTIONARIO_REQUIRED_FIELDS on the backend. */
const CUESTIONARIO_REQUIRED_FIELDS: { key: keyof HomologacionCuestionario; label: string }[] = [
  { key: "razonSocial", label: "Razón social" },
  { key: "nitRut", label: "NIT / RUT / Tax ID" },
  { key: "representanteLegal", label: "Representante legal" },
  { key: "tipoProveedor", label: "Tipo de proveedor" },
  { key: "bienServicioOfrecido", label: "Bien o servicio ofrecido" },
  { key: "fechaConstitucion", label: "Fecha de constitución de la empresa" },
  { key: "numeroMatricula", label: "N° de matrícula / Cámara de Comercio" },
  { key: "esPep", label: "¿Es Persona Expuesta Políticamente (PEP)?" },
  { key: "sancionado", label: "¿Ha sido sancionada en los últimos 5 años?" },
  { key: "litigios", label: "¿Existen litigios en curso?" },
  { key: "listaRestrictiva", label: "¿Aparece en listas restrictivas?" },
  { key: "tieneEstadosFinancierosAuditados", label: "¿Cuenta con estados financieros auditados?" },
  { key: "ingresosAnioMenos1", label: "Ingresos operacionales año -1" },
  { key: "aniosExperienciaMercado", label: "Años de experiencia en el mercado" },
  { key: "numeroEmpleados", label: "N° de empleados" },
  { key: "coberturaGeografica", label: "Cobertura geográfica" },
  { key: "politicaSst", label: "Política de Seguridad y Salud en el Trabajo" },
  { key: "polizasVigentes", label: "Pólizas de responsabilidad civil / cumplimiento" },
  { key: "certificacionesCalidad", label: "Certificaciones de calidad" },
  { key: "politicaAnticorrupcion", label: "Política anticorrupción / antisoborno" },
  { key: "politicaProteccionDatos", label: "Política de protección de datos personales" },
  { key: "incidentesGraves", label: "Incidentes graves en los últimos 3 años" },
  { key: "declaracionAceptada", label: "Declaración y firma" },
  { key: "firmanteNombre", label: "Nombre del firmante" },
];

/** Returns the labels of every required field still missing/unset. Empty array = complete. */
export function camposFaltantesCuestionario(c: HomologacionCuestionario | null | undefined): string[] {
  const cuestionario = c ?? {};
  const faltantes = CUESTIONARIO_REQUIRED_FIELDS.filter(({ key }) => {
    const value = cuestionario[key];
    return value === undefined || value === null || value === "";
  }).map(({ label }) => label);

  const referenciasCompletas = (cuestionario.referencias ?? []).filter(
    (r) => r.empresa?.trim() && r.contacto?.trim() && r.telefono?.trim(),
  ).length;
  if (referenciasCompletas < 3) {
    faltantes.push("Mínimo 3 referencias comerciales completas (empresa, contacto y teléfono)");
  }

  return faltantes;
}

export async function fetchMiHomologacion(): Promise<RegistroHomologacion> {
  const { data } = await api.get<ApiHomologacion>("/homologacion/mine");
  return toRegistro(data);
}

export async function guardarCuestionario(cuestionario: Partial<HomologacionCuestionario>): Promise<RegistroHomologacion> {
  const { data } = await api.patch<ApiHomologacion>("/homologacion/cuestionario", cuestionario);
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

export async function resolverHomologacion(proveedorId: string, estado: "APROBADO" | "RECHAZADO", score?: number, motivo?: string) {
  const { data } = await api.post(`/homologacion/${proveedorId}/resolver`, { estado, score, motivo });
  return data;
}

export async function solicitarInfoHomologacion(proveedorId: string, mensaje: string) {
  const { data } = await api.post(`/homologacion/${proveedorId}/solicitar-info`, { mensaje });
  return data;
}
