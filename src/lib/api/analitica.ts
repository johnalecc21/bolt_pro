import { api } from "@/lib/api/http";
import type { Moneda } from "@/lib/moneda";

export interface AhorroMes {
  mes: string;
  ahorro: number;
}

export interface CicloCategoria {
  categoria: string;
  dias: number;
}

export interface GastoCategoria {
  categoria: string;
  monto: number;
  porcentaje: number;
}

export interface GastoProveedor {
  proveedor: string;
  gasto: number;
}

export interface AnaliticaResumen {
  /** Company's monedaBase — money aggregates only include amounts in it. */
  moneda: Moneda;
  ahorroMensual: AhorroMes[];
  tiempoCicloCategoria: CicloCategoria[];
  concentracionGasto: GastoCategoria[];
  topProveedores: GastoProveedor[];
}

export async function fetchAnaliticaResumen(): Promise<AnaliticaResumen> {
  const { data } = await api.get<AnaliticaResumen>("/analitica");
  return data;
}
