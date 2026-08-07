import { api } from "@/lib/api/http";
import type { Role } from "@/lib/mock/users";

export interface UsuarioRow {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  activo: boolean;
  ultimoAcceso: string;
}

interface ApiUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  ultimoAcceso: string | null;
}

function toUsuarioRow(u: ApiUsuario): UsuarioRow {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol.toLowerCase() as Role,
    activo: u.activo,
    ultimoAcceso: u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString() : "Nunca",
  };
}

export async function fetchUsuarios(): Promise<UsuarioRow[]> {
  const { data } = await api.get<ApiUsuario[]>("/usuarios");
  return data.map(toUsuarioRow);
}

export async function invitarUsuario(email: string, role: Role) {
  const { data } = await api.post("/usuarios/invitar", { email, role: role.toUpperCase() });
  return data;
}

export async function actualizarRol(userId: string, role: Role) {
  const { data } = await api.patch(`/usuarios/${userId}/rol`, { role: role.toUpperCase() });
  return data;
}

export async function toggleActivo(userId: string) {
  const { data } = await api.patch(`/usuarios/${userId}/estado`);
  return data;
}
