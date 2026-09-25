import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Clock, XCircle, AlertTriangle, ArrowRight, Inbox, FileText, FileCheck2, Wallet, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchMiHomologacion, NIVEL_RIESGO_INFO } from "@/lib/api/homologacion";
import { fetchInvitaciones } from "@/lib/api/invitaciones";
import { fetchMisOfertas } from "@/lib/api/ofertas";
import { fetchMisContratos } from "@/lib/api/contratos";
import { fetchMisPagos } from "@/lib/api/pagos";

export function DashboardProveedor() {
  const { activeCompany } = useAuth();
  const { data: homologacion, loading: loadingHom } = useApiData(fetchMiHomologacion);
  const { data: invitaciones } = useApiData(fetchInvitaciones);
  const { data: ofertas } = useApiData(fetchMisOfertas);
  const { data: contratos } = useApiData(fetchMisContratos);
  const { data: pagos } = useApiData(fetchMisPagos);

  const aprobado = homologacion?.estado === "aprobado";
  const nuevasInvitaciones = (invitaciones ?? []).filter((i) => i.estado === "nueva");
  const ofertasPorEnviar = (ofertas ?? []).filter((o) => !o.enviada);
  const contratosActivos = (contratos ?? []).filter((c) => c.estado === "Activo" || c.estado === "Por vencer");
  const pagosPendientes = (pagos ?? []).filter((p) => p.estado !== "pagado");

  const pendientes = [
    ...nuevasInvitaciones.map((i) => ({
      key: `inv-${i.id}`,
      icon: Inbox,
      texto: `Nueva invitación a licitar: ${i.titulo || i.categoria}`,
      sub: `${i.cliente} · cierra ${i.fechaLimite}`,
      to: "/proveedor/invitaciones",
      cta: "Responder",
    })),
    ...ofertasPorEnviar.map((o) => ({
      key: `of-${o.requerimientoId}`,
      icon: FileText,
      texto: `Oferta sin enviar: ${o.titulo}`,
      sub: `${o.cliente} · cierra ${o.fechaLimite}`,
      to: `/proveedor/ofertas/${o.requerimientoId}`,
      cta: "Completar",
    })),
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Hola{activeCompany?.nombre ? `, ${activeCompany.nombre}` : ""}</h1>
        <p className="text-sm text-muted-foreground">Este es el resumen de tu actividad en la red Procurex</p>
      </div>

      <HomologacionCard homologacion={homologacion} loading={loadingHom} />

      {aprobado && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricaTile to="/proveedor/invitaciones" icon={Inbox} valor={nuevasInvitaciones.length} label="Invitaciones nuevas" resaltar={nuevasInvitaciones.length > 0} />
            <MetricaTile to="/proveedor/ofertas" icon={FileText} valor={ofertasPorEnviar.length} label="Ofertas por enviar" resaltar={ofertasPorEnviar.length > 0} />
            <MetricaTile to="/proveedor/contratos" icon={FileCheck2} valor={contratosActivos.length} label="Contratos activos" />
            <MetricaTile to="/proveedor/pagos" icon={Wallet} valor={pagosPendientes.length} label="Pagos pendientes" />
          </div>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Requiere tu atención</h2>
            {pendientes.length === 0 ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" /> Estás al día. No tienes acciones pendientes.
              </div>
            ) : (
              <div className="space-y-2">
                {pendientes.map((p) => (
                  <Link
                    key={p.key}
                    to={p.to}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <p.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.texto}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.sub}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                      {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function HomologacionCard({
  homologacion,
  loading,
}: {
  homologacion: import("@/lib/api/homologacion").RegistroHomologacion | null;
  loading: boolean;
}) {
  if (loading) {
    return <Card className="p-6 text-sm text-muted-foreground">Cargando estado de homologación...</Card>;
  }

  const estado = homologacion?.estado ?? "borrador";
  const config = {
    borrador: {
      icon: ShieldCheck, tone: "text-primary bg-primary/10",
      titulo: "Completa tu homologación",
      desc: "Homológate una vez y participa en los procesos de todas las empresas de Procurex, sin esperar invitación.",
      cta: { label: "Continuar homologación", to: "/proveedor/homologacion" },
    },
    en_revision: {
      icon: Clock, tone: "text-warning-foreground bg-warning/10",
      titulo: "Homologación en revisión",
      desc: "Nuestro equipo está validando tu información. Te avisaremos del resultado.",
      cta: { label: "Ver estado", to: "/proveedor/homologacion" },
    },
    zona_gris: {
      icon: AlertTriangle, tone: "text-warning-foreground bg-warning/10",
      titulo: "Homologación en revisión manual",
      desc: "Compliance está revisando algunos hallazgos de la verificación automática.",
      cta: { label: "Ver estado", to: "/proveedor/homologacion" },
    },
    rechazado: {
      icon: XCircle, tone: "text-destructive bg-destructive/10",
      titulo: "Homologación rechazada",
      desc: "Corrige lo indicado y vuelve a enviarla para ser considerado.",
      cta: { label: "Corregir y reenviar", to: "/proveedor/homologacion" },
    },
    aprobado: {
      icon: CheckCircle2, tone: "text-success bg-success/10",
      titulo: "Estás homologado",
      desc: "Tu empresa aparece en la red y puedes unirte a los procesos abiertos de todas las empresas de Procurex.",
      cta: { label: "Ver oportunidades de la red", to: "/proveedor/oportunidades" },
    },
  }[estado];

  const Icon = config.icon;
  const mostrarScore = estado === "aprobado" && !!homologacion;

  return (
    <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", config.tone)}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold">{config.titulo}</p>
        <p className="text-sm text-muted-foreground">{config.desc}</p>
      </div>
      {mostrarScore && (
        <div className="flex items-center gap-6 border-border sm:border-l sm:pl-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{homologacion!.score}</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
          {homologacion!.nivelRiesgo && (
            <div className="text-center">
              <p className="text-sm font-semibold">{NIVEL_RIESGO_INFO[homologacion!.nivelRiesgo].label}</p>
              <p className="text-xs text-muted-foreground">Riesgo</p>
            </div>
          )}
        </div>
      )}
      <Button asChild variant={estado === "aprobado" ? "outline" : "default"} className="shrink-0">
        <Link to={config.cta.to}>{config.cta.label}</Link>
      </Button>
    </Card>
  );
}

function MetricaTile({
  to,
  icon: Icon,
  valor,
  label,
  resaltar,
}: {
  to: string;
  icon: typeof Inbox;
  valor: number;
  label: string;
  resaltar?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-accent",
        resaltar ? "border-primary/40 bg-primary/5" : "border-border",
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", resaltar ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}
