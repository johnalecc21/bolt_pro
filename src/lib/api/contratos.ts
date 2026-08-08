import { api } from "@/lib/api/http";
import type { Contrato } from "@/lib/mockData";
import type { EstadoHito, Hito } from "@/lib/api/seguimiento";

interface ApiContrato {
  id: string;
  tipo: "CONTRATO" | "PO" | "ADDENDUM";
  proveedorNombre: string;
  categoria: string;
  monto: number;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: "ACTIVO" | "POR_VENCER" | "VENCIDO" | "EN_RENOVACION";
  companyId: string;
}

const TIPO_LABEL: Record<ApiContrato["tipo"], Contrato["tipo"]> = {
  CONTRATO: "Contrato",
  PO: "PO",
  ADDENDUM: "Addendum",
};

const ESTADO_LABEL: Record<ApiContrato["estado"], Contrato["estado"]> = {
  ACTIVO: "Activo",
  POR_VENCER: "Por vencer",
  VENCIDO: "Vencido",
  EN_RENOVACION: "En renovación",
};

function toContrato(c: ApiContrato): Contrato {
  return {
    id: c.id,
    tipo: TIPO_LABEL[c.tipo],
    proveedor: c.proveedorNombre,
    categoria: c.categoria,
    monto: c.monto,
    vigenciaInicio: c.vigenciaInicio.slice(0, 10),
    vigenciaFin: c.vigenciaFin.slice(0, 10),
    estado: ESTADO_LABEL[c.estado],
    companyId: c.companyId,
  };
}

export async function fetchContratos(params?: { categoria?: string; q?: string }): Promise<Contrato[]> {
  const { data } = await api.get<ApiContrato[]>("/contratos", { params });
  return data.map(toContrato);
}

export async function fetchContrato(id: string): Promise<Contrato> {
  const { data } = await api.get<ApiContrato>(`/contratos/${id}`);
  return toContrato(data);
}

export interface ContratoConHitos extends Contrato {
  cliente: string;
  hitos: Hito[];
}

interface ApiHito {
  id: string;
  label: string;
  comprometido: string;
  real: string | null;
  estado: "COMPLETADO" | "EN_RIESGO" | "ATRASADO" | "PENDIENTE";
}

interface ApiContratoMine extends ApiContrato {
  company: { nombre: string };
  hitos: ApiHito[];
}

function toContratoConHitos(c: ApiContratoMine): ContratoConHitos {
  return {
    ...toContrato(c),
    cliente: c.company.nombre,
    hitos: c.hitos.map((h) => ({
      id: h.id,
      label: h.label,
      comprometido: h.comprometido.slice(0, 10),
      real: h.real ? h.real.slice(0, 10) : null,
      estado: h.estado.toLowerCase() as EstadoHito,
    })),
  };
}

export async function fetchMisContratos(): Promise<ContratoConHitos[]> {
  const { data } = await api.get<ApiContratoMine[]>("/contratos/mine");
  return data.map(toContratoConHitos);
}
