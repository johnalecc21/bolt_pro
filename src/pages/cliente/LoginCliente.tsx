import { Link } from "react-router-dom";
import { Building2, ClipboardCheck, Scale, ShieldCheck } from "lucide-react";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { usePageMeta } from "@/hooks/usePageMeta";

export function LoginCliente() {
  usePageMeta({ title: "Ingreso clientes", noindex: true });
  return (
    <AuthLayout
      panel={{
        etiqueta: "Portal Cliente",
        titulo: "De la solicitud al pago, en un solo lugar",
        texto:
          "Tu área de compras con proveedores homologados y cada decisión registrada.",
        puntos: [
          {
            icon: ClipboardCheck,
            titulo: "Aprobaciones en orden",
            texto:
              "La matriz envía cada requerimiento al aprobador que corresponde.",
          },
          {
            icon: Scale,
            titulo: "Compara y negocia",
            texto: "Ofertas por ítem, cuadro comparativo y subasta en vivo.",
          },
          {
            icon: ShieldCheck,
            titulo: "Proveedores verificados",
            texto: "Homologados por el equipo de compliance de Procurex.",
          },
        ],
      }}
      portal={{ icon: Building2, nombre: "Portal Cliente" }}
      titulo="Bienvenido de nuevo"
      subtitulo="Ingresa a tu portal de compras."
      pie={
        <p className="text-center text-sm text-muted-foreground">
          ¿Eres proveedor?{" "}
          <Link
            to="/proveedor/login"
            className="font-medium text-primary hover:underline"
          >
            Ingresa al portal de proveedores
          </Link>
        </p>
      }
    >
      <PortalLoginForm
        portal="cliente"
        demoHint="carlos@acme.com / demo123 (admin@acme.com tiene 2 empresas)"
      />
    </AuthLayout>
  );
}
