import { api } from "@/lib/api/http";
import { formatContratoCodigo } from "@/lib/codigo";
import type { Moneda } from "@/lib/moneda";

export interface PagoPO {
  id: string;
  contratoCodigo: string;
  cliente: string;
  monto: number;
  moneda: Moneda;
  fechaPagoPactada: string;
  estado: "pendiente" | "pagado" | "vencido";
  disputaAbierta: boolean;
}

interface ApiPagoPO {
  id: string;
  monto: number;
  moneda: Moneda;
  fechaPagoPactada: string;
  estado: "PENDIENTE" | "PAGADO" | "VENCIDO";
  disputaAbierta: boolean;
  contrato: { numero: number; tipo: "CONTRATO" | "PO" | "ADDENDUM"; company: { nombre: string } };
}

function toPagoPO(p: ApiPagoPO): PagoPO {
  return {
    id: p.id,
    contratoCodigo: formatContratoCodigo(p.contrato.tipo, p.contrato.numero),
    cliente: p.contrato.company.nombre,
    monto: p.monto,
    moneda: p.moneda,
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
