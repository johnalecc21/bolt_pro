import { api } from "@/lib/api/http";

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
