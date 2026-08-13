import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Trophy, FileText, PenTool, ShieldAlert, ShieldCheck, Check, Send, Loader2, FileQuestion, FileDown } from "lucide-react";
import { simulateProcess } from "@/lib/mock/simulate";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchRequerimiento } from "@/lib/api/requerimientos";
import {
  fetchAdjudicacion, confirmarAdjudicacion as apiConfirmar,
  revisionLegalAdjudicacion as apiRevisionLegal, firmarAdjudicacion as apiFirmar,
} from "@/lib/api/adjudicacion";
import { apiErrorMessage } from "@/lib/api/http";
import { generateCartaAdjudicacionPdf } from "@/lib/pdf/carta-adjudicacion";

const UMBRAL_LEGAL = 50000;

export function Adjudicacion() {
  const { id } = useParams();
  const requerimientoId = id ?? "";
  const { activeCompany } = useAuth();
  const { data: requerimiento, loading: loadingReq } = useApiData(() => fetchRequerimiento(requerimientoId), [requerimientoId]);
  const { data: adjudicacion, loading: loadingAdj, reload } = useApiData(() => fetchAdjudicacion(requerimientoId), [requerimientoId]);
  const [notificarPerdedores, setNotificarPerdedores] = useState(true);
  const [firmando, setFirmando] = useState<string | null>(null);
  const [firmaError, setFirmaError] = useState<string | null>(null);
  const [firmaIntentos, setFirmaIntentos] = useState(0);

  if (loadingReq || loadingAdj) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando adjudicación...</div>;
  }

  if (!requerimiento || !adjudicacion) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileQuestion}
          title="Este requerimiento aún no tiene adjudicación"
          description="La adjudicación solo está disponible después de comparar ofertas o cerrar una ronda de negociación."
        />
      </div>
    );
  }

  const presupuestoInicial = requerimiento.montoEstimado;
  const ahorro = presupuestoInicial - adjudicacion.precioFinal;
  const ahorroPct = Math.round((ahorro / presupuestoInicial) * 100);
  const requiereLegal = adjudicacion.precioFinal > UMBRAL_LEGAL;
  const puedeFirmar = adjudicacion.confirmada && (!requiereLegal || adjudicacion.revisionLegal);

  async function confirmarAdjudicacionClick() {
    try {
      await apiConfirmar(requerimientoId);
      toast.success("Adjudicación confirmada", { description: `${adjudicacion!.proveedor} fue notificado.` });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function descargarCarta() {
    if (!adjudicacion || !requerimiento) return;
    generateCartaAdjudicacionPdf({
      poId: adjudicacion.poId,
      cliente: activeCompany?.nombre ?? "",
      proveedor: adjudicacion.proveedor,
      tituloProceso: requerimiento.titulo,
      precioFinal: adjudicacion.precioFinal,
      plazoDias: adjudicacion.plazoDias,
      condicionesPagoDias: adjudicacion.condicionesPagoDias,
      garantiaMeses: adjudicacion.garantiaMeses,
    });
  }

  async function completarRevisionLegal() {
    try {
      await apiRevisionLegal(requerimientoId);
      toast.success("Revisión legal completada");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function enviarAFirma() {
    setFirmando("Preparando documento...");
    setFirmaError(null);
    await simulateProcess([{ label: "Enviando a DocuSign...", duration: 700 }], (label) => setFirmando(label));
    // First attempt deterministically fails so the error path is easy to demo/QA.
    if (firmaIntentos === 0) {
      setFirmaIntentos(1);
      setFirmando(null);
      setFirmaError("No pudimos conectar con DocuSign. Verifica tu conexión e inténtalo de nuevo en unos minutos.");
      return;
    }
    await simulateProcess(
      [
        { label: "Recolectando firmas...", duration: 900 },
      ],
      (label) => setFirmando(label)
    );
    try {
      await apiFirmar(requerimientoId, notificarPerdedores);
      setFirmando(null);
      reload();
      if (notificarPerdedores) {
        toast.success("Contrato firmado", { description: "Se notificó a los proveedores no ganadores con feedback estructurado." });
      } else {
        toast.success("Contrato firmado");
      }
    } catch (err) {
      setFirmando(null);
      setFirmaError(apiErrorMessage(err, "No se pudo firmar el contrato."));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Adjudicación y Cierre</h1>
        <p className="text-sm text-muted-foreground">{requerimientoId} · Formalización de la decisión final</p>
      </div>

      {/* Winner */}
      <Card className="overflow-hidden">
        <div className="gradient-brand p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Trophy className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-white/70">Proveedor ganador</p>
              <h2 className="text-2xl font-bold">{adjudicacion.proveedor}</h2>
              <p className="text-sm text-white/70">Score: {adjudicacion.proveedorScore}★ · {adjudicacion.proveedorUbicacion}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Precio final", `$${adjudicacion.precioFinal.toLocaleString()}`],
              ["Plazo de entrega", `${adjudicacion.plazoDias} días`],
              ["Condiciones de pago", `${adjudicacion.condicionesPagoDias} días`],
              ["Garantía", `${adjudicacion.garantiaMeses} meses`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-1 font-semibold">{v}</p>
              </div>
            ))}
          </div>
          {!adjudicacion.confirmada && (
            <ConfirmDialog
              trigger={<Button className="mt-4"><Check className="mr-2 h-4 w-4" /> Confirmar adjudicación</Button>}
              title="Confirmar adjudicación"
              description={`${adjudicacion.proveedor} será notificado como ganador. Esta decisión queda registrada en el log de auditoría.`}
              confirmLabel="Confirmar"
              onConfirm={confirmarAdjudicacionClick}
            />
          )}
          {adjudicacion.confirmada && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-medium text-success"><ShieldCheck className="h-4 w-4" /> Adjudicación confirmada</p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={descargarCarta}>
                <FileDown className="h-3.5 w-3.5" /> Descargar carta de adjudicación
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Savings */}
      <Card className="border-success/30 bg-success/5 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Ahorro logrado</p>
            <p className="text-2xl font-bold text-success">${ahorro.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{ahorroPct}% del presupuesto inicial (${presupuestoInicial.toLocaleString()})</p>
          </div>
        </div>
      </Card>

      {/* PO Preview */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Orden de Compra (PO) — Vista previa</h2>
        </div>
        <div className="rounded-lg border border-border p-5 font-mono text-sm">
          <div className="mb-4 flex justify-between border-b border-border pb-3">
            <p className="font-bold">{activeCompany?.nombre}</p>
            <div className="text-right">
              <p className="font-bold">ORDEN DE COMPRA</p>
              <p className="text-xs text-muted-foreground">{adjudicacion.poId}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><span>Proveedor:</span><span className="font-medium">{adjudicacion.proveedor}</span></div>
            <div className="flex justify-between"><span>Servicio:</span><span className="font-medium">{requerimiento.titulo}</span></div>
            <div className="flex justify-between"><span>Monto total:</span><span className="font-bold">${adjudicacion.precioFinal.toLocaleString()} USD</span></div>
            <div className="flex justify-between"><span>Plazo:</span><span className="font-medium">{adjudicacion.plazoDias} días</span></div>
            <div className="flex justify-between"><span>Pago:</span><span className="font-medium">{adjudicacion.condicionesPagoDias} días netos</span></div>
          </div>
        </div>
      </Card>

      {/* Legal review */}
      {requiereLegal && (
        <Card className={adjudicacion.revisionLegal ? "border-success/30 bg-success/5 p-4" : "border-warning/30 bg-warning/5 p-4"}>
          <div className="flex items-center gap-3">
            {adjudicacion.revisionLegal ? <ShieldCheck className="h-5 w-5 text-success" /> : <ShieldAlert className="h-5 w-5 text-warning-foreground" />}
            <div className="flex-1">
              <p className="text-sm">
                {adjudicacion.revisionLegal ? (
                  <strong>Revisión legal completada</strong>
                ) : (
                  <>
                    <strong>Requiere revisión legal</strong> — El monto supera $50,000. El contrato quedará bloqueado hasta la aprobación del equipo legal.
                  </>
                )}
              </p>
            </div>
            {!adjudicacion.revisionLegal && (
              <Button size="sm" variant="outline" onClick={completarRevisionLegal}>Marcar como revisado</Button>
            )}
          </div>
        </Card>
      )}

      {/* Contract preview */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <PenTool className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Contrato — Vista previa editable</h2>
        </div>
        <div className="rounded-lg border border-border p-5 text-sm">
          <p className="mb-3 font-medium">Contrato de Prestación de Servicios</p>
          <p className="text-muted-foreground">Entre <span className="rounded bg-primary/10 px-1 font-medium text-primary">{activeCompany?.nombre}</span> y <span className="rounded bg-primary/10 px-1 font-medium text-primary">{adjudicacion.proveedor}</span>, con fecha de inicio <span className="rounded bg-primary/10 px-1 font-medium text-primary">{new Date().toLocaleDateString("es-CO")}</span> y duración de <span className="rounded bg-primary/10 px-1 font-medium text-primary">12 meses</span>...</p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox id="notify-losers" checked={notificarPerdedores} onCheckedChange={(v) => setNotificarPerdedores(v === true)} disabled={adjudicacion.yaFirmado} />
          <Label htmlFor="notify-losers" className="text-sm font-normal">Notificar proveedores no ganadores (con feedback automático)</Label>
        </div>
        {adjudicacion.yaFirmado ? (
          <span className="flex items-center gap-2 text-sm font-medium text-success"><ShieldCheck className="h-4 w-4" /> Contrato firmado</span>
        ) : firmando ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {firmando}
          </Button>
        ) : (
          <ConfirmDialog
            trigger={
              <Button disabled={!puedeFirmar}>
                <Send className="mr-2 h-4 w-4" /> Enviar a firma electrónica
              </Button>
            }
            title="Enviar a firma electrónica"
            description="Se generará el contrato final y se enviará a DocuSign para firma. Esta acción no se puede deshacer."
            confirmLabel="Enviar"
            onConfirm={enviarAFirma}
          />
        )}
      </div>
      {firmaError && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <span>{firmaError}</span>
          <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0" onClick={enviarAFirma}>
            Reintentar
          </Button>
        </div>
      )}
      {!puedeFirmar && !adjudicacion.yaFirmado && (
        <p className="text-right text-xs text-muted-foreground">
          {!adjudicacion.confirmada ? "Confirma la adjudicación antes de enviar a firma." : "Completa la revisión legal antes de enviar a firma."}
        </p>
      )}
    </div>
  );
}
