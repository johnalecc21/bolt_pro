import { Link } from "react-router-dom";
import { BadgeCheck, Network, Truck, Wallet } from "lucide-react";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { usePageMeta } from "@/hooks/usePageMeta";

export function LoginProveedor() {
  usePageMeta({ title: "Ingreso proveedores", noindex: true });
  return (
    <AuthLayout
      panel={{
        etiqueta: "Portal Proveedores",
        titulo: "Homológate una vez, vende a todas las empresas",
        texto:
          "Participa en los procesos de las empresas de Procurex y sigue tus contratos y pagos.",
        puntos: [
          {
            icon: Network,
            titulo: "Procesos abiertos",
            texto: "Invitaciones directas y convocatorias de tus categorías.",
          },
          {
            icon: BadgeCheck,
            titulo: "Una sola homologación",
            texto: "Tus documentos quedan vigentes para toda la red.",
          },
          {
            icon: Wallet,
            titulo: "Contratos y pagos",
            texto: "Estado de tus entregas, facturas y pagos en un lugar.",
          },
        ],
      }}
      portal={{ icon: Truck, nombre: "Portal Proveedores" }}
      titulo="Ingresa a tu cuenta"
      subtitulo="Gestiona tus procesos, ofertas y contratos."
      pie={
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            ¿Aún no estás en la red?{" "}
            <Link
              to="/proveedor/registro"
              className="font-medium text-primary hover:underline"
            >
              Regístrate gratis
            </Link>
          </p>
          <p>
            ¿Eres comprador?{" "}
            <Link
              to="/cliente/login"
              className="font-medium text-primary hover:underline"
            >
              Ingresa al portal cliente
            </Link>
          </p>
        </div>
      }
    >
      <PortalLoginForm
        portal="proveedor"
        demoHint="contacto@cloudsphere.com / demo123"
      />
    </AuthLayout>
  );
}
