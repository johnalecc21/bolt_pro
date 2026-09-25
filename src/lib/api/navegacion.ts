import { api } from "@/lib/api/http";

/** Pending counters for the side menu; keys depend on the portal. */
export type ContadoresNav = Record<string, number | boolean>;

export async function fetchContadoresNav(): Promise<ContadoresNav> {
  const { data } = await api.get<ContadoresNav>("/navegacion/contadores");
  return data;
}
