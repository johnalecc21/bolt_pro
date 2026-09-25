import { api } from "@/lib/api/http";

export type ModoIntegracion = "ARCHIVO" | "WEBHOOK" | "SIIGO";

/** What Siigo can receive: it has no purchase-order or receipt API. */
export const TIPOS_SIIGO: TipoEventoErp[] = ["PROVEEDOR", "FACTURA", "PAGO"];

export const MODO_LABEL: Record<ModoIntegracion, string> = {
  ARCHIVO: "archivo",
  WEBHOOK: "webhook",
  SIIGO: "Siigo",
};

export interface ConfigSiigo {
  usuario?: string;
  documentoCompraId?: number | null;
  formaPagoCompraId?: number | null;
  cuentaDefecto?: string | null;
  impuestoId?: number | null;
  documentoEgresoId?: number | null;
  formaPagoEgresoId?: number | null;
  departamento?: string;
  ciudad?: string;
  responsabilidadFiscal?: string;
  pagosDesde?: "PROCUREX" | "SIIGO";
}

export interface OpcionSiigo {
  id: number;
  nombre: string;
  codigo?: string | null;
}

export interface CatalogosSiigo {
  documentosCompra: OpcionSiigo[];
  documentosEgreso: OpcionSiigo[];
  formasPagoCompra: (OpcionSiigo & { tipo: string | null; conVencimiento: boolean })[];
  formasPagoEgreso: (OpcionSiigo & { tipo: string | null })[];
  centrosCosto: OpcionSiigo[];
  impuestos: (OpcionSiigo & { porcentaje: number | null })[];
}
export type TipoEventoErp = "PROVEEDOR" | "ORDEN_COMPRA" | "RECEPCION" | "FACTURA" | "PAGO";
export type EstadoEventoErp = "PENDIENTE" | "ENVIADO" | "ERROR" | "FALLIDO" | "DESCARTADO";

export const TIPO_EVENTO_LABEL: Record<TipoEventoErp, string> = {
  PROVEEDOR: "Tercero (proveedor)",
  ORDEN_COMPRA: "Orden de compra",
  RECEPCION: "Recepción",
  FACTURA: "Factura aprobada",
  PAGO: "Pago",
};

export const ESTADO_EVENTO_LABEL: Record<EstadoEventoErp, string> = {
  PENDIENTE: "Pendiente",
  ENVIADO: "Sincronizado",
  ERROR: "Error (reintentará)",
  FALLIDO: "Fallido",
  DESCARTADO: "Descartado",
};

export interface IntegracionErp {
  activa: boolean;
  modo: ModoIntegracion;
  sistema: string | null;
  webhookUrl: string | null;
  tieneSecreto: boolean;
  apiKeyPrefijo: string | null;
  eventos: TipoEventoErp[];
  ultimaPrueba: string | null;
  ultimaPruebaOk: boolean | null;
  ultimaPruebaMsg: string | null;
  siigo: ConfigSiigo;
  siigoTieneCredencial: boolean;
  siigoFaltantes: string[];
  conteo: Partial<Record<EstadoEventoErp, number>>;
}

export interface EventoErp {
  id: string;
  tipo: TipoEventoErp;
  entidadId: string;
  referencia: string;
  version: number;
  estado: EstadoEventoErp;
  intentos: number;
  proximoIntento: string;
  ultimoError: string | null;
  idExterno: string | null;
  referenciaExterna: string | null;
  enviadoAt: string | null;
  updatedAt: string;
}

export type FilaErp = Record<string, string | number | boolean | null>;
export interface HojasErp {
  terceros: FilaErp[];
  ordenes: FilaErp[];
  lineas: FilaErp[];
  recepciones: FilaErp[];
  facturas: FilaErp[];
  pagos: FilaErp[];
}

export interface Mapeo {
  valorLocal: string;
  nombre: string;
  activo: boolean;
  valorErp: string;
}

export async function fetchIntegracion(): Promise<IntegracionErp> {
  const { data } = await api.get<IntegracionErp>("/integraciones/erp");
  return data;
}

export type CambiosIntegracion = Partial<Pick<IntegracionErp, "activa" | "modo" | "sistema" | "webhookUrl" | "eventos" | "siigo">> & {
  /** Write-only. */
  siigoAccessKey?: string;
};

export async function actualizarIntegracion(cambios: CambiosIntegracion) {
  const { data } = await api.patch<IntegracionErp>("/integraciones/erp", cambios);
  return data;
}

export async function generarSecreto(): Promise<string> {
  const { data } = await api.post<{ secreto: string }>("/integraciones/erp/secreto");
  return data.secreto;
}

export async function generarApiKey(): Promise<string> {
  const { data } = await api.post<{ apiKey: string }>("/integraciones/erp/api-key");
  return data.apiKey;
}

export async function probarConexion(): Promise<{ ok: boolean; mensaje: string }> {
  const { data } = await api.post<{ ok: boolean; mensaje: string }>("/integraciones/erp/probar");
  return data;
}

export async function fetchCatalogosSiigo(): Promise<CatalogosSiigo> {
  const { data } = await api.get<CatalogosSiigo>("/integraciones/erp/siigo/catalogos");
  return data;
}

export async function sincronizarPagosSiigo(): Promise<{ revisadas: number; pagadas: number; errores: string[] }> {
  const { data } = await api.post("/integraciones/erp/siigo/sincronizar-pagos");
  return data;
}

export async function fetchEventos(params: { estado?: EstadoEventoErp; tipo?: TipoEventoErp; page?: number }) {
  const { data } = await api.get<{ items: EventoErp[]; total: number; page: number; totalPages: number }>("/integraciones/erp/eventos", { params });
  return data;
}

export async function fetchEvento(id: string): Promise<EventoErp & { payload: unknown }> {
  const { data } = await api.get(`/integraciones/erp/eventos/${id}`);
  return data;
}

export async function reintentarEvento(id: string): Promise<EventoErp> {
  const { data } = await api.post<EventoErp>(`/integraciones/erp/eventos/${id}/reintentar`);
  return data;
}

export async function descartarEvento(id: string) {
  await api.post(`/integraciones/erp/eventos/${id}/descartar`);
}

export async function fetchPendientes(): Promise<{ ids: string[]; hojas: HojasErp; truncado: boolean }> {
  const { data } = await api.get("/integraciones/erp/eventos/pendientes");
  return data;
}

export async function marcarExportados(ids: string[]): Promise<number> {
  const { data } = await api.post<{ marcados: number }>("/integraciones/erp/eventos/exportados", { ids });
  return data.marcados;
}

export async function fetchExportacion(desde: string, hasta: string): Promise<HojasErp & { truncado: boolean }> {
  const { data } = await api.get("/integraciones/erp/exportacion", { params: { desde, hasta } });
  return data;
}

export async function fetchMapeos(): Promise<{ centros: Mapeo[]; categorias: Mapeo[] }> {
  const { data } = await api.get("/integraciones/erp/mapeos");
  return data;
}

export async function guardarMapeos(mapeos: { tipo: "CENTRO_COSTO" | "CATEGORIA"; valorLocal: string; valorErp: string }[]) {
  const { data } = await api.put<{ centros: Mapeo[]; categorias: Mapeo[] }>("/integraciones/erp/mapeos", { mapeos });
  return data;
}

export interface EstadoDocumentoErp {
  entidadId: string;
  tipo: TipoEventoErp;
  estado: EstadoEventoErp;
  idExterno: string | null;
  referenciaExterna: string | null;
  ultimoError: string | null;
  enviadoAt: string | null;
}

export async function fetchEstadoErp(ids: string[]): Promise<EstadoDocumentoErp[]> {
  if (ids.length === 0) return [];
  const { data } = await api.get<EstadoDocumentoErp[]>("/integraciones/erp/estado", { params: { ids: ids.join(",") } });
  return data;
}
