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
  password: string;
  portal: Portal;
  role: Role;
  iniciales: string;
  cargo: string;
  companies: Company[];
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

const acme: Company = { id: "acme", nombre: "Acme S.A." };
const techcorp: Company = { id: "techcorp", nombre: "TechCorp" };

export const mockUsers: MockUser[] = [
  {
    id: "U-001", nombre: "Carlos Méndez", email: "carlos@acme.com", password: "demo123",
    portal: "cliente", role: "comprador", iniciales: "CM", cargo: "Gerente de Compras",
    companies: [acme], requires2FA: false,
  },
  {
    id: "U-002", nombre: "Laura Torres", email: "laura@acme.com", password: "demo123",
    portal: "cliente", role: "comprador", iniciales: "LT", cargo: "Compradora Senior",
    companies: [acme], requires2FA: false,
  },
  {
    id: "U-003", nombre: "Ana Ruiz", email: "ana.cfo@acme.com", password: "demo123",
    portal: "cliente", role: "aprobador_cfo", iniciales: "AR", cargo: "CFO",
    companies: [acme], requires2FA: true,
  },
  {
    id: "U-004", nombre: "Roberto Silva", email: "admin@acme.com", password: "demo123",
    portal: "cliente", role: "admin_cliente", iniciales: "RS", cargo: "Admin de Cuenta",
    companies: [acme, techcorp], requires2FA: true,
  },
  {
    id: "U-005", nombre: "Diego Ramírez", email: "contacto@cloudsphere.com", password: "demo123",
    portal: "proveedor", role: "proveedor", iniciales: "DR", cargo: "Gerente Comercial",
    companies: [{ id: "cloudsphere", nombre: "CloudSphere Technologies" }], requires2FA: false,
  },
  {
    id: "U-006", nombre: "Ana Consultora", email: "ana.consultora@procureos.com", password: "demo123",
    portal: "interno", role: "consultor", iniciales: "AC", cargo: "Sourcing Expert",
    companies: [{ id: "procureos", nombre: "ProcureOS" }], requires2FA: false,
  },
  {
    id: "U-007", nombre: "Mateo Vargas", email: "compliance@procureos.com", password: "demo123",
    portal: "interno", role: "compliance_ops", iniciales: "MV", cargo: "Compliance & Ops",
    companies: [{ id: "procureos", nombre: "ProcureOS" }], requires2FA: false,
  },
];

export const DEMO_2FA_CODE = "000000";

let registeredCount = 0;

/**
 * Self-registration for the Proveedor portal — pushes a real, login-able
 * MockUser so the account created in RegistroProveedor.tsx actually works
 * afterward on the login screen (instead of just showing a confirmation).
 */
export function registerProveedor(razonSocial: string, email: string, password: string): { ok: boolean; error?: string } {
  if (mockUsers.some((u) => u.portal === "proveedor" && u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "Ya existe una cuenta de proveedor con este correo." };
  }
  registeredCount += 1;
  const iniciales = razonSocial.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "PV";
  mockUsers.push({
    id: `U-${900 + registeredCount}`,
    nombre: razonSocial.trim(),
    email: email.trim(),
    password,
    portal: "proveedor",
    role: "proveedor",
    iniciales,
    cargo: "Representante de la empresa",
    companies: [{ id: `nuevo-proveedor-${registeredCount}`, nombre: razonSocial.trim() }],
    requires2FA: false,
  });
  return { ok: true };
}
