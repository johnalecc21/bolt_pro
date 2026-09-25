import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Trophy, FileText, ShieldAlert, ShieldCheck, Check, Send, Loader2, FileQuestion, FileDown, Split, CircleSlash } from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchRequerimiento } from "@/lib/api/requerimientos";
import {
  fetchAdjudicacion, confirmarAdjudicacion as apiConfirmar,
  revisionLegalAdjudicacion as apiRevisionLegal, firmarAdjudicacion as apiFirmar,
  type Adjudicacion as AdjudicacionProveedor, type AdjudicacionProceso,
} from "@/lib/api/adjudicacion";
import { apiErrorMessage } from "@/lib/api/http";
import { generateCartaAdjudicacionPdf } from "@/lib/pdf/carta-adjudicacion";
import { formatMoney, type Moneda } from "@/lib/moneda";
import { useIncrustado } from "@/components/layout/Incrustado";

const fmtCantidad = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 3 });

export function Adjudicacion() {
  const { id } = useParams();
  const incrustado = useIncrustado();
  const requerimientoId = id ?? "";
  const { data: requerimiento, loading: loadingReq } = useApiData(() => fetchRequerimiento(requerimientoId), [requerimientoId]);
  const { data: proceso, loading: loadingAdj, reload } = useApiData(() => fetchAdjudicacion(requerimientoId), [requerimientoId]);
  const [notificarPerdedores, setNotificarPerdedores] = useState(true);

  if (loadingReq || loadingAdj) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando adjudicación...</div>;
  }

  if (!requerimiento || !proceso) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileQuestion}
          title="Este requerimiento aún no tiene adjudicación"
          description="Elige al ganador (o los ganadores por ítem) desde el cuadro comparativo, o cierra la ronda de negociación para adjudicar a la mejor puja."
        />
        {requerimientoId && (
          <div className="mt-4 flex justify-center">
            <Button asChild variant="outline">
              <Link to={`/cliente/procesos/${requerimientoId}/comparativo`}>Ir al cuadro comparativo</Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  const moneda = proceso.moneda;
  const dividida = proceso.adjudicaciones.length > 1;
  const presupuestoInicial = requerimiento.montoEstimado;
  const ahorro = presupuestoInicial - proceso.total;
  const ahorroPct = presupuestoInicial > 0 ? Math.round((ahorro / presupuestoInicial) * 100) : 0;
  const pendientesFirma = proceso.adjudicaciones.filter((a) => !a.yaFirmado).length;

  async function confirmarClick() {
    try {
      await apiConfirmar(requerimientoId);
      toast.success("Adjudicación confirmada", {
        description: dividida ? "Los proveedores seleccionados fueron notificados." : `${proceso!.adjudicaciones[0].proveedor} fue notificado.`,
      });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className={incrustado ? "space-y-6" : "space-y-6 p-6"}>
      {!incrustado && (
        <div>
          <h1 className="text-2xl font-bold">Adjudicación y Cierre</h1>
          <p className="text-sm text-muted-foreground">{requerimiento.codigo} · {requerimiento.titulo}</p>
        </div>
      )}

      {/* Decision summary */}
      <Card className="overflow-hidden">
        <div className="gradient-brand p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              {dividida ? <Split className="h-7 w-7" /> : <Trophy className="h-7 w-7" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white/70">{dividida ? `Adjudicación por ítems a ${proceso.adjudicaciones.length} proveedores` : "Proveedor ganador"}</p>
              <h2 className="truncate text-2xl font-bold">{proceso.adjudicaciones.map((a) => a.proveedor).join(" · ")}</h2>
              <p className="text-sm text-white/70">Total adjudicado: {formatMoney(proceso.total, moneda)}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          {proceso.confirmada ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success"><ShieldCheck className="h-4 w-4" /> Adjudicación confirmada</p>
          ) : (
            <ConfirmDialog
              trigger={<Button><Check className="mr-2 h-4 w-4" /> Confirmar adjudicación</Button>}
              title="Confirmar adjudicación"
              description={`${dividida ? "Cada proveedor seleccionado" : proceso.adjudicaciones[0].proveedor} será notificado como ganador. Esta decisión queda registrada en el log de auditoría.`}
              confirmLabel="Confirmar"
              onConfirm={confirmarClick}
            />
          )}
          {proceso.firmada ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success"><ShieldCheck className="h-4 w-4" /> {dividida ? "Todos los contratos firmados" : "Contrato firmado"}</p>
          ) : proceso.confirmada ? (
            <p className="text-sm text-muted-foreground">{pendientesFirma} contrato(s) pendiente(s) de firma</p>
          ) : null}
        </div>
      </Card>

      {/* Savings */}
      <Card className="border-success/30 bg-success/5 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{ahorro >= 0 ? "Ahorro logrado" : "Sobrecosto frente al presupuesto"}</p>
            <p className={`text-2xl font-bold ${ahorro >= 0 ? "text-success" : "text-destructive"}`}>{formatMoney(Math.abs(ahorro), moneda)}</p>
            <p className="text-sm text-muted-foreground">{Math.abs(ahorroPct)}% del presupuesto inicial ({formatMoney(presupuestoInicial, moneda)})</p>
          </div>
        </div>
      </Card>

      {proceso.itemsDesiertos.length > 0 && (
        <Card className="border-warning/30 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <CircleSlash className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" />
            <div className="text-sm">
              <p className="font-medium">{proceso.itemsDesiertos.length} ítem(s) sin adjudicar (desiertos)</p>
              <p className="text-muted-foreground">{proceso.itemsDesiertos.map((i) => `${i.descripcion} (${fmtCantidad(i.cantidad)} ${i.unidad})`).join(" · ")}. Si aún los necesitas, crea un nuevo requerimiento para ellos.</p>
            </div>
          </div>
        </Card>
      )}

      {proceso.adjudicaciones.map((a) => (
        <TarjetaAdjudicacion
          key={a.id}
          requerimientoId={requerimientoId}
          titulo={requerimiento.titulo}
          adjudicacion={a}
          proceso={proceso}
          moneda={moneda}
          notificarPerdedores={notificarPerdedores}
          esUltimaFirma={pendientesFirma === 1 && !a.yaFirmado}
          onCambio={reload}
        />
      ))}

      {!proceso.firmada && (
        <div className="flex items-center gap-2">
          <Checkbox id="notify-losers" checked={notificarPerdedores} onCheckedChange={(v) => setNotificarPerdedores(v === true)} />
          <Label htmlFor="notify-losers" className="text-sm font-normal">
            Notificar a los proveedores no ganadores (con feedback automático){dividida ? " al firmar el último contrato" : ""}
          </Label>
        </div>
      )}
    </div>
  );
}

function TarjetaAdjudicacion({
  requerimientoId, titulo, adjudicacion: a, proceso, moneda, notificarPerdedores, esUltimaFirma, onCambio,
}: {
  requerimientoId: string;
  titulo: string;
  adjudicacion: AdjudicacionProveedor;
  proceso: AdjudicacionProceso;
  moneda: Moneda;
  notificarPerdedores: boolean;
  esUltimaFirma: boolean;
  onCambio: () => void;
}) {
  const { activeCompany } = useAuth();
  const [firmando, setFirmando] = useState(false);
  const [firmaError, setFirmaError] = useState<string | null>(null);
  const puedeFirmar = a.confirmada && (!a.requiereRevisionLegal || a.revisionLegal);

  function descargarCarta() {
    generateCartaAdjudicacionPdf({
      poId: a.poId,
      cliente: activeCompany?.nombre ?? "",
      proveedor: a.proveedor,
      tituloProceso: a.lineas.length ? `${titulo} (${a.lineas.length} ítem(s))` : titulo,
      precioFinal: a.precioFinal,
      moneda,
      plazoDias: a.plazoDias,
      condicionesPagoDias: a.condicionesPagoDias,
      garantiaMeses: a.garantiaMeses,
    });
  }

  async function completarRevisionLegal() {
    try {
      await apiRevisionLegal(requerimientoId, a.id);
      toast.success("Revisión legal completada");
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function firmar() {
    setFirmando(true);
    setFirmaError(null);
    try {
      const r = await apiFirmar(requerimientoId, a.id, notificarPerdedores);
      onCambio();
      toast.success(`Contrato con ${a.proveedor} firmado`, {
        description: r.completo
          ? notificarPerdedores
            ? "Se generó el contrato con sus hitos y se notificó a los proveedores no ganadores."
            : "Se generó el contrato con sus hitos de seguimiento."
          : "Se generó el contrato con sus hitos. Quedan contratos de este proceso por firmar.",
      });
    } catch (err) {
      setFirmaError(apiErrorMessage(err, "No se pudo firmar el contrato."));
    } finally {
      setFirmando(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{a.poId}</p>
          <h2 className="text-lg font-semibold">{a.proveedor}</h2>
        </div>
        <div className="flex items-center gap-2">
          {a.yaFirmado ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-success"><ShieldCheck className="h-4 w-4" /> Contrato firmado</span>
          ) : a.confirmada ? (
            <span className="text-sm text-muted-foreground">Pendiente de firma</span>
          ) : (
            <span className="text-sm text-muted-foreground">Pendiente de confirmar</span>
          )}
          {a.confirmada && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={descargarCarta}>
              <FileDown className="h-3.5 w-3.5" /> Carta de adjudicación
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Monto adjudicado", formatMoney(a.precioFinal, moneda)],
          ["Plazo de entrega", `${a.plazoDias} días`],
          ["Condiciones de pago", `${a.condicionesPagoDias} días`],
          ["Garantía", `${a.garantiaMeses} meses`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      {a.lineas.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Ítem adjudicado</th>
                <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                <th className="px-3 py-2 text-right font-medium">Precio unitario</th>
                <th className="px-3 py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {a.lineas.map((l) => (
                <tr key={l.itemId} className="border-t border-border">
                  <td className="px-3 py-2">{l.descripcion}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtCantidad(l.cantidad)} {l.unidad}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(l.precioUnitario, moneda)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(l.subtotal, moneda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-border p-4 text-sm">
        <div className="mb-2 flex items-center gap-2 font-medium"><FileText className="h-4 w-4 text-primary" /> Orden de compra — vista previa</div>
        <div className="grid gap-1 sm:grid-cols-2">
          <p><span className="text-muted-foreground">Comprador:</span> {activeCompany?.nombre}</p>
          <p><span className="text-muted-foreground">Proveedor:</span> {a.proveedor}</p>
          <p><span className="text-muted-foreground">Monto total:</span> <span className="font-semibold">{formatMoney(a.precioFinal, moneda)}</span></p>
          <p><span className="text-muted-foreground">Pago:</span> {a.condicionesPagoDias} días desde la radicación de la factura</p>
        </div>
      </div>

      {a.requiereRevisionLegal && (
        <div className={`mt-4 flex items-center gap-3 rounded-lg p-3 ${a.revisionLegal ? "bg-success/5" : "bg-warning/5"}`}>
          {a.revisionLegal ? <ShieldCheck className="h-5 w-5 shrink-0 text-success" /> : <ShieldAlert className="h-5 w-5 shrink-0 text-warning-foreground" />}
          <p className="flex-1 text-sm">
            {a.revisionLegal ? (
              <strong>Revisión legal completada</strong>
            ) : (
              <>
                <strong>Requiere revisión legal</strong> — el monto supera {formatMoney(proceso.umbralRevisionLegal, moneda)}. El contrato queda bloqueado hasta la aprobación del equipo legal.
              </>
            )}
          </p>
          {!a.revisionLegal && (
            <Button size="sm" variant="outline" onClick={completarRevisionLegal}>Marcar como revisado</Button>
          )}
        </div>
      )}

      {!a.yaFirmado && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          {!puedeFirmar && (
            <p className="text-xs text-muted-foreground">
              {!a.confirmada ? "Confirma la adjudicación antes de firmar." : "Completa la revisión legal antes de firmar."}
            </p>
          )}
          {firmando ? (
            <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando contrato...</Button>
          ) : (
            <ConfirmDialog
              trigger={
                <Button disabled={!puedeFirmar}>
                  <Send className="mr-2 h-4 w-4" /> Firmar y generar contrato
                </Button>
              }
              title={`Firmar contrato con ${a.proveedor}`}
              description={
                esUltimaFirma
                  ? "Se registra la firma, se genera el contrato con sus hitos de seguimiento y el proceso pasa a cumplimiento. Esta acción no se puede deshacer."
                  : "Se registra la firma y se genera el contrato con sus hitos de seguimiento. El proceso pasa a cumplimiento cuando se firmen todos sus contratos. Esta acción no se puede deshacer."
              }
              confirmLabel="Firmar"
              onConfirm={firmar}
            />
          )}
        </div>
      )}
      {firmaError && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <span>{firmaError}</span>
          <Button size="sm" variant="outline" className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={firmar}>
            Reintentar
          </Button>
        </div>
      )}
    </Card>
  );
}
