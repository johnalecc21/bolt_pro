import { Link } from "react-router-dom";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { usePageMeta } from "@/hooks/usePageMeta";

export function LoginCliente() {
  usePageMeta({ title: "Ingreso clientes", noindex: true });
  return (
    <AuthLayout
      titulo="Bienvenido de nuevo"
      subtitulo="Ingresa a tu portal de compras"
      pie={
        <>
          ¿Eres proveedor?{" "}
          <Link
            to="/proveedor/login"
            className="font-medium text-primary hover:underline"
          >
            Ingresa aquí
          </Link>
        </>
      }
    >
      <PortalLoginForm
        portal="cliente"
        demoHint="carlos@acme.com / demo123 (admin@acme.com tiene 2 empresas)"
      />
    </AuthLayout>
  );
}
