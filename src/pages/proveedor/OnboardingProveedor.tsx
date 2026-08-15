import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, ShieldCheck, Users2, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiPerfil, actualizarMiPerfil, completarOnboardingProveedor } from "@/lib/api/proveedores";
import { apiErrorMessage } from "@/lib/api/http";

const CATEGORIAS = ["Tecnología", "Servicios Generales", "Materia Prima", "Logística", "Marketing"];
const steps = ["Datos de tu empresa", "Cómo funciona tu homologación", "Listo para empezar"];

const explicacion = [
  {
    icon: FileText,
    title: "Sube tus documentos",
    description: "RUT/NIT, estados financieros, certificaciones y referencias comerciales, organizados por categoría.",
  },
  {
    icon: ShieldCheck,
    title: "Verificación automática",
    description: "Cada documento pasa por OCR y cruce contra la lista de sanciones OFAC/SDN apenas lo subes.",
  },
  {
    icon: Users2,
    title: "Revisión de Compliance",
    description: "Si algo queda en zona gris, nuestro equipo lo revisa a mano — nunca un rechazo automático sin contexto.",
  },
  {
    icon: CheckCircle2,
    title: "Quedas habilitado",
    description: "Una vez aprobada, tu empresa aparece en el directorio y puede recibir invitaciones a licitar.",
  },
];

export function OnboardingProveedor() {
  const { data: perfil, loading } = useApiData(fetchMiPerfil);
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [ubicacion, setUbicacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre);
    setCategoria(perfil.categorias[0] ?? CATEGORIAS[0]);
    setUbicacion(perfil.ubicacion);
  }, [perfil]);

  async function guardarDatos() {
    setGuardando(true);
    try {
      await actualizarMiPerfil({ nombre, categorias: [categoria], ubicacion });
      setStep(1);
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudieron guardar los datos."));
    } finally {
      setGuardando(false);
    }
  }

  async function finalizar() {
    setFinalizando(true);
    try {
      await completarOnboardingProveedor();
      // Hard navigation instead of react-router's navigate(): ProveedorLayout holds
      // its own stale fetch of `perfil` (onboardingCompletado: false) from before this
      // call, and a soft navigate would re-render it with that cached value, bouncing
      // straight back to /proveedor/onboarding. Reloading forces a fresh fetch.
      window.location.assign("/proveedor/homologacion");
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo completar el onboarding."));
      setFinalizando(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenido a Procurex</h1>
        <p className="text-sm text-muted-foreground">Antes de empezar, completemos algunos datos.</p>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i < step ? "bg-success text-white" : i === step ? "gradient-brand text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && <div className={cn("h-0.5 flex-1", i < step ? "bg-success" : "bg-muted")} />}
          </div>
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{steps[step]}</p>

      {step === 0 && (
        <Card className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label>Razón social</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Categoría principal</Label>
              <select
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Ubicación</Label>
              <Input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Bogotá, Colombia" />
            </div>
          </div>
          <Button className="gap-2" onClick={guardarDatos} disabled={guardando || !nombre.trim()}>
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Continuar
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {explicacion.map((e) => (
              <div key={e.title} className="flex gap-3 rounded-lg border border-border p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <e.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="gap-2" onClick={() => setStep(2)}>
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <p className="font-medium">Todo listo, {nombre || "bienvenido"}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Lo único que falta para empezar a recibir invitaciones es completar y enviar tu homologación.
          </p>
          <Button className="mt-2 gap-2" onClick={finalizar} disabled={finalizando}>
            {finalizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Ir a mi homologación
          </Button>
        </Card>
      )}
    </div>
  );
}
