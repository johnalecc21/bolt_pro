import { PortalLoginForm } from "@/components/shared/PortalLoginForm";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { usePageMeta } from "@/hooks/usePageMeta";

export function LoginInterno() {
  usePageMeta({ title: "Ingreso equipo interno", noindex: true });
  return (
    <AuthLayout
      titulo="Panel interno"
      subtitulo="Acceso exclusivo para el equipo de Procurex"
    >
      <PortalLoginForm
        portal="interno"
        demoHint="ana.consultora@procureos.com / demo123"
      />
    </AuthLayout>
  );
}
