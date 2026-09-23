import { api } from "@/lib/api/http";
import type { Company, MockUser, Portal, Role } from "@/lib/mock/users";
import type { Moneda } from "@/lib/moneda";

interface ApiUser {
  id: string;
  nombre: string;
  email: string;
  portal: string;
  role: string;
  iniciales: string;
  cargo: string | null;
  terminosAceptadosEn: string | null;
}

interface ApiCompany {
  id: string;
  nombre: string;
  pais?: string;
  monedaBase?: Moneda;
}

export function toCompany(c: ApiCompany): Company {
  return { id: c.id, nombre: c.nombre, pais: c.pais, monedaBase: c.monedaBase };
}

export function toMockUser(user: ApiUser, companies: ApiCompany[], requires2FA: boolean): MockUser {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    portal: user.portal.toLowerCase() as Portal,
    role: user.role.toLowerCase() as Role,
    iniciales: user.iniciales,
    cargo: user.cargo ?? "",
    companies: companies.map(toCompany),
    requires2FA,
    terminosAceptadosEn: user.terminosAceptadosEn,
  };
}

/** Loads our app profile (portal/role/company memberships) for the current Supabase session. */
export async function apiMe() {
  const { data } = await api.get<{ user: ApiUser; activeCompany: ApiCompany; companies: ApiCompany[] }>(
    "/auth/me",
  );
  return data;
}

export async function apiAceptarTerminos(): Promise<ApiUser> {
  const { data } = await api.post<ApiUser>("/auth/aceptar-terminos");
  return data;
}

export async function apiRegisterProveedor(payload: {
  razonSocial: string;
  email: string;
  password: string;
  categoria: string;
  pais: string;
}) {
  const { data } = await api.post<{ id: string; email: string }>("/auth/registro-proveedor", payload);
  return data;
}
