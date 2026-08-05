import { useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { DEMO_2FA_CODE, type Portal } from "@/lib/mock/users";
import { sleep } from "@/lib/mock/simulate";

type Step = "credentials" | "2fa" | "company";

export function PortalLoginForm({ portal, demoHint, footer }: {
  portal: Portal;
  demoHint: string;
  footer?: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verify2FA, selectCompany, pendingUser } = useAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  function goToDashboard() {
    navigate(from ?? `/${portal}/dashboard`, { replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password, portal);
    setLoading(false);
    if (result.status === "invalid") {
      setError(`Correo o contraseña incorrectos. Intentos restantes: ${result.attemptsLeft ?? 0}.`);
    } else if (result.status === "locked") {
      setError("Cuenta bloqueada por demasiados intentos fallidos. Intenta de nuevo más tarde.");
    } else if (result.status === "2fa_required") {
      setStep("2fa");
    } else if (result.status === "select_company") {
      setStep("company");
    } else if (result.status === "success") {
      toast.success("Sesión iniciada correctamente");
      goToDashboard();
    }
  }

  async function handleVerify2FA() {
    setError(null);
    setLoading(true);
    const ok = await verify2FA(otp);
    setLoading(false);
    if (!ok) {
      setError("Código incorrecto. Usa el código de demo mostrado abajo.");
      return;
    }
    if (pendingUser && pendingUser.companies.length > 1) {
      setStep("company");
    } else {
      toast.success("Verificación en dos pasos completada");
      goToDashboard();
    }
  }

  function handleSelectCompany(companyId: string) {
    selectCompany(companyId);
    toast.success("Sesión iniciada correctamente");
    goToDashboard();
  }

  async function handleSSO(provider: string) {
    setSsoLoading(provider);
    await sleep(900);
    setSsoLoading(null);
    toast.info(`Autenticación con ${provider} no disponible en este entorno de demostración.`);
  }

  if (step === "2fa" && pendingUser) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Verificación en dos pasos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ingresa el código de 6 dígitos para confirmar que eres {pendingUser.nombre}.</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button className="w-full gradient-brand text-white" disabled={otp.length < 6 || loading} onClick={handleVerify2FA}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
        </Button>
        <div className="rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Código de demo:</span> {DEMO_2FA_CODE}
        </div>
      </div>
    );
  }

  if (step === "company" && pendingUser) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Elige tu empresa</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tu usuario tiene acceso a varias empresas.</p>
        </div>
        <div className="space-y-2">
          {pendingUser.companies.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectCompany(c.id)}
              className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left text-sm font-medium hover:border-primary hover:bg-primary/5"
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" placeholder="nombre@empresa.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Recordarme</Label>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" className="w-full gradient-brand text-white hover:opacity-90" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar sesión"}
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o continúa con</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => handleSSO("Google")} disabled={!!ssoLoading}>
          {ssoLoading === "Google" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Google"}
        </Button>
        <Button variant="outline" onClick={() => handleSSO("Microsoft")} disabled={!!ssoLoading}>
          {ssoLoading === "Microsoft" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Microsoft"}
        </Button>
      </div>
      <div className="mt-6 rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Demo:</span> {demoHint}
      </div>
      {footer && <div className="mt-6">{footer}</div>}

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Si el correo existe en nuestra red, te enviamos un enlace para restablecer tu contraseña.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Enlace enviado a <span className="font-medium text-foreground">{email || "tu correo"}</span> (simulado).</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
