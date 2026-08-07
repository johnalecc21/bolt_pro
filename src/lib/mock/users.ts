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
}

export const roleLabels: Record<Role, string> = {
  comprador: "Comprador",
  aprobador_cfo: "Aprobador / CFO",
  admin_cliente: "Admin Cliente",
  proveedor: "Proveedor",
  consultor: "Consultor",
  compliance_ops: "Compliance / Ops",
};
