import { api } from "@/lib/api/http";
import { assertFileSizeOk, uploadToSignedUrl } from "@/lib/api/storage";
import { formatContratoCodigo } from "@/lib/codigo";
import type { Contrato } from "@/lib/types";
import type { Moneda } from "@/lib/moneda";
import { mapPaginado, type Paginado } from "@/lib/api/paginacion";
import type { EstadoHito, Hito } from "@/lib/api/seguimiento";

const BUCKET = "contratos-documentos";

interface ApiContrato {
  id: string;
  numero: number;
  tipo: "CONTRATO" | "PO" | "ADDENDUM";
  proveedorNombre: string;
  categoria: string;
  monto: number;
  moneda: Moneda;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: "ACTIVO" | "POR_VENCER" | "VENCIDO" | "EN_RENOVACION";
  companyId: string;
  archivoNombre: string | null;
  hijas?: { id: string; monto: number; estado: ApiContrato["estado"] }[];
  condicionesPagoDias: number;
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
    codigo: formatContratoCodigo(c.tipo, c.numero),
    tipo: TIPO_LABEL[c.tipo],
    proveedor: c.proveedorNombre,
    categoria: c.categoria,
    monto: c.monto,
    moneda: c.moneda,
    vigenciaInicio: c.vigenciaInicio.slice(0, 10),
    vigenciaFin: c.vigenciaFin.slice(0, 10),
    estado: ESTADO_LABEL[c.estado],
    companyId: c.companyId,
    archivoNombre: c.archivoNombre,
    hijas: c.hijas?.map((h) => ({ id: h.id, monto: h.monto, estado: ESTADO_LABEL[h.estado] })),
    condicionesPagoDias: c.condicionesPagoDias,
  };
}

/** Server-side paginated list for the Contratos screen. */
export async function fetchContratosPagina(params: {
  page: number;
  limit?: number;
  q?: string;
  categoria?: string;
}): Promise<Paginado<Contrato>> {
  const { data } = await api.get<Paginado<ApiContrato>>("/contratos/pagina", {
    params: {
      page: params.page,
      limit: params.limit ?? 20,
      ...(params.q ? { q: params.q } : {}),
      ...(params.categoria && params.categoria !== "Todas" ? { categoria: params.categoria } : {}),
    },
  });
  return mapPaginado(data, toContrato);
}

export async function fetchContratos(params?: { categoria?: string; q?: string }): Promise<Contrato[]> {
  const { data } = await api.get<ApiContrato[]>("/contratos", { params });
  return data.map(toContrato);
}

export interface ContratoConHitos extends Contrato {
  cliente?: string;
  objeto?: string;
  garantiaMeses?: number;
  plazoDias?: number;
  hitos: Hito[];
}

interface ApiHito {
  id: string;
  label: string;
  comprometido: string;
  real: string | null;
  estado: "COMPLETADO" | "EN_RIESGO" | "ATRASADO" | "PENDIENTE";
  porcentaje: number;
  pagoGeneradoId: string | null;
}

function mapHitos(hitos: ApiHito[]): Hito[] {
  return hitos.map((h) => ({
    id: h.id,
    label: h.label,
    comprometido: h.comprometido.slice(0, 10),
    real: h.real ? h.real.slice(0, 10) : null,
    estado: h.estado.toLowerCase() as EstadoHito,
    porcentaje: h.porcentaje,
    pagoGeneradoId: h.pagoGeneradoId,
  }));
}

interface ApiRequerimientoResumen {
  titulo: string;
  descripcion: string | null;
  adjudicacion: { garantiaMeses: number; plazoDias: number } | null;
}

interface ApiContratoDetalle extends ApiContrato {
  hitos: ApiHito[];
  requerimiento?: ApiRequerimientoResumen | null;
}

function requerimientoExtras(requerimiento?: ApiRequerimientoResumen | null) {
  return {
    objeto: requerimiento ? requerimiento.descripcion || requerimiento.titulo : undefined,
    garantiaMeses: requerimiento?.adjudicacion?.garantiaMeses,
    plazoDias: requerimiento?.adjudicacion?.plazoDias,
  };
}

export async function fetchContrato(id: string): Promise<ContratoConHitos> {
  const { data } = await api.get<ApiContratoDetalle & { company?: { nombre: string } }>(`/contratos/${id}`);
  return {
    ...toContrato(data),
    cliente: data.company?.nombre,
    ...requerimientoExtras(data.requerimiento),
    hitos: mapHitos(data.hitos),
  };
}

interface ApiContratoMine extends ApiContratoDetalle {
  company: { nombre: string };
}

function toContratoConHitos(c: ApiContratoMine): ContratoConHitos {
  return {
    ...toContrato(c),
    cliente: c.company.nombre,
    ...requerimientoExtras(c.requerimiento),
    hitos: mapHitos(c.hitos),
  };
}

export async function fetchMisContratos(): Promise<ContratoConHitos[]> {
  const { data } = await api.get<ApiContratoMine[]>("/contratos/mine");
  return data.map(toContratoConHitos);
}

// Lets the company replace the Procurex-generated template with their own
// signed PO/contract file — only the cliente portal can call this.
export async function subirArchivoContrato(id: string, file: File) {
  assertFileSizeOk(file);

  const { data: uploadUrlData } = await api.post<{ path: string; token: string }>(
    `/contratos/${id}/upload-url`,
    { filename: file.name, tamanoBytes: file.size },
  );

  await uploadToSignedUrl(BUCKET, uploadUrlData.path, uploadUrlData.token, file);

  const { data } = await api.post(`/contratos/${id}/adjuntar`, {
    path: uploadUrlData.path,
    nombre: file.name,
    tamanoBytes: file.size,
  });
  return data;
}

export async function obtenerUrlArchivoContrato(id: string): Promise<{ url: string; nombre: string | null }> {
  const { data } = await api.get<{ url: string; nombre: string | null }>(`/contratos/${id}/archivo-url`);
  return data;
}

// Only valid under a Contrato Marco (tipo "Contrato") — issues a child PO
// that inherits proveedor/categoría from the parent without needing its own
// legal review cycle.
export async function emitirPo(contratoPadreId: string, payload: { monto: number; vigenciaInicio: string; vigenciaFin: string }): Promise<Contrato> {
  const { data } = await api.post<ApiContrato>(`/contratos/${contratoPadreId}/emitir-po`, payload);
  return toContrato(data);
}
