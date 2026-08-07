import { api } from "@/lib/api/http";

export interface PagoPO {
  id: string;
  cliente: string;
  monto: number;
  fechaPagoPactada: string;
  estado: "pendiente" | "pagado" | "vencido";
  disputaAbierta: boolean;
}

interface ApiPagoPO {
  id: string;
  monto: number;
  fechaPagoPactada: string;
  estado: "PENDIENTE" | "PAGADO" | "VENCIDO";
  disputaAbierta: boolean;
  contrato: { company: { nombre: string } };
}

function toPagoPO(p: ApiPagoPO): PagoPO {
  return {
    id: p.id,
    cliente: p.contrato.company.nombre,
    monto: p.monto,
    fechaPagoPactada: p.fechaPagoPactada.slice(0, 10),
    estado: p.estado.toLowerCase() as PagoPO["estado"],
    disputaAbierta: p.disputaAbierta,
  };
}

export async function fetchMisPagos(): Promise<PagoPO[]> {
  const { data } = await api.get<ApiPagoPO[]>("/pagos");
  return data.map(toPagoPO);
}

export async function simularProntoPago(pagoId: string, diasAdelanto: number): Promise<{ montoOriginal: number; montoAdelanto: number; descuento: number }> {
  const { data } = await api.post(`/pagos/${pagoId}/pronto-pago`, { diasAdelanto });
  return data;
}
