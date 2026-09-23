import { api } from "@/lib/api/http";

export interface AuditLogEntry {
  id: string;
  fecha: string;
  usuario: string;
  accion: string;
  detalle: string;
  motivo?: string;
}

export interface PaginatedAuditLog {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiAuditLogEntry {
  id: string;
  usuario: string;
  accion: string;
  detalle: string;
  motivo: string | null;
  createdAt: string;
}

interface ApiPaginated {
  items: ApiAuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchAuditLog(page = 1, limit = 20): Promise<PaginatedAuditLog> {
  const { data } = await api.get<ApiPaginated>("/audit-log", { params: { page, limit } });
  return {
    ...data,
    items: data.items.map((e) => ({
      id: e.id,
      fecha: new Date(e.createdAt).toLocaleString(),
      usuario: e.usuario,
      accion: e.accion,
      detalle: e.detalle,
      motivo: e.motivo ?? undefined,
    })),
  };
}

/** Downloads the audit trail as CSV (through the API so the auth header is sent). */
export async function exportarAuditoriaCsv(desde?: string, hasta?: string) {
  const { data } = await api.get<Blob>("/audit-log/export", {
    params: { ...(desde ? { desde } : {}), ...(hasta ? { hasta: `${hasta}T23:59:59` } : {}) },
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchRetencionAuditoria(): Promise<number> {
  const { data } = await api.get<{ meses: number }>("/audit-log/retencion");
  return data.meses;
}

export async function guardarRetencionAuditoria(meses: number): Promise<number> {
  const { data } = await api.put<{ meses: number }>("/audit-log/retencion", { meses });
  return data.meses;
}
