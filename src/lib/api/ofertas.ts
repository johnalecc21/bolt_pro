import { api } from "@/lib/api/http";
import type { Moneda } from "@/lib/moneda";

export interface OfertaProceso {
  id: string;
  proveedorId: string;
  proveedor: string;
  precio: number;
  plazo: number;
  calidad: number;
  pago: number;
  enviada: boolean;
}

interface ApiOferta {
  id: string;
  proveedorId: string;
  precioTotal: number;
  plazoEntregaDias: number;
  calidad: number;
  condicionesPagoDias: number;
  enviada: boolean;
  proveedor: { nombre: string };
}

function toOfertaProceso(o: ApiOferta): OfertaProceso {
  return {
    id: o.id,
    proveedorId: o.proveedorId,
    proveedor: o.proveedor.nombre,
    precio: o.precioTotal,
    plazo: o.plazoEntregaDias,
    calidad: o.calidad,
    pago: o.condicionesPagoDias,
    enviada: o.enviada,
  };
}

export async function fetchOfertasPorRequerimiento(requerimientoId: string): Promise<OfertaProceso[]> {
  const { data } = await api.get<ApiOferta[]>(`/ofertas/requerimiento/${requerimientoId}`);
  return data.map(toOfertaProceso);
}

export interface MiOfertaResumen {
  requerimientoId: string;
  titulo: string;
  cliente: string;
  categoria: string;
  fechaLimite: string;
  moneda: Moneda;
  enviada: boolean;
  precioTotal: number | null;
}

interface ApiMiOfertaResumen {
  requerimientoId: string;
  titulo: string;
  cliente: string;
  categoria: string;
  fechaLimite: string;
  moneda: Moneda;
  oferta: { enviada: boolean; precioTotal: number } | null;
}

export async function fetchMisOfertas(): Promise<MiOfertaResumen[]> {
  const { data } = await api.get<ApiMiOfertaResumen[]>("/ofertas/mine");
  return data.map((o) => ({
    requerimientoId: o.requerimientoId,
    titulo: o.titulo,
    cliente: o.cliente,
    categoria: o.categoria,
    fechaLimite: o.fechaLimite.slice(0, 10),
    moneda: o.moneda,
    enviada: o.oferta?.enviada ?? false,
    precioTotal: o.oferta?.precioTotal ?? null,
  }));
}

export interface MiOferta {
  precioUnitario: number;
  precioTotal: number;
  plazoEntregaDias: number;
  condicionesPagoDias: number;
  garantiaMeses: number;
  vigenciaOfertaDias: number;
  enviada: boolean;
}

interface ApiMiOferta {
  precioUnitario: number;
  precioTotal: number;
  plazoEntregaDias: number;
  condicionesPagoDias: number;
  garantiaMeses: number;
  vigenciaOfertaDias: number;
  enviada: boolean;
}

const OFERTA_VACIA: MiOferta = {
  precioUnitario: 0, precioTotal: 0, plazoEntregaDias: 0,
  condicionesPagoDias: 0, garantiaMeses: 0, vigenciaOfertaDias: 0, enviada: false,
};

export async function fetchMiOferta(requerimientoId: string): Promise<MiOferta> {
  const { data } = await api.get<ApiMiOferta | null>(`/ofertas/mine/${requerimientoId}`);
  return data ?? OFERTA_VACIA;
}

export async function guardarMiOferta(payload: {
  requerimientoId: string;
  precioUnitario: number;
  precioTotal: number;
  plazoEntregaDias: number;
  condicionesPagoDias: number;
  garantiaMeses: number;
  vigenciaOfertaDias: number;
}) {
  const { data } = await api.put("/ofertas", payload);
  return data;
}

export async function enviarMiOferta(requerimientoId: string) {
  const { data } = await api.post(`/ofertas/${requerimientoId}/enviar`);
  return data;
}

export interface ProcesoHistorial {
  id: string;
  requerimientoId: string;
  titulo: string;
  cliente: string;
  fecha: string;
  monto: number;
  moneda: Moneda;
  resultado: "ganado" | "perdido" | "pendiente" | "seleccionado";
  feedback?: string;
  poId?: string;
  precioFinal?: number;
  plazoDias?: number;
  condicionesPagoDias?: number;
  garantiaMeses?: number;
}

export interface HistorialProveedor {
  procesos: ProcesoHistorial[];
  competitividad: { tuOfertaPromedioVsMercado: number };
}

interface ApiHistorial {
  procesos: {
    id: string;
    requerimientoId: string;
    titulo: string;
    cliente: string;
    fecha: string;
    monto: number;
    moneda: Moneda;
    resultado: "ganado" | "perdido" | "pendiente" | "seleccionado";
    feedback?: string;
    poId?: string;
    precioFinal?: number;
    plazoDias?: number;
    condicionesPagoDias?: number;
    garantiaMeses?: number;
  }[];
  competitividad: { tuOfertaPromedioVsMercado: number };
}

export async function fetchMiHistorial(): Promise<HistorialProveedor> {
  const { data } = await api.get<ApiHistorial>("/ofertas/mine/historial");
  return {
    procesos: data.procesos.map((p) => ({ ...p, fecha: p.fecha.slice(0, 10) })),
    competitividad: data.competitividad,
  };
}
