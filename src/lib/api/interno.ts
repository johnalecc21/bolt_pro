import { api } from "@/lib/api/http";

export interface CasoConsultor {
  id: string;
  cliente: string;
  tipo: string;
  prioridad: "Alta" | "Media" | "Baja";
  sla: string;
  estado: "Pendiente" | "En progreso" | "Escalado";
}

interface ApiCaso {
  id: string;
  tipo: string;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
  estado: "PENDIENTE" | "EN_PROGRESO" | "ESCALADO";
  slaVencido: boolean;
  company: { nombre: string };
}

const PRIORIDAD_LABEL: Record<ApiCaso["prioridad"], CasoConsultor["prioridad"]> = { ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };
const ESTADO_LABEL: Record<ApiCaso["estado"], CasoConsultor["estado"]> = { PENDIENTE: "Pendiente", EN_PROGRESO: "En progreso", ESCALADO: "Escalado" };

export async function fetchCasos(): Promise<CasoConsultor[]> {
  const { data } = await api.get<ApiCaso[]>("/interno/casos");
  return data.map((c) => ({
    id: c.id,
    cliente: c.company.nombre,
    tipo: c.tipo,
    prioridad: PRIORIDAD_LABEL[c.prioridad],
    sla: c.slaVencido ? "Vencido" : "En plazo",
    estado: ESTADO_LABEL[c.estado],
  }));
}

export interface ClienteAdmin {
  id: string;
  nombre: string;
  plan: "Starter" | "Growth" | "Enterprise";
  facturacion: "Al día" | "Pendiente" | "Vencida";
  procesosActivos: number;
  contactoPrincipal: string;
}

interface ApiCliente {
  id: string;
  nombre: string;
  plan: "STARTER" | "GROWTH" | "ENTERPRISE";
  facturacion: "AL_DIA" | "PENDIENTE" | "VENCIDA";
  procesosActivos: number;
  contactoPrincipal: string;
}

const PLAN_LABEL: Record<ApiCliente["plan"], ClienteAdmin["plan"]> = { STARTER: "Starter", GROWTH: "Growth", ENTERPRISE: "Enterprise" };
const FACTURACION_LABEL: Record<ApiCliente["facturacion"], ClienteAdmin["facturacion"]> = { AL_DIA: "Al día", PENDIENTE: "Pendiente", VENCIDA: "Vencida" };

export async function fetchClientes(): Promise<ClienteAdmin[]> {
  const { data } = await api.get<ApiCliente[]>("/interno/clientes");
  return data.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    plan: PLAN_LABEL[c.plan],
    facturacion: FACTURACION_LABEL[c.facturacion],
    procesosActivos: c.procesosActivos,
    contactoPrincipal: c.contactoPrincipal,
  }));
}

export async function impersonarCliente(companyId: string, motivo: string) {
  const { data } = await api.post<{ ok: boolean; empresa: string }>(`/interno/clientes/${companyId}/impersonar`, { motivo });
  return data;
}

export async function crearCliente(payload: { nombreEmpresa: string; adminNombre: string; adminEmail: string }) {
  const { data } = await api.post<{ id: string; nombre: string }>("/interno/clientes", payload);
  return data;
}

export interface BenchmarkEntry {
  id: string;
  categoria: string;
  region: string;
  precioPromedio: number;
  muestras: number;
  outlier: boolean;
}

export async function fetchBenchmark(): Promise<BenchmarkEntry[]> {
  const { data } = await api.get<BenchmarkEntry[]>("/interno/benchmark");
  return data;
}

export async function marcarBenchmarkValido(id: string) {
  const { data } = await api.post(`/interno/benchmark/${id}/marcar-valido`);
  return data;
}
