import { api } from "@/lib/api/http";

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
  ahorroMensual: AhorroMes[];
  tiempoCicloCategoria: CicloCategoria[];
  concentracionGasto: GastoCategoria[];
  topProveedores: GastoProveedor[];
}

export async function fetchAnaliticaResumen(): Promise<AnaliticaResumen> {
  const { data } = await api.get<AnaliticaResumen>("/analitica");
  return data;
}
