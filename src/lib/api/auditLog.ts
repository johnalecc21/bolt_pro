import { api } from "@/lib/api/http";

export interface AuditLogEntry {
  id: string;
  fecha: string;
  usuario: string;
  accion: string;
  detalle: string;
  motivo?: string;
}

interface ApiAuditLogEntry {
  id: string;
  usuario: string;
  accion: string;
  detalle: string;
  motivo: string | null;
  createdAt: string;
}

export async function fetchAuditLog(limit?: number): Promise<AuditLogEntry[]> {
  const { data } = await api.get<ApiAuditLogEntry[]>("/audit-log", { params: limit ? { limit } : undefined });
  return data.map((e) => ({
    id: e.id,
    fecha: new Date(e.createdAt).toLocaleString(),
    usuario: e.usuario,
    accion: e.accion,
    detalle: e.detalle,
    motivo: e.motivo ?? undefined,
  }));
}
