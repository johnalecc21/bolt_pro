import { z } from "zod";
import { api, parseApiResponse } from "@/lib/api/http";
import { assertFileSizeOk, uploadToSignedUrl } from "@/lib/api/storage";
import { monedaSchema, type Moneda } from "@/lib/moneda";

const BUCKET = "facturas-pagos";

export type EstadoFactura = "radicada" | "aprobada" | "rechazada";
export type EstadoProntoPago = "solicitada" | "aceptada" | "rechazada";

export interface Factura {
  id: string;
  numero: string;
  fechaEmision: string;
  monto: number;
  archivoNombre: string;
  estado: EstadoFactura;
  motivoRechazo: string | null;
  revisadaPor: string | null;
  revisadaAt: string | null;
  radicada: string;
}

export interface SolicitudProntoPago {
  id: string;
  fechaPropuesta: string;
  descuentoPct: number;
  montoNeto: number;
  estado: EstadoProntoPago;
  motivo: string | null;
  solicitada: string;
}

/** One payment released by a completed milestone — same shape for both portals. */
export interface PagoPO {
  id: string;
  contratoId: string;
  contratoCodigo: string;
  cliente: string;
  proveedor: string;
  categoria: string;
  concepto: string | null;
  monto: number;
  /** After any early-payment discount. */
  montoNeto: number;
  descuentoProntoPago: number;
  moneda: Moneda;
  fechaEmision: string;
  fechaPagoPactada: string;
  condicionesPagoDias: number;
  estado: "pendiente" | "pagado" | "vencido";
  disputaAbierta: boolean;
  fechaPago: string | null;
  montoPagado: number | null;
  referenciaPago: string | null;
  soporteNombre: string | null;
  pagadoPor: string | null;
  facturaVigente: Factura | null;
  facturas: Factura[];
  prontoPago: SolicitudProntoPago | null;
}

const facturaSchema = z.object({
  id: z.string(),
  numero: z.string(),
  fechaEmision: z.string(),
  monto: z.number(),
  archivoNombre: z.string(),
  estado: z.enum(["RADICADA", "APROBADA", "RECHAZADA"]),
  motivoRechazo: z.string().nullable(),
  revisadaPor: z.string().nullable(),
  revisadaAt: z.string().nullable(),
  createdAt: z.string(),
});

const solicitudSchema = z.object({
  id: z.string(),
  fechaPropuesta: z.string(),
  descuentoPct: z.number(),
  montoNeto: z.number(),
  estado: z.enum(["SOLICITADA", "ACEPTADA", "RECHAZADA"]),
  motivo: z.string().nullable(),
  createdAt: z.string(),
});

const apiPagoSchema = z.object({
  id: z.string(),
  contratoId: z.string(),
  contrato: z.string(),
  cliente: z.string(),
  proveedor: z.string(),
  categoria: z.string(),
  concepto: z.string().nullable(),
  monto: z.number(),
  montoNeto: z.number(),
  descuentoProntoPago: z.number(),
  moneda: monedaSchema,
  fechaEmision: z.string(),
  fechaPagoPactada: z.string(),
  condicionesPagoDias: z.number(),
  estado: z.enum(["PENDIENTE", "PAGADO", "VENCIDO"]),
  disputaAbierta: z.boolean(),
  fechaPago: z.string().nullable(),
  montoPagado: z.number().nullable(),
  referenciaPago: z.string().nullable(),
  soporteNombre: z.string().nullable(),
  pagadoPor: z.string().nullable(),
  facturaVigente: facturaSchema.nullable(),
  facturas: z.array(facturaSchema),
  prontoPago: solicitudSchema.nullable(),
});
type ApiPago = z.infer<typeof apiPagoSchema>;

const toFactura = (f: z.infer<typeof facturaSchema>): Factura => ({
  id: f.id,
  numero: f.numero,
  fechaEmision: f.fechaEmision,
  monto: f.monto,
  archivoNombre: f.archivoNombre,
  estado: f.estado.toLowerCase() as EstadoFactura,
  motivoRechazo: f.motivoRechazo,
  revisadaPor: f.revisadaPor,
  revisadaAt: f.revisadaAt,
  radicada: f.createdAt,
});

function toPago(p: ApiPago): PagoPO {
  return {
    id: p.id,
    contratoId: p.contratoId,
    contratoCodigo: p.contrato,
    cliente: p.cliente,
    proveedor: p.proveedor,
    categoria: p.categoria,
    concepto: p.concepto,
    monto: p.monto,
    montoNeto: p.montoNeto,
    descuentoProntoPago: p.descuentoProntoPago,
    moneda: p.moneda,
    fechaEmision: p.fechaEmision,
    fechaPagoPactada: p.fechaPagoPactada,
    condicionesPagoDias: p.condicionesPagoDias,
    estado: p.estado.toLowerCase() as PagoPO["estado"],
    disputaAbierta: p.disputaAbierta,
    fechaPago: p.fechaPago,
    montoPagado: p.montoPagado,
    referenciaPago: p.referenciaPago,
    soporteNombre: p.soporteNombre,
    pagadoPor: p.pagadoPor,
    facturaVigente: p.facturaVigente ? toFactura(p.facturaVigente) : null,
    facturas: p.facturas.map(toFactura),
    prontoPago: p.prontoPago
      ? {
          id: p.prontoPago.id,
          fechaPropuesta: p.prontoPago.fechaPropuesta,
          descuentoPct: p.prontoPago.descuentoPct,
          montoNeto: p.prontoPago.montoNeto,
          estado: p.prontoPago.estado.toLowerCase() as EstadoProntoPago,
          motivo: p.prontoPago.motivo,
          solicitada: p.prontoPago.createdAt,
        }
      : null,
  };
}

/** Where a payment stands, in the words both sides use. */
export type EtapaPago = "sin_factura" | "factura_rechazada" | "factura_en_revision" | "por_pagar" | "vencido" | "pagado";

export function etapaPago(p: PagoPO): EtapaPago {
  if (p.estado === "pagado") return "pagado";
  if (!p.facturaVigente) return p.facturas.some((f) => f.estado === "rechazada") ? "factura_rechazada" : "sin_factura";
  if (p.facturaVigente.estado === "radicada") return "factura_en_revision";
  return p.estado === "vencido" ? "vencido" : "por_pagar";
}

export const ETAPA_LABEL: Record<EtapaPago, string> = {
  sin_factura: "Sin factura",
  factura_rechazada: "Factura rechazada",
  factura_en_revision: "Factura en revisión",
  por_pagar: "Por pagar",
  vencido: "Vencido",
  pagado: "Pagado",
};

// ---------------------------------------------------------------- proveedor

export async function fetchMisPagos(): Promise<PagoPO[]> {
  const { data } = await api.get<unknown>("/pagos");
  return parseApiResponse(z.array(apiPagoSchema), data, "pagos").map(toPago);
}

export async function radicarFactura(pagoId: string, factura: { numero: string; fechaEmision: string; archivo: File }) {
  assertFileSizeOk(factura.archivo);
  const { data: subida } = await api.post<{ path: string; token: string }>(`/pagos/${pagoId}/factura/upload-url`, {
    filename: factura.archivo.name,
    tamanoBytes: factura.archivo.size,
  });
  await uploadToSignedUrl(BUCKET, subida.path, subida.token, factura.archivo);
  const { data } = await api.post(`/pagos/${pagoId}/factura`, {
    numero: factura.numero,
    fechaEmision: factura.fechaEmision,
    path: subida.path,
    nombre: factura.archivo.name,
  });
  return data;
}

export async function urlFacturaProveedor(pagoId: string, facturaId: string): Promise<{ url: string; nombre: string }> {
  const { data } = await api.get(`/pagos/${pagoId}/factura/${facturaId}/url`);
  return data;
}

export async function urlSoporteProveedor(pagoId: string): Promise<{ url: string; nombre: string | null }> {
  const { data } = await api.get(`/pagos/${pagoId}/soporte-url`);
  return data;
}

export interface SimulacionProntoPago {
  montoOriginal: number;
  dias: number;
  descuentoPct: number;
  montoNeto: number;
  descuento: number;
}

export async function simularProntoPago(pagoId: string, fechaPropuesta: string): Promise<SimulacionProntoPago> {
  const { data } = await api.post(`/pagos/${pagoId}/pronto-pago/simular`, { fechaPropuesta });
  return data;
}

export async function solicitarProntoPago(pagoId: string, fechaPropuesta: string) {
  const { data } = await api.post(`/pagos/${pagoId}/pronto-pago`, { fechaPropuesta });
  return data;
}

// ------------------------------------------------------------------ cliente

export async function fetchCuentasPorPagar(): Promise<PagoPO[]> {
  const { data } = await api.get<unknown>("/cuentas-por-pagar");
  return parseApiResponse(z.array(apiPagoSchema), data, "cuentas por pagar").map(toPago);
}

export async function urlFacturaCliente(facturaId: string): Promise<{ url: string; nombre: string }> {
  const { data } = await api.get(`/cuentas-por-pagar/facturas/${facturaId}/url`);
  return data;
}

export async function urlSoporteCliente(pagoId: string): Promise<{ url: string; nombre: string | null }> {
  const { data } = await api.get(`/cuentas-por-pagar/${pagoId}/soporte-url`);
  return data;
}

export async function aprobarFactura(facturaId: string) {
  const { data } = await api.post(`/cuentas-por-pagar/facturas/${facturaId}/aprobar`);
  return data;
}

export async function rechazarFactura(facturaId: string, motivo: string) {
  const { data } = await api.post(`/cuentas-por-pagar/facturas/${facturaId}/rechazar`, { motivo });
  return data;
}

export async function registrarPago(pagoId: string, pago: { fechaPago: string; referencia: string; soporte?: File | null }) {
  let soportePath: string | undefined;
  if (pago.soporte) {
    assertFileSizeOk(pago.soporte);
    const { data: subida } = await api.post<{ path: string; token: string }>(`/cuentas-por-pagar/${pagoId}/soporte/upload-url`, {
      filename: pago.soporte.name,
      tamanoBytes: pago.soporte.size,
    });
    await uploadToSignedUrl(BUCKET, subida.path, subida.token, pago.soporte);
    soportePath = subida.path;
  }
  const { data } = await api.post(`/cuentas-por-pagar/${pagoId}/pagar`, {
    fechaPago: pago.fechaPago,
    referencia: pago.referencia,
    soportePath,
    soporteNombre: pago.soporte?.name,
  });
  return data;
}

export async function responderProntoPago(solicitudId: string, aceptar: boolean, motivo?: string) {
  const { data } = await api.post(`/cuentas-por-pagar/pronto-pago/${solicitudId}/${aceptar ? "aceptar" : "rechazar"}`, aceptar ? undefined : { motivo });
  return data;
}
