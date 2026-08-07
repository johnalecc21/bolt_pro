import { api } from "@/lib/api/http";

export type EstadoHito = "completado" | "en_riesgo" | "atrasado" | "pendiente";

export interface Hito {
  id: string;
  label: string;
  comprometido: string;
  real: string | null;
  estado: EstadoHito;
}

export interface SeguimientoContrato {
  poId: string;
  proveedor: string;
  categoria: string;
  hitos: Hito[];
}

interface ApiHito {
  id: string;
  label: string;
  comprometido: string;
  real: string | null;
  estado: "COMPLETADO" | "EN_RIESGO" | "ATRASADO" | "PENDIENTE";
}

interface ApiContratoConHitos {
  id: string;
  proveedorNombre: string;
  categoria: string;
  hitos: ApiHito[];
}

export async function fetchSeguimiento(): Promise<SeguimientoContrato[]> {
  const { data } = await api.get<ApiContratoConHitos[]>("/seguimiento");
  return data.map((c) => ({
    poId: c.id,
    proveedor: c.proveedorNombre,
    categoria: c.categoria,
    hitos: c.hitos.map((h) => ({
      id: h.id,
      label: h.label,
      comprometido: h.comprometido.slice(0, 10),
      real: h.real ? h.real.slice(0, 10) : null,
      estado: h.estado.toLowerCase() as EstadoHito,
    })),
  }));
}

export async function confirmarRecepcion(hitoId: string) {
  const { data } = await api.post(`/seguimiento/hitos/${hitoId}/confirmar-recepcion`);
  return data;
}
