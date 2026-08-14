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
