import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2, ShieldCheck, PartyPopper, FileText, Users2, CheckCircle2,
  ArrowRight, ArrowLeft, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiPerfil, actualizarMiPerfil, completarOnboardingProveedor } from "@/lib/api/proveedores";
import { apiErrorMessage } from "@/lib/api/http";
import { LogoIcon } from "@/components/shared/Logo";

const CATEGORIAS = ["Tecnología", "Servicios Generales", "Materia Prima", "Logística", "Marketing"];

const steps = [
  { id: 0, label: "Empresa", icon: Building2 },
  { id: 1, label: "Homologación", icon: ShieldCheck },
  { id: 2, label: "Listo", icon: PartyPopper },
];

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

  async function siguiente() {
    if (step === 0) {
      setGuardando(true);
      try {
        await actualizarMiPerfil({ nombre, categorias: [categoria], ubicacion });
        setStep(1);
      } catch (err) {
        toast.error(apiErrorMessage(err, "No se pudieron guardar los datos."));
      } finally {
        setGuardando(false);
      }
      return;
    }
    setStep((s) => Math.min(2, s + 1));
  }

  function anterior() {
    setStep((s) => Math.max(0, s - 1));
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
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 text-center">
          <LogoIcon className="mx-auto mb-3 h-12 w-12" />
          <h1 className="text-2xl font-bold">Bienvenido a la red de proveedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Te acompañamos en los primeros pasos</p>
        </div>

        <div className="mb-10 flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    step > s.id
                      ? "border-success bg-success text-success-foreground"
                      : step === s.id
                        ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg"
                        : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={cn("text-xs font-medium", step >= s.id ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("mx-2 h-0.5 flex-1 rounded-full transition-colors", step > s.id ? "bg-success" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <Card className="p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Datos de tu empresa</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razón social</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Bogotá, Colombia" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Así funciona tu homologación</h2>
              <p className="text-sm text-muted-foreground">Lo que sigue apenas termines este onboarding</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {explicacion.map((e) => (
                  <div key={e.title} className="flex gap-3 rounded-xl border border-border p-4">
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
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <PartyPopper className="h-10 w-10 text-success" />
              <h2 className="text-xl font-semibold">Todo listo, {nombre || "bienvenido"}</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Lo único que falta para empezar a recibir invitaciones es completar y enviar tu homologación.
              </p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-end border-t pt-6">
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={anterior} disabled={guardando || finalizando}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
              )}
              {step < 2 ? (
                <Button className="gap-2" onClick={siguiente} disabled={guardando || !nombre.trim()}>
                  {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Siguiente <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="gap-2 gradient-success text-white" onClick={finalizar} disabled={finalizando}>
                  {finalizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Ir a mi homologación
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
