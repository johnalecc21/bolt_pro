import type { Moneda } from "@/lib/moneda";
export type Portal = "cliente" | "proveedor" | "interno";

export type Role =
  | "comprador"
  | "aprobador_cfo"
  | "admin_cliente"
  | "proveedor"
  | "consultor"
  | "compliance_ops";

export interface Company {
  id: string;
  nombre: string;
  /** ISO-3166 alpha-2. Undefined only for sessions loaded before the API sent it. */
  pais?: string;
  /** Default currency for new requerimientos and the one analytics aggregate in. */
  monedaBase?: Moneda;
}

export interface MockUser {
  id: string;
  nombre: string;
  email: string;
  portal: Portal;
  role: Role;
  iniciales: string;
  cargo: string;
  companies: Company[];
  /** Whether the user has an enrolled, verified TOTP factor in Supabase Auth. */
  requires2FA: boolean;
  /** Null until the user has accepted the Términos y Condiciones / Aviso de Privacidad. */
  terminosAceptadosEn: string | null;
}

export const roleLabels: Record<Role, string> = {
  comprador: "Comprador",
  aprobador_cfo: "Aprobador / CFO",
  admin_cliente: "Admin Cliente",
  proveedor: "Proveedor",
  consultor: "Consultor",
  compliance_ops: "Compliance / Ops",
};
