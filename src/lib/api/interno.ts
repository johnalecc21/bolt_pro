import { api } from "@/lib/api/http";
import type { Moneda } from "@/lib/moneda";

export type PlanCliente = "STARTER" | "GROWTH" | "ENTERPRISE";
export type Facturacion = "AL_DIA" | "PENDIENTE" | "VENCIDA";

export const PLAN_LABEL: Record<PlanCliente, string> = { STARTER: "Starter", GROWTH: "Growth", ENTERPRISE: "Enterprise" };
export const FACTURACION_LABEL: Record<Facturacion, string> = { AL_DIA: "Al día", PENDIENTE: "Pendiente", VENCIDA: "Vencida" };

/** A client company as an account: what Procurex's team follows, never its processes. */
export interface EmpresaCliente {
  id: string;
  nombre: string;
  plan: PlanCliente;
  facturacion: Facturacion;
  creada: string;
  contactoPrincipal: string;
  correoContacto: string | null;
  usuariosActivos: number;
  procesosEnCurso: number;
  procesosTotales: number;
  contratosVigentes: number;
  ultimoAcceso: string | null;
  configuracion: { hechos: number; total: number };
}

export async function fetchEmpresas(): Promise<EmpresaCliente[]> {
  const { data } = await api.get<EmpresaCliente[]>("/interno/clientes");
  return data;
}

export interface PasoConfiguracion {
  clave: string;
  label: string;
  hecho: boolean;
  opcional: boolean;
  detalle?: string | null;
}

export interface ResumenEmpresa {
  empresa: { id: string; nombre: string; plan: PlanCliente; facturacion: Facturacion; pais: string; monedaBase: Moneda; creada: string };
  uso: {
    plan: PlanCliente;
    planNombre: string;
    limites: { usuarios: number | null; requerimientosMes: number | null; almacenamientoMb: number | null };
    uso: { usuarios: number; requerimientosMes: number; almacenamientoMb: number };
  };
  configuracion: PasoConfiguracion[];
  usuarios: { nombre: string; email: string; rol: string; activo: boolean; ultimoAcceso: string | null }[];
  actividad: {
    ultimaActividad: string | null;
    procesosPorEstado: Partial<Record<string, number>>;
    procesosTotales: number;
    contratosPorEstado: Partial<Record<string, number>>;
    pagosPorEstado: Partial<Record<string, number>>;
    ultimos12Meses: { contratos: number; montoContratado: number; contratosEnOtraMoneda: number; proveedoresContratados: number };
    porMes: { mes: string; procesos: number; contratos: number }[];
  };
}

export async function fetchResumenEmpresa(id: string): Promise<ResumenEmpresa> {
  const { data } = await api.get<ResumenEmpresa>(`/interno/clientes/${id}`);
  return data;
}

export async function crearCliente(payload: { nombreEmpresa: string; adminNombre: string; adminEmail: string }) {
  const { data } = await api.post<{ id: string; nombre: string }>("/interno/clientes", payload);
  return data;
}
