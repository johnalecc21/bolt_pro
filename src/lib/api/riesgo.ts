import { api } from "@/lib/api/http";

export type TipoAlertaRiesgo = "LISTA_RESTRICTIVA" | "DOCUMENTO_VENCIDO" | "REVALIDACION";

export const TIPO_ALERTA_LABEL: Record<TipoAlertaRiesgo, string> = {
  LISTA_RESTRICTIVA: "Listas restrictivas",
  DOCUMENTO_VENCIDO: "Documento vencido",
  REVALIDACION: "Revalidación vencida",
};

export interface AlertaRiesgo {
  id: string;
  proveedorId: string;
  tipo: TipoAlertaRiesgo;
  detalle: string;
  estado: "ABIERTA" | "RESUELTA";
  resolucion: string | null;
  resueltaPor: string | null;
  resueltaAt: string | null;
  createdAt: string;
  proveedor: { id: string; nombre: string; homologacion: { estado: string } | null };
}

export async function fetchAlertasRiesgo(estado?: "ABIERTA" | "RESUELTA"): Promise<AlertaRiesgo[]> {
  const { data } = await api.get<AlertaRiesgo[]>("/riesgo/alertas", { params: { estado } });
  return data;
}

export async function resolverAlerta(id: string, resolucion: string) {
  const { data } = await api.post(`/riesgo/alertas/${id}/resolver`, { resolucion });
  return data;
}

export async function ejecutarMonitoreo(): Promise<Record<string, number>> {
  const { data } = await api.post<Record<string, number>>("/riesgo/ejecutar");
  return data;
}

export interface ResumenRiesgo {
  estado: string | null;
  ultimoMonitoreo: string | null;
  proximaRevalidacion: string | null;
  alertas: { tipo: TipoAlertaRiesgo; detalle: string; desde: string }[];
}

export async function fetchRiesgoProveedor(proveedorId: string): Promise<ResumenRiesgo> {
  const { data } = await api.get<ResumenRiesgo>(`/riesgo/proveedores/${proveedorId}`);
  return data;
}

export async function fetchMisAlertas(): Promise<{ id: string; tipo: TipoAlertaRiesgo; detalle: string; createdAt: string }[]> {
  const { data } = await api.get("/riesgo/mias");
  return data;
}
