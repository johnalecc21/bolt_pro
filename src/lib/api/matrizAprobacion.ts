import { api } from "@/lib/api/http";

export interface Regla {
  id: string;
  min: number;
  max: number | null;
  aprobadores: string;
  tipo: "Única" | "Secuencial";
}

interface ApiRegla {
  id: string;
  montoMin: number;
  montoMax: number | null;
  aprobadores: string;
  tipo: "UNICA" | "SECUENCIAL";
}

function toRegla(r: ApiRegla): Regla {
  return {
    id: r.id,
    min: r.montoMin,
    max: r.montoMax,
    aprobadores: r.aprobadores,
    tipo: r.tipo === "UNICA" ? "Única" : "Secuencial",
  };
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
      aprobadores: r.aprobadores,
      tipo: r.tipo === "Única" ? "UNICA" : "SECUENCIAL",
    })),
  };
  const { data } = await api.put<ApiRegla[]>("/matriz-aprobacion", payload);
  return data.map(toRegla);
}
