import { api } from "@/lib/api/http";
import type { Company, MockUser, Portal, Role } from "@/lib/mock/users";

interface ApiUser {
  id: string;
  nombre: string;
  email: string;
  portal: string;
  role: string;
  iniciales: string;
  cargo: string | null;
  requires2FA: boolean;
}

interface ApiCompany {
  id: string;
  nombre: string;
}

interface FinalizeResponse {
  status: "success";
  accessToken: string;
  user: ApiUser;
  activeCompany: ApiCompany;
  companies: ApiCompany[];
}

interface TwoFaRequiredResponse {
  status: "2fa_required";
  pendingToken: string;
  user: { nombre: string; email: string };
}

interface SelectCompanyResponse {
  status: "select_company";
  pendingToken: string;
  companies: ApiCompany[];
}

interface InvalidResponse {
  status: "invalid";
  attemptsLeft: number;
}

interface LockedResponse {
  status: "locked";
}

export type LoginApiResponse =
  | FinalizeResponse
  | TwoFaRequiredResponse
  | SelectCompanyResponse
  | InvalidResponse
  | LockedResponse;

/** Backend enums are UPPER_SNAKE; frontend types are lower_snake — same values otherwise. */
export function toCompany(c: ApiCompany): Company {
  return { id: c.id, nombre: c.nombre };
}

export function toMockUser(user: ApiUser, companies: ApiCompany[]): MockUser {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    password: "",
    portal: user.portal.toLowerCase() as Portal,
    role: user.role.toLowerCase() as Role,
    iniciales: user.iniciales,
    cargo: user.cargo ?? "",
    companies: companies.map(toCompany),
    requires2FA: user.requires2FA,
  };
}

export async function apiLogin(email: string, password: string, portal: Portal) {
  const { data } = await api.post<LoginApiResponse>("/auth/login", {
    email,
    password,
    portal: portal.toUpperCase(),
  });
  return data;
}

export async function apiVerify2FA(pendingToken: string, code: string) {
  const { data } = await api.post<FinalizeResponse | SelectCompanyResponse>("/auth/verify-2fa", {
    pendingToken,
    code,
  });
  return data;
}

export async function apiSelectCompany(pendingToken: string, companyId: string) {
  const { data } = await api.post<FinalizeResponse>("/auth/select-company", {
    pendingToken,
    companyId,
  });
  return data;
}

export async function apiSwitchCompany(companyId: string) {
  const { data } = await api.post<FinalizeResponse>("/auth/switch-company", { companyId });
  return data;
}

export async function apiMe() {
  const { data } = await api.get<{ user: ApiUser; activeCompany: ApiCompany; companies: ApiCompany[] }>(
    "/auth/me",
  );
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
