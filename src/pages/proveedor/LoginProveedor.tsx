import { Link } from "react-router-dom";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { usePageMeta } from "@/hooks/usePageMeta";

export function LoginProveedor() {
  usePageMeta({ title: "Ingreso proveedores", noindex: true });
  return (
    <AuthLayout
      titulo="Portal de proveedores"
      subtitulo="Ingresa para gestionar tus procesos"
      pie={
        <>
          ¿Aún no estás en la red?{" "}
          <Link
            to="/proveedor/registro"
            className="font-medium text-primary hover:underline"
          >
            Regístrate gratis
          </Link>
        </>
      }
    >
      <PortalLoginForm
        portal="proveedor"
        demoHint="contacto@cloudsphere.com / demo123"
      />
    </AuthLayout>
  );
}
