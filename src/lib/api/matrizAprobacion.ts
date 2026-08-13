import { api } from "@/lib/api/http";

export type RoleCode = "COMPRADOR" | "APROBADOR_CFO" | "ADMIN_CLIENTE";

export const ROLE_LABELS: Record<RoleCode, string> = {
  COMPRADOR: "Comprador",
  ADMIN_CLIENTE: "Admin de Cuenta",
  APROBADOR_CFO: "Aprobador / CFO",
};

export const ROLE_OPTIONS: RoleCode[] = ["COMPRADOR", "ADMIN_CLIENTE", "APROBADOR_CFO"];

export interface Regla {
  id: string;
  min: number;
  max: number | null;
  roles: RoleCode[];
  tipo: "Única" | "Secuencial";
}

interface ApiRegla {
  id: string;
  montoMin: number;
  montoMax: number | null;
  roles: RoleCode[];
  tipo: "UNICA" | "SECUENCIAL";
}

function toRegla(r: ApiRegla): Regla {
  return {
    id: r.id,
    min: r.montoMin,
    max: r.montoMax,
    roles: r.roles,
    tipo: r.tipo === "UNICA" ? "Única" : "Secuencial",
  };
}

export function etiquetaAprobadores(roles: RoleCode[], tipo: Regla["tipo"]): string {
  if (roles.length === 0) return "sin aprobador asignado";
  const labels = roles.map((r) => ROLE_LABELS[r]);
  return tipo === "Secuencial" ? labels.join(" → ") : labels.join(" o ");
}

export async function fetchMatrizAprobacion(): Promise<Regla[]> {
  const { data } = await api.get<ApiRegla[]>("/matriz-aprobacion");
  return data.map(toRegla);
}

export async function guardarMatrizAprobacion(reglas: Regla[]): Promise<Regla[]> {
  const payload = {
    reglas: reglas.map((r) => ({
      montoMin: r.min,
      montoMax: r.max ?? undefined,
      roles: r.roles,
      tipo: r.tipo === "Única" ? "UNICA" : "SECUENCIAL",
    })),
  };
  const { data } = await api.put<ApiRegla[]>("/matriz-aprobacion", payload);
  return data.map(toRegla);
}

export async function fetchUmbralContratoMarco(): Promise<number> {
  const { data } = await api.get<{ umbralContratoMarco: number }>("/matriz-aprobacion/config");
  return data.umbralContratoMarco;
}

export async function guardarUmbralContratoMarco(umbral: number): Promise<number> {
  const { data } = await api.put<{ umbralContratoMarco: number }>("/matriz-aprobacion/config", { umbralContratoMarco: umbral });
  return data.umbralContratoMarco;
}
