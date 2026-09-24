import { api } from "@/lib/api/http";
import type { DatosProveedor } from "@/lib/analitica-proveedor/tipos";

/** The supplier's own rows for [desde, hasta] plus the previous period of equal length. */
export async function fetchDatosProveedor(desde: string, hasta: string): Promise<DatosProveedor> {
  const { data } = await api.get<DatosProveedor>("/analitica/proveedor", { params: { desde, hasta } });
  return data;
}
