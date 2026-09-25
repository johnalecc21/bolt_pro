import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, Lock, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Portal } from "@/lib/mock/users";
import { apiErrorMessage } from "@/lib/api/http";
import { supabase } from "@/lib/supabase/client";

export function PortalLoginForm({ portal, demoHint, footer }: {
  portal: Portal;
  demoHint: string;
  footer?: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, verify2FA, selectCompany, pendingUser, loginStep, oauthError, clearOauthError } = useAuth();

  const step = loginStep === "2fa" ? "2fa" : loginStep === "select-company" ? "company" : "credentials";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  useEffect(() => {
    if (oauthError) {
      toast.error(oauthError);
      clearOauthError();
    }
  }, [oauthError, clearOauthError]);

  function goToDashboard() {
    navigate(from ?? `/${portal}/dashboard`, { replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password, portal);
      if (result.status === "invalid") {
        setError(result.message ?? "Correo o contraseña incorrectos.");
      } else if (result.status === "success") {
        toast.success("Sesión iniciada correctamente");
        goToDashboard();
      }
      // "2fa_required" / "select_company" just advance `loginStep`, re-rendering below.
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos conectar con el servidor. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA() {
    setError(null);
    setLoading(true);
    const result = await verify2FA(otp);
    setLoading(false);
    if (result.status === "invalid") {
      setError("Código incorrecto. Verifica tu app autenticadora.");
      return;
    }
    if (loginStep === "done") {
      toast.success("Verificación en dos pasos completada");
      goToDashboard();
    }
    // else loginStep is now "select-company" — the form below re-renders to that step.
  }

  async function handleSelectCompany(companyId: string) {
    try {
      await selectCompany(companyId);
      toast.success("Sesión iniciada correctamente");
      goToDashboard();
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos completar el inicio de sesión."));
    }
  }

  async function handleSSO(provider: "Google") {
    setSsoLoading(provider);
    const { error } = await loginWithGoogle(portal);
    if (error) {
      setSsoLoading(null);
      toast.error(error);
    }
    // On success the browser navigates away to Google — nothing more to do here.
  }

  async function handleForgotPassword() {
    if (!email.trim()) return;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (resetError) {
      toast.error(apiErrorMessage(resetError, "No pudimos enviar el enlace de recuperación."));
      return;
    }
    setForgotSent(true);
  }

  if (step === "2fa" && pendingUser) {
    return (
      <div className="w-full space-y-5">
        <div>
          <h3 className="text-lg font-semibold">Verificación en dos pasos</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ingresa el código de tu app autenticadora para confirmar que eres {pendingUser.nombre}.</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button className="w-full" disabled={otp.length < 6 || loading} onClick={handleVerify2FA}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
        </Button>
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Código de 6 dígitos de tu app autenticadora (Google Authenticator, Authy, etc.)
        </div>
      </div>
    );
  }

  if (step === "company" && pendingUser) {
    return (
      <div className="w-full space-y-5">
        <div>
          <h3 className="text-lg font-semibold">Elige tu empresa</h3>
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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" className="h-11 pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <button type="button" onClick={() => { setForgotOpen(true); setForgotSent(false); }} className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="h-11 pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar sesión"}
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o continúa con</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="h-11 w-full gap-2.5 border-border hover:bg-muted hover:text-foreground" onClick={() => handleSSO("Google")} disabled={!!ssoLoading}>
        {ssoLoading === "Google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><IconoGoogle /> Google</>}
      </Button>
      {/* Only for demo environments: never show shared credentials on a real deployment. */}
      {import.meta.env.VITE_MOSTRAR_CREDENCIALES_DEMO === "true" && (
        <div className="mt-6 rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Demo:</span> {demoHint}
        </div>
      )}
      {footer && <div className="mt-6">{footer}</div>}

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Te enviamos un enlace real para restablecer tu contraseña si el correo existe en nuestra red.
            </DialogDescription>
          </DialogHeader>
          {forgotSent ? (
            <p className="text-sm text-muted-foreground">Enlace enviado a <span className="font-medium text-foreground">{email}</span>. Revisa tu bandeja de entrada.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Enviaremos el enlace a <span className="font-medium text-foreground">{email || "tu correo"}</span>.</p>
              <Button className="w-full" disabled={!email.trim()} onClick={handleForgotPassword}>Enviar enlace</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Google's "G", in its brand colors. */
function IconoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3a7.2 7.2 0 0 1-10.72-3.78H1.34v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.34 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.34a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 1.34 6.6l4 3.1A7.17 7.17 0 0 1 12 4.77Z" />
    </svg>
  );
}
