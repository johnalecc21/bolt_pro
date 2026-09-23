import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CheckCircle2, Clock, XCircle, AlertTriangle, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiHomologacion } from "@/lib/api/homologacion";

const estadoLabel: Record<string, string> = {
  borrador: "Aún no enviada",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  zona_gris: "Zona gris — revisión manual",
};

export function EstadoHomologacion() {
  const { data: registro, loading } = useApiData(fetchMiHomologacion);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando...</div>;
  }

  if (!registro || registro.estado === "borrador") {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Aún no has enviado tu homologación.</p>
          <Button asChild className="mt-3"><Link to="/proveedor/homologacion">{registro ? "Completar homologación" : "Iniciar homologación"}</Link></Button>
        </Card>
      </div>
    );
  }

  const pendientes = registro.documentos.filter((d) => d.estado === "pendiente" || d.estado === "vencido");
  const vencidos = registro.documentos.filter((d) => d.estado === "vencido");
  const aprobadaSinPendientes = registro.estado === "aprobado" && vencidos.length === 0;
  const opcionalesPendientes = registro.documentos.filter((d) => !d.obligatorio && d.estado === "pendiente");
  const Icon = registro.estado === "aprobado" ? CheckCircle2 : registro.estado === "rechazado" ? XCircle : registro.estado === "zona_gris" ? AlertTriangle : Clock;
  const color = registro.estado === "aprobado" ? "text-success bg-success/10" : registro.estado === "rechazado" ? "text-destructive bg-destructive/10" : "text-warning-foreground bg-warning/10";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Estado de Homologación</h1>
        <p className="text-sm text-muted-foreground">Sigue el progreso de tu validación en la red Procurex</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", color)}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado actual</p>
            <p className="text-xl font-bold">{estadoLabel[registro.estado]}</p>
          </div>
          {registro.estado === "aprobado" && (
            <div className="ml-auto text-right">
              <p className="text-3xl font-bold text-primary">{registro.score}</p>
              <p className="text-xs text-muted-foreground">Score de homologación</p>
            </div>
          )}
        </div>
        {registro.proximaRevalidacion !== "—" && (
          <p className="mt-4 text-sm text-muted-foreground">Próxima re-validación: <strong>{registro.proximaRevalidacion}</strong></p>
        )}
      </Card>

      {aprobadaSinPendientes ? (
        <Card className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>
              Tus documentos obligatorios están validados y vigentes.
              {opcionalesPendientes.length > 0 &&
                ` Te faltan ${opcionalesPendientes.length} opcionales (HSE, sostenibilidad, centrales de riesgo, SARLAFT) que algunos clientes exigen para invitarte.`}
            </span>
          </div>
          {opcionalesPendientes.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link to="/proveedor/homologacion">Agregar documentos opcionales</Link>
            </Button>
          )}
        </Card>
      ) : (
        <Card className="p-6">
          <h2 className="mb-3 font-semibold">Checklist de documentos</h2>
          <div className="space-y-2">
            {registro.documentos.map((d) => (
              <div key={d.nombre} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>
                  {d.nombre}
                  {!d.obligatorio && <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>}
                </span>
                <StatusBadge estado={d.estado === "validado" ? "Activo" : d.estado === "vencido" ? "Vencido" : d.estado === "subido" ? "en_revision" : "Pendiente"} />
              </div>
            ))}
          </div>
          {(pendientes.length > 0 || registro.estado === "rechazado") && (
            <Button asChild variant="outline" className="mt-4 gap-2">
              <Link to="/proveedor/homologacion">
                <FileWarning className="h-4 w-4" />
                {vencidos.length > 0 ? "Renovar documentos vencidos" : registro.estado === "rechazado" ? "Corregir y reenviar" : "Actualizar documentos"}
              </Link>
            </Button>
          )}
        </Card>
      )}

      {registro.alertas.length > 0 && (
        <Card className="border-warning/30 bg-warning/5 p-4">
          <p className="mb-2 text-sm font-medium">Alertas</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {registro.alertas.map((a, i) => <li key={i}>• {a}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}
