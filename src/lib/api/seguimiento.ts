import { api } from "@/lib/api/http";
import { formatContratoCodigo } from "@/lib/codigo";
import type { Moneda } from "@/lib/moneda";

export type EstadoHito = "completado" | "en_riesgo" | "atrasado" | "pendiente";

export interface Hito {
  id: string;
  label: string;
  comprometido: string;
  real: string | null;
  /** Already reflects the dates: past due = atrasado, due within 3 days = en riesgo. */
  estado: EstadoHito;
  porcentaje: number;
  pagoGeneradoId: string | null;
  /** What the proveedor reported about it (delivered, progress…). */
  avanceProveedor: string | null;
  avanceReportadoAt: string | null;
}

export interface ApiHito {
  id: string;
  label: string;
  comprometido: string;
  real: string | null;
  estado: "COMPLETADO" | "EN_RIESGO" | "ATRASADO" | "PENDIENTE";
  porcentaje: number;
  pagoGeneradoId: string | null;
  avanceProveedor?: string | null;
  avanceReportadoAt?: string | null;
}

export function mapHito(h: ApiHito): Hito {
  return {
    id: h.id,
    label: h.label,
    comprometido: h.comprometido.slice(0, 10),
    real: h.real ? h.real.slice(0, 10) : null,
    estado: h.estado.toLowerCase() as EstadoHito,
    porcentaje: h.porcentaje,
    pagoGeneradoId: h.pagoGeneradoId,
    avanceProveedor: h.avanceProveedor ?? null,
    avanceReportadoAt: h.avanceReportadoAt ?? null,
  };
}

export type EstadoContratoApi = "ACTIVO" | "POR_VENCER" | "VENCIDO" | "EN_RENOVACION" | "TERMINADO";

export interface SeguimientoContrato {
  id: string;
  codigo: string;
  proveedor: string;
  categoria: string;
  monto: number;
  moneda: Moneda;
  estado: EstadoContratoApi;
  esMarco: boolean;
  porcentajeAsignado: number;
  vigenciaFin: string;
  hitos: Hito[];
}

interface ApiContratoConHitos {
  id: string;
  numero: number;
  tipo: "CONTRATO" | "PO" | "ADDENDUM";
  proveedorNombre: string;
  categoria: string;
  monto: number;
  moneda: Moneda;
  estado: EstadoContratoApi;
  esMarco: boolean;
  porcentajeAsignado: number;
  vigenciaFin: string;
  hitos: ApiHito[];
}

export async function fetchSeguimiento(): Promise<SeguimientoContrato[]> {
  const { data } = await api.get<ApiContratoConHitos[]>("/seguimiento");
  return data.map((c) => ({
    id: c.id,
    codigo: formatContratoCodigo(c.tipo, c.numero),
    proveedor: c.proveedorNombre,
    categoria: c.categoria,
    monto: c.monto,
    moneda: c.moneda,
    estado: c.estado,
    esMarco: c.esMarco,
    porcentajeAsignado: c.porcentajeAsignado,
    vigenciaFin: c.vigenciaFin.slice(0, 10),
    hitos: c.hitos.map(mapHito),
  }));
}

export async function crearHito(contratoId: string, label: string, comprometido: string, porcentaje?: number) {
  const { data } = await api.post(`/seguimiento/contratos/${contratoId}/hitos`, { label, comprometido, porcentaje });
  return data;
}

export async function actualizarEstadoHito(hitoId: string, estado: EstadoHito) {
  const { data } = await api.patch(`/seguimiento/hitos/${hitoId}`, { estado: estado.toUpperCase() });
  return data;
}

export async function actualizarPorcentajeHito(hitoId: string, porcentaje: number) {
  const { data } = await api.patch(`/seguimiento/hitos/${hitoId}`, { porcentaje });
  return data;
}

export async function eliminarHito(hitoId: string) {
  const { data } = await api.delete(`/seguimiento/hitos/${hitoId}`);
  return data;
}
