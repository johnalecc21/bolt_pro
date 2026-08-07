import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { apiErrorMessage } from "@/lib/api/http";

type Status = "loading" | "off" | "enrolling" | "on";

export function TwoFactorSettingsCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp.find((f) => f.status === "verified");
    if (verified) {
      setFactorId(verified.id);
      setStatus("on");
    } else {
      setStatus("off");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function startEnroll() {
    setBusy(true);
    try {
      // Clear any leftover unverified factor from a previous abandoned attempt.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.totp ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !data) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStatus("enrolling");
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo iniciar la activación de 2FA."));
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    if (!factorId || code.length < 6) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      toast.success("2FA activado", { description: "Tu cuenta ahora pide un código en cada inicio de sesión." });
      setCode("");
      setQrCode(null);
      setSecret(null);
      setStatus("on");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Código incorrecto. Intenta de nuevo."));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!factorId) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.info("2FA desactivado");
      setFactorId(null);
      setStatus("off");
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo desactivar 2FA."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        {status === "on" ? <ShieldCheck className="h-4 w-4 text-success" /> : <ShieldOff className="h-4 w-4" />}
        Verificación en dos pasos (2FA)
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">Protege tu cuenta con un código de tu app autenticadora, además de tu contraseña.</p>

      {status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

      {status === "off" && (
        <Button onClick={startEnroll} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Activar 2FA
        </Button>
      )}

      {status === "on" && (
        <div className="flex items-center justify-between rounded-lg bg-success/10 p-3">
          <span className="text-sm font-medium text-success">2FA activado</span>
          <Button variant="outline" size="sm" onClick={disable} disabled={busy}>Desactivar</Button>
        </div>
      )}

      {status === "enrolling" && qrCode && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-4">
            <img src={qrCode} alt="Código QR para 2FA" className="h-40 w-40" />
            {secret && <p className="text-center text-xs text-muted-foreground">¿No puedes escanear? Ingresa esta clave manualmente: <span className="font-mono">{secret}</span></p>}
          </div>
          <p className="text-sm text-muted-foreground">Escanea el QR con Google Authenticator, Authy u otra app TOTP, luego ingresa el código de 6 dígitos que genera.</p>
          <div className="flex flex-col items-center gap-3">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setStatus("off"); setQrCode(null); setCode(""); }} disabled={busy}>Cancelar</Button>
            <Button onClick={confirmEnroll} disabled={code.length < 6 || busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirmar y activar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
