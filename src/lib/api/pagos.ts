import { z } from "zod";
import { api, parseApiResponse } from "@/lib/api/http";
import { formatContratoCodigo } from "@/lib/codigo";

export interface PagoPO {
  id: string;
  contratoCodigo: string;
  cliente: string;
  monto: number;
  fechaPagoPactada: string;
  estado: "pendiente" | "pagado" | "vencido";
  disputaAbierta: boolean;
}

const apiPagoPOSchema = z.object({
  id: z.string(),
  monto: z.number(),
  fechaPagoPactada: z.string(),
  estado: z.enum(["PENDIENTE", "PAGADO", "VENCIDO"]),
  disputaAbierta: z.boolean(),
  contrato: z.object({
    numero: z.number(),
    tipo: z.enum(["CONTRATO", "PO", "ADDENDUM"]),
    company: z.object({ nombre: z.string() }),
  }),
});
type ApiPagoPO = z.infer<typeof apiPagoPOSchema>;

function toPagoPO(p: ApiPagoPO): PagoPO {
  return {
    id: p.id,
    contratoCodigo: formatContratoCodigo(p.contrato.tipo, p.contrato.numero),
    cliente: p.contrato.company.nombre,
    monto: p.monto,
    fechaPagoPactada: p.fechaPagoPactada.slice(0, 10),
    estado: p.estado.toLowerCase() as PagoPO["estado"],
    disputaAbierta: p.disputaAbierta,
  };
}

export async function fetchMisPagos(): Promise<PagoPO[]> {
  const { data } = await api.get<unknown>("/pagos");
  return parseApiResponse(z.array(apiPagoPOSchema), data, "pagos").map(toPagoPO);
}
