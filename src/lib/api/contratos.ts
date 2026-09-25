import { api } from "@/lib/api/http";
import { assertFileSizeOk, uploadToSignedUrl } from "@/lib/api/storage";
import { formatContratoCodigo } from "@/lib/codigo";
import type { Contrato } from "@/lib/types";
import type { Moneda } from "@/lib/moneda";
import { mapPaginado, type Paginado } from "@/lib/api/paginacion";
import { mapHito, type ApiHito, type EstadoContratoApi, type Hito } from "@/lib/api/seguimiento";

const BUCKET = "contratos-documentos";

type TipoApi = "CONTRATO" | "PO" | "ADDENDUM";

interface ApiContrato {
  id: string;
  numero: number;
  tipo: TipoApi;
  proveedorNombre: string;
  categoria: string;
  monto: number;
  moneda: Moneda;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: EstadoContratoApi;
  companyId: string;
  archivoNombre: string | null;
  hijas?: { id: string; monto: number; estado: EstadoContratoApi }[];
  condicionesPagoDias: number;
  esMarco?: boolean;
  saldoMarco?: number | null;
  padreCodigo?: string | null;
}

const TIPO_LABEL: Record<TipoApi, Contrato["tipo"]> = {
  CONTRATO: "Contrato",
  PO: "PO",
  ADDENDUM: "Addendum",
};

export const ESTADO_CONTRATO_LABEL: Record<EstadoContratoApi, Contrato["estado"]> = {
  ACTIVO: "Activo",
  POR_VENCER: "Por vencer",
  VENCIDO: "Vencido",
  EN_RENOVACION: "En renovación",
  TERMINADO: "Terminado",
};

function toContrato(c: ApiContrato): Contrato {
  return {
    id: c.id,
    codigo: formatContratoCodigo(c.tipo, c.numero),
    tipo: TIPO_LABEL[c.tipo],
    proveedor: c.proveedorNombre,
    categoria: c.categoria,
    monto: c.monto,
    moneda: c.moneda,
    vigenciaInicio: c.vigenciaInicio.slice(0, 10),
    vigenciaFin: c.vigenciaFin.slice(0, 10),
    estado: ESTADO_CONTRATO_LABEL[c.estado],
    companyId: c.companyId,
    archivoNombre: c.archivoNombre,
    hijas: c.hijas?.map((h) => ({ id: h.id, monto: h.monto, estado: ESTADO_CONTRATO_LABEL[h.estado] })),
    condicionesPagoDias: c.condicionesPagoDias,
    esMarco: c.esMarco,
    saldoMarco: c.saldoMarco ?? null,
    padreCodigo: c.padreCodigo ?? null,
  };
}

/** Server-side paginated list for the Contratos screen. */
export async function fetchContratosPagina(params: {
  page: number;
  limit?: number;
  q?: string;
  categoria?: string;
  estado?: EstadoContratoApi;
}): Promise<Paginado<Contrato>> {
  const { data } = await api.get<Paginado<ApiContrato>>("/contratos/pagina", {
    params: {
      page: params.page,
      limit: params.limit ?? 20,
      ...(params.q ? { q: params.q } : {}),
      ...(params.categoria && params.categoria !== "Todas" ? { categoria: params.categoria } : {}),
      ...(params.estado ? { estado: params.estado } : {}),
    },
  });
  return mapPaginado(data, toContrato);
}

/** Contracts still in force (expiry reminders). */
export async function fetchContratosVigentes(): Promise<Contrato[]> {
  const { data } = await api.get<ApiContrato[]>("/contratos");
  return data.map(toContrato);
}

export async function fetchCategoriasContratos(): Promise<string[]> {
  const { data } = await api.get<string[]>("/contratos/categorias");
  return data;
}

// ------------------------------------------------------------------ ficha

export interface MarcaPdf {
  razonSocial: string | null;
  nit: string | null;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
  representanteLegal: string | null;
  cargoRepresentante: string | null;
  colorPrimario: string | null;
  clausulas: string | null;
  piePagina: string | null;
  /** The company's own penalty clause; null = it has none (nothing printed or estimated). */
  penalidad: ReglaPenalidad | null;
  logoUrl: string | null;
}

export interface ReglaPenalidad {
  /** % per day of delay (0.5 = 0,5 %). */
  diaria: number;
  /** Cap, % of the contract value. */
  tope: number;
  diasGracia: number;
  base: "HITO" | "CONTRATO";
  texto: string;
}

export type TipoModificacion = "PRORROGA" | "MONTO" | "TERMINACION";

export interface FichaContrato extends Contrato {
  tipoApi: TipoApi;
  estadoApi: EstadoContratoApi;
  cliente: string;
  proveedorId: string | null;
  centroCosto: string | null;
  operativo: boolean;
  esMarco: boolean;
  saldoMarco: number | null;
  porcentajeAsignado: number;
  poId: string | null;
  objeto?: string;
  garantiaMeses?: number;
  plazoDias?: number;
  terminadoAt: string | null;
  motivoTerminacion: string | null;
  firmado: string;
  hitos: Hito[];
  lineas: { descripcion: string; unidad: string; cantidad: number; precioUnitario: number; subtotal: number }[];
  requerimiento: { id: string; codigo: string; titulo: string } | null;
  padre: { id: string; codigo: string; monto: number; vigenciaFin: string; saldo: number } | null;
  hijas: { id: string; codigo: string; monto: number; estado: Contrato["estado"]; vigenciaInicio: string; vigenciaFin: string; pagado: number }[];
  pagos: {
    id: string;
    concepto: string | null;
    monto: number;
    montoNeto: number;
    estado: "pendiente" | "pagado" | "vencido";
    fechaPagoPactada: string;
    fechaPago: string | null;
    factura: { numero: string; estado: "radicada" | "aprobada" | "rechazada" } | null;
  }[];
  resumenPagos: { liberado: number; pagado: number; pendiente: number };
  modificaciones: {
    id: string;
    tipo: TipoModificacion;
    motivo: string;
    vigenciaAntes: string | null;
    vigenciaDespues: string | null;
    montoAntes: number | null;
    montoDespues: number | null;
    usuario: string;
    fecha: string;
  }[];
  versiones: { id: string; nombre: string; tamanoBytes: number | null; subidoPor: string; origen: "MANUAL" | "PLANTILLA"; editable: boolean; fecha: string }[];
  /** The buyer's letterhead for the Procurex PDF (null if never set). */
  marca: MarcaPdf | null;
  /** A company template applies: the document can be regenerated from it. */
  plantillaActiva: boolean;
  evaluaciones: { id: string; puntaje: number; calidad: number; plazos: number; servicio: number; hse: number; comentario: string | null; requierePlanMejora: boolean; fecha: string }[];
}

interface ApiFicha extends ApiContrato {
  codigo: string;
  cliente: string;
  proveedorId: string | null;
  centroCosto: { codigo: string; nombre: string } | null;
  operativo: boolean;
  esMarco: boolean;
  saldoMarco: number | null;
  porcentajeAsignado: number;
  poId: string | null;
  terminadoAt: string | null;
  motivoTerminacion: string | null;
  createdAt: string;
  hitos: ApiHito[];
  lineas: FichaContrato["lineas"];
  requerimiento: { id: string; codigo: string; titulo: string; descripcion: string | null; adjudicacion: { garantiaMeses: number; plazoDias: number } | null } | null;
  padre: { id: string; codigo: string; monto: number; vigenciaFin: string; saldo: number } | null;
  hijas: { id: string; codigo: string; monto: number; estado: EstadoContratoApi; vigenciaInicio: string; vigenciaFin: string; pagado: number }[];
  pagos: (Omit<FichaContrato["pagos"][number], "estado" | "factura"> & {
    estado: "PENDIENTE" | "PAGADO" | "VENCIDO";
    factura: { numero: string; estado: "RADICADA" | "APROBADA" | "RECHAZADA" } | null;
  })[];
  resumenPagos: FichaContrato["resumenPagos"];
  modificaciones: (Omit<FichaContrato["modificaciones"][number], "fecha"> & { createdAt: string })[];
  versiones: (Omit<FichaContrato["versiones"][number], "fecha" | "origen" | "editable"> & { createdAt: string; origen?: "MANUAL" | "PLANTILLA"; editable?: boolean })[];
  evaluaciones: (Omit<FichaContrato["evaluaciones"][number], "fecha"> & { createdAt: string })[];
  marca?: MarcaPdf | null;
  plantillaActiva?: boolean;
}

const d10 = (s: string | null) => (s ? s.slice(0, 10) : null);

function toFicha(c: ApiFicha): FichaContrato {
  const req = c.requerimiento;
  return {
    ...toContrato(c),
    codigo: c.codigo,
    tipoApi: c.tipo,
    estadoApi: c.estado,
    cliente: c.cliente,
    proveedorId: c.proveedorId,
    centroCosto: c.centroCosto ? `${c.centroCosto.codigo} — ${c.centroCosto.nombre}` : null,
    operativo: c.operativo,
    esMarco: c.esMarco,
    saldoMarco: c.saldoMarco,
    porcentajeAsignado: c.porcentajeAsignado,
    poId: c.poId,
    objeto: req ? req.descripcion || req.titulo : undefined,
    garantiaMeses: req?.adjudicacion?.garantiaMeses,
    plazoDias: req?.adjudicacion?.plazoDias,
    terminadoAt: d10(c.terminadoAt),
    motivoTerminacion: c.motivoTerminacion,
    firmado: c.createdAt.slice(0, 10),
    hitos: c.hitos.map(mapHito),
    lineas: c.lineas,
    requerimiento: req ? { id: req.id, codigo: req.codigo, titulo: req.titulo } : null,
    padre: c.padre ? { ...c.padre, vigenciaFin: c.padre.vigenciaFin.slice(0, 10) } : null,
    hijas: c.hijas.map((h) => ({
      ...h,
      estado: ESTADO_CONTRATO_LABEL[h.estado],
      vigenciaInicio: h.vigenciaInicio.slice(0, 10),
      vigenciaFin: h.vigenciaFin.slice(0, 10),
    })),
    pagos: c.pagos.map((p) => ({
      ...p,
      estado: p.estado.toLowerCase() as FichaContrato["pagos"][number]["estado"],
      fechaPagoPactada: p.fechaPagoPactada.slice(0, 10),
      fechaPago: d10(p.fechaPago),
      factura: p.factura ? { numero: p.factura.numero, estado: p.factura.estado.toLowerCase() as "radicada" | "aprobada" | "rechazada" } : null,
    })),
    resumenPagos: c.resumenPagos,
    modificaciones: c.modificaciones.map(({ createdAt, ...m }) => ({
      ...m,
      vigenciaAntes: d10(m.vigenciaAntes),
      vigenciaDespues: d10(m.vigenciaDespues),
      fecha: createdAt,
    })),
    versiones: c.versiones.map(({ createdAt, ...v }) => ({ ...v, origen: v.origen ?? "MANUAL", editable: !!v.editable, fecha: createdAt })),
    marca: c.marca ?? null,
    plantillaActiva: !!c.plantillaActiva,
    evaluaciones: c.evaluaciones.map(({ createdAt, ...e }) => ({ ...e, fecha: createdAt })),
  };
}

export async function fetchFichaContrato(id: string): Promise<FichaContrato> {
  const { data } = await api.get<ApiFicha>(`/contratos/${id}`);
  return toFicha(data);
}

export async function fetchMiFichaContrato(id: string): Promise<FichaContrato> {
  const { data } = await api.get<ApiFicha>(`/contratos/mine/${id}`);
  return toFicha(data);
}

// ------------------------------------------------------------- proveedor

export interface ContratoConHitos extends Contrato {
  cliente?: string;
  objeto?: string;
  garantiaMeses?: number;
  plazoDias?: number;
  hitos: Hito[];
}

interface ApiContratoMine extends ApiContrato {
  company: { nombre: string };
  hitos: ApiHito[];
  requerimiento?: { titulo: string; descripcion: string | null; adjudicacion: { garantiaMeses: number; plazoDias: number } | null } | null;
}

export async function fetchMisContratos(): Promise<ContratoConHitos[]> {
  const { data } = await api.get<ApiContratoMine[]>("/contratos/mine");
  return data.map((c) => ({
    ...toContrato(c),
    cliente: c.company.nombre,
    objeto: c.requerimiento ? c.requerimiento.descripcion || c.requerimiento.titulo : undefined,
    garantiaMeses: c.requerimiento?.adjudicacion?.garantiaMeses,
    plazoDias: c.requerimiento?.adjudicacion?.plazoDias,
    hitos: c.hitos.map(mapHito),
  }));
}

export async function reportarAvance(contratoId: string, hitoId: string, nota: string) {
  const { data } = await api.post(`/contratos/mine/${contratoId}/hitos/${hitoId}/avance`, { nota });
  return data;
}

// --------------------------------------------------------------- acciones

/** Each upload is a new version of the company's own PO/contract file; the latest is the one downloaded. */
export async function subirArchivoContrato(id: string, file: File) {
  assertFileSizeOk(file);
  const { data: uploadUrlData } = await api.post<{ path: string; token: string }>(`/contratos/${id}/upload-url`, {
    filename: file.name,
    tamanoBytes: file.size,
  });
  await uploadToSignedUrl(BUCKET, uploadUrlData.path, uploadUrlData.token, file);
  const { data } = await api.post(`/contratos/${id}/adjuntar`, { path: uploadUrlData.path, nombre: file.name, tamanoBytes: file.size });
  return data;
}

export async function obtenerUrlArchivoContrato(id: string): Promise<{ url: string; nombre: string | null }> {
  const { data } = await api.get<{ url: string; nombre: string | null }>(`/contratos/${id}/archivo-url`);
  return data;
}

export async function obtenerUrlVersion(id: string, versionId: string, editable = false): Promise<{ url: string; nombre: string }> {
  const { data } = await api.get<{ url: string; nombre: string }>(`/contratos/${id}/versiones/${versionId}/url`, { params: editable ? { editable: 1 } : undefined });
  return data;
}

/** Fills the company's active template again with the current data. */
export async function regenerarDocumento(id: string) {
  const { data } = await api.post(`/contratos/${id}/documento/regenerar`);
  return data;
}

/** A PO against a Contrato Marco, within its remaining ceiling and validity. */
export async function emitirPo(contratoPadreId: string, payload: { monto: number; vigenciaInicio: string; vigenciaFin: string }): Promise<Contrato> {
  const { data } = await api.post<ApiContrato>(`/contratos/${contratoPadreId}/emitir-po`, payload);
  return toContrato(data);
}

export async function prorrogarContrato(id: string, vigenciaFin: string, motivo: string) {
  const { data } = await api.post(`/contratos/${id}/prorrogar`, { vigenciaFin, motivo });
  return data;
}

export async function cambiarMontoContrato(id: string, monto: number, motivo: string) {
  const { data } = await api.post(`/contratos/${id}/monto`, { monto, motivo });
  return data;
}

export async function terminarContrato(id: string, motivo: string) {
  const { data } = await api.post(`/contratos/${id}/terminar`, { motivo });
  return data;
}
