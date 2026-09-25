import { Building2, LineChart, ShieldCheck, Users2 } from "lucide-react";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { usePageMeta } from "@/hooks/usePageMeta";

export function LoginInterno() {
  usePageMeta({ title: "Ingreso equipo interno", noindex: true });
  return (
    <AuthLayout
      panel={{
        etiqueta: "Panel Interno",
        titulo: "Equipo Procurex",
        texto:
          "Seguimiento de las empresas clientes y homologación de proveedores.",
        puntos: [
          {
            icon: Building2,
            titulo: "Empresas",
            texto: "Cómo va cada empresa cliente y alta de nuevas empresas.",
          },
          {
            icon: ShieldCheck,
            titulo: "Homologación",
            texto: "Revisión de documentos y listas restrictivas.",
          },
          {
            icon: LineChart,
            titulo: "Riesgo continuo",
            texto: "Monitoreo diario de los proveedores homologados.",
          },
        ],
      }}
      portal={{ icon: Users2, nombre: "Panel Interno" }}
      titulo="Acceso del equipo"
      subtitulo="Exclusivo para el equipo de Procurex."
    >
      <PortalLoginForm
        portal="interno"
        demoHint="ana.consultora@procureos.com / demo123"
      />
    </AuthLayout>
  );
}
