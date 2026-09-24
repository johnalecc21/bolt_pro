import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight, Building2, Users, ShieldCheck, Wallet, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";
import { fetchUsuarios } from "@/lib/api/usuarios";
import { fetchConfigEmpresa, fetchMatrizAprobacion } from "@/lib/api/matrizAprobacion";
import { fetchEstructura } from "@/lib/api/estructura";
import { fetchRequerimientosPagina } from "@/lib/api/requerimientos";
import { useAuth } from "@/lib/auth/AuthContext";

interface Paso {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  hecho: boolean;
  opcional?: boolean;
  to: string;
  accion: string;
}

/**
 * Real setup checklist for a new company: every item reads the company's
 * actual data and links to the screen where it is configured.
 */
export function OnboardingWizard() {
  const { activeCompany } = useAuth();
  const { data, loading } = useApiData(async () => {
    const [config, usuarios, reglas, estructura, requerimientos] = await Promise.all([
      fetchConfigEmpresa(),
      fetchUsuarios(),
      fetchMatrizAprobacion(),
      fetchEstructura(),
      fetchRequerimientosPagina({ page: 1, limit: 1 }),
    ]);
    return { config, usuarios, reglas, estructura, requerimientos };
  }, [activeCompany?.id]);

  const pasos: Paso[] = data
    ? [
        {
          icon: Building2,
          titulo: "Datos de la empresa",
          descripcion: `País ${data.config.pais} · moneda base ${data.config.monedaBase}. Revísalos: definen la moneda de requerimientos y reportes.`,
          hecho: true,
          to: "/cliente/matriz-aprobacion",
          accion: "Revisar",
        },
        {
          icon: Users,
          titulo: "Invita a tu equipo",
          descripcion: "Compradores que crean requerimientos y aprobadores (CFO) que los autorizan.",
          hecho: data.usuarios.filter((u) => u.activo).length > 1,
          to: "/cliente/usuarios",
          accion: "Invitar usuarios",
        },
        {
          icon: ShieldCheck,
          titulo: "Matriz de aprobación",
          descripcion: "Quién aprueba cada compra según su monto. Sin reglas, aprueban el administrador o el CFO.",
          hecho: data.reglas.length > 0,
          to: "/cliente/matriz-aprobacion",
          accion: "Configurar reglas",
        },
        {
          icon: Wallet,
          titulo: "Centros de costo y presupuesto",
          descripcion: "Controla cuánto se compromete por área y detecta excepciones de presupuesto.",
          hecho: data.estructura.centros.length > 0,
          opcional: true,
          to: "/cliente/estructura",
          accion: "Crear centros de costo",
        },
        {
          icon: FileText,
          titulo: "Primer requerimiento",
          descripcion: "Describe la necesidad, fija presupuesto y fecha de cierre, e invita proveedores homologados.",
          hecho: data.requerimientos.total > 0,
          to: "/cliente/requerimientos/nuevo",
          accion: "Crear requerimiento",
        },
      ]
    : [];

  const hechos = pasos.filter((p) => p.hecho).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Configura tu empresa</h1>
        <p className="text-sm text-muted-foreground">Estos pasos se marcan solos a medida que configuras la plataforma.</p>
      </div>

      {loading || !data ? (
        <TableSkeleton rows={5} />
      ) : (
        <>
          <Card className="p-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">{hechos} de {pasos.length} pasos listos</span>
              <span className="text-muted-foreground">{Math.round((hechos / pasos.length) * 100)}%</span>
            </div>
            <Progress value={(hechos / pasos.length) * 100} />
          </Card>

          <div className="space-y-3">
            {pasos.map((p) => (
              <Card key={p.titulo} className="flex flex-row items-start gap-4 p-5">
                {p.hecho ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-label="Completado" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-label="Pendiente" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p.icon className="h-4 w-4 text-primary" />
                    <p className="font-medium">{p.titulo}</p>
                    {p.opcional && <span className="text-xs text-muted-foreground">(opcional)</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.descripcion}</p>
                </div>
                <Button asChild size="sm" variant={p.hecho ? "ghost" : "default"} className="shrink-0 gap-1">
                  <Link to={p.to}>
                    {p.accion} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
