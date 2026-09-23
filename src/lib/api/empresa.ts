import { api } from "@/lib/api/http";

export interface UsoPlan {
  plan: "STARTER" | "GROWTH" | "ENTERPRISE";
  planNombre: string;
  /** null = unlimited. */
  limites: { usuarios: number | null; requerimientosMes: number | null; almacenamientoMb: number | null };
  uso: { usuarios: number; requerimientosMes: number; almacenamientoMb: number };
}

export async function fetchUsoPlan(): Promise<UsoPlan> {
  const { data } = await api.get<UsoPlan>("/empresa/uso");
  return data;
}
