import { describe, expect, it } from "vitest";
import { FileText } from "lucide-react";
import { hojas, visibles, type PortalNavEntry } from "./MenuLateral";

const menu: PortalNavEntry[] = [
  { to: "dashboard", label: "Inicio", icon: FileText },
  { to: "onboarding", label: "Primeros pasos", icon: FileText, roles: ["admin_cliente"], oculto: (c) => c.onboardingCompleto === true },
  {
    grupo: "compras",
    label: "Compras",
    icon: FileText,
    items: [
      { to: "requerimientos", label: "Requerimientos", icon: FileText },
      { to: "negociacion", label: "Negociación", icon: FileText, roles: ["comprador"] },
    ],
  },
  { grupo: "finanzas", label: "Finanzas", icon: FileText, items: [{ to: "analitica", label: "Analítica", icon: FileText, roles: ["aprobador_cfo"] }] },
  { grupo: "config", label: "Configuración", icon: FileText, separado: true, items: [{ to: "usuarios", label: "Usuarios", icon: FileText, roles: ["admin_cliente"] }] },
];

const nombres = (e: PortalNavEntry[]) => e.map((x) => ("grupo" in x ? `${x.label}[${x.items.map((i) => i.label).join(",")}]` : x.label));

describe("menú lateral", () => {
  it("cada rol ve solo lo suyo; los grupos vacíos desaparecen", () => {
    expect(nombres(visibles(menu, "comprador", {}))).toEqual(["Inicio", "Compras[Requerimientos,Negociación]"]);
  });

  it("un grupo con un solo elemento se muestra plano (salvo Configuración)", () => {
    expect(nombres(visibles(menu, "aprobador_cfo", {}))).toEqual(["Inicio", "Requerimientos", "Analítica"]);
    expect(nombres(visibles(menu, "admin_cliente", {}))).toContain("Configuración[Usuarios]");
  });

  it("Primeros pasos sale del menú cuando la configuración está completa", () => {
    expect(nombres(visibles(menu, "admin_cliente", {}))).toContain("Primeros pasos");
    expect(nombres(visibles(menu, "admin_cliente", { onboardingCompleto: true }))).not.toContain("Primeros pasos");
  });

  it("hojas aplana los grupos para títulos y breadcrumbs", () => {
    expect(hojas(menu).map((h) => h.to)).toEqual(["dashboard", "onboarding", "requerimientos", "negociacion", "analitica", "usuarios"]);
  });
});
