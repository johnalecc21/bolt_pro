import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { SearchInput } from "@/components/shared/SearchInput";
import { Banknote, Check, FileDown, Loader2, Receipt, X, Zap } from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiErrorMessage } from "@/lib/api/http";
import { formatMoney, type Moneda } from "@/lib/moneda";
import {
  aprobarFactura, etapaPago, fetchCuentasPorPagar, rechazarFactura, registrarPago, responderProntoPago,
  urlFacturaCliente, urlSoporteCliente, type EtapaPago, type PagoPO,
} from "@/lib/api/pagos";
import { abrirEnlace, EtapaBadge, fecha, HistorialFacturas, hoyISO } from "@/components/pagos/comun";

type Filtro = "accion" | "por_pagar" | "pagados" | "todos";

const FILTROS: { id: Filtro; label: string; incluye: (e: EtapaPago, p: PagoPO) => boolean }[] = [
  { id: "accion", label: "Requieren acción", incluye: (e, p) => e === "factura_en_revision" || p.prontoPago?.estado === "solicitada" || e === "vencido" },
  { id: "por_pagar", label: "Por pagar", incluye: (e) => e === "por_pagar" || e === "vencido" },
  { id: "pagados", label: "Pagados", incluye: (e) => e === "pagado" },
  { id: "todos", label: "Todos", incluye: () => true },
];

/**
 * Accounts payable: every payment released by a completed milestone, the
 * invoice the proveedor filed for it, and the buyer's three decisions —
 * approve/reject the invoice, register the payment, answer early-payment requests.
 */
export function CuentasPorPagar() {
  const { data, loading, reload } = useApiData(fetchCuentasPorPagar);
  const { currentUser } = useAuth();
  const puedePagar = currentUser?.role === "admin_cliente" || currentUser?.role === "aprobador_cfo";
  const pagos = data ?? [];
  const [filtro, setFiltro] = useState<Filtro>("accion");
  const [busqueda, setBusqueda] = useState("");
  const [params, setParams] = useSearchParams();
  const seleccionado = pagos.find((p) => p.id === params.get("pago")) ?? null;
  const abrir = (id: string | null) => setParams(id ? { pago: id } : {}, { replace: true });

  const resumen = useMemo(() => {
    const conteo = new Map<Moneda, number>();
    for (const p of pagos) conteo.set(p.moneda, (conteo.get(p.moneda) ?? 0) + 1);
    const moneda = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
    const abiertos = pagos.filter((p) => p.moneda === moneda && p.estado !== "pagado");
    const en30 = Date.now() + 30 * 86_400_000;
    return {
      moneda,
      porPagar: abiertos.reduce((s, p) => s + p.montoNeto, 0),
      vencido: abiertos.filter((p) => p.estado === "vencido").reduce((s, p) => s + p.montoNeto, 0),
      proximos30: abiertos.filter((p) => p.estado !== "vencido" && new Date(p.fechaPagoPactada).getTime() <= en30).reduce((s, p) => s + p.montoNeto, 0),
      facturasPorRevisar: pagos.filter((p) => etapaPago(p) === "factura_en_revision").length,
      otrasMonedas: conteo.size > 1,
    };
  }, [pagos]);

  const f = FILTROS.find((x) => x.id === filtro)!;
  const q = busqueda.trim().toLowerCase();
  const visibles = pagos.filter(
    (p) => f.incluye(etapaPago(p), p) && (!q || `${p.proveedor} ${p.contratoCodigo} ${p.facturaVigente?.numero ?? ""}`.toLowerCase().includes(q)),
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Cuentas por pagar</h1>
        <p className="text-sm text-muted-foreground">Revisa las facturas de tus proveedores, registra los pagos y responde solicitudes de pronto pago</p>
      </div>

      {!loading && pagos.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Por pagar", formatMoney(resumen.porPagar, resumen.moneda)],
              ["Vencido", formatMoney(resumen.vencido, resumen.moneda)],
              ["Vence en 30 días", formatMoney(resumen.proximos30, resumen.moneda)],
              ["Facturas por revisar", String(resumen.facturasPorRevisar)],
            ].map(([k, v]) => (
              <Card key={k} className="p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{v}</p>
              </Card>
            ))}
          </div>
          {resumen.otrasMonedas && <p className="text-xs text-muted-foreground">Los totales muestran solo los pagos en {resumen.moneda}; la tabla incluye todas las monedas.</p>}
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup type="single" variant="outline" value={filtro} onValueChange={(v) => v && setFiltro(v as Filtro)}>
          {FILTROS.map((x) => (
            <ToggleGroupItem key={x.id} value={x.id} className="px-3 text-sm">{x.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <SearchInput placeholder="Proveedor, contrato o factura" value={busqueda} onChange={setBusqueda} className="w-full sm:w-72" />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : visibles.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={pagos.length === 0 ? "Aún no hay pagos" : "Nada en esta vista"}
          description={pagos.length === 0 ? "Cuando completes un hito de un contrato se libera su pago; el proveedor radica la factura y aparece aquí." : "Prueba con otro filtro."}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="p-4 font-medium">Proveedor</th>
                  <th className="p-4 font-medium">Contrato</th>
                  <th className="p-4 font-medium">Factura</th>
                  <th className="p-4 text-right font-medium">A pagar</th>
                  <th className="p-4 font-medium">Vence</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{p.proveedor}</td>
                    <td className="p-4">
                      {p.contratoCodigo}
                      {p.concepto && <span className="block text-xs text-muted-foreground">{p.concepto}</span>}
                    </td>
                    <td className="p-4 text-muted-foreground">{p.facturaVigente?.numero ?? "—"}</td>
                    <td className="p-4 text-right font-semibold tabular-nums">{formatMoney(p.montoNeto, p.moneda)}</td>
                    <td className="p-4 text-muted-foreground">{p.estado === "pagado" ? `Pagado ${fecha(p.fechaPago)}` : fecha(p.fechaPagoPactada)}</td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <EtapaBadge etapa={etapaPago(p)} />
                        {p.prontoPago?.estado === "solicitada" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Zap className="h-3 w-3" aria-hidden="true" /> Pronto pago solicitado</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right"><Button size="sm" variant="outline" onClick={() => abrir(p.id)}>Gestionar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={!!seleccionado} onOpenChange={(o) => !o && abrir(null)}>
        {seleccionado && <GestionPago pago={seleccionado} puedePagar={puedePagar} onCambio={reload} />}
      </Dialog>
    </div>
  );
}

function GestionPago({ pago, puedePagar, onCambio }: { pago: PagoPO; puedePagar: boolean; onCambio: () => void }) {
  const factura = pago.facturaVigente;
  const pp = pago.prontoPago;
  const [motivo, setMotivo] = useState("");
  const [motivoPP, setMotivoPP] = useState("");

  async function accion(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast.success(ok);
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{pago.proveedor} · {pago.contratoCodigo}</DialogTitle>
        <DialogDescription>{pago.concepto ? `${pago.concepto} · ` : ""}{pago.categoria}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Monto", formatMoney(pago.monto, pago.moneda)],
          ["A pagar", formatMoney(pago.montoNeto, pago.moneda)],
          ["Vence", fecha(pago.fechaPagoPactada)],
          ["Plazo", `${pago.condicionesPagoDias} días desde radicación`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Estado:</span> <EtapaBadge etapa={etapaPago(pago)} /></div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Facturas</h3>
        <HistorialFacturas pago={pago} onDescargar={(f) => abrirEnlace(() => urlFacturaCliente(f.id))} />
        {factura?.estado === "radicada" && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3">
            <p className="w-full text-sm">Verifica que la factura {factura.numero} corresponda a lo recibido y al monto de {formatMoney(pago.monto, pago.moneda)}.</p>
            <ConfirmDialog
              trigger={<Button size="sm" className="gap-1.5"><Check className="h-4 w-4" /> Aprobar factura</Button>}
              title="Aprobar factura"
              description={`La factura ${factura.numero} queda lista para pago el ${fecha(pago.fechaPagoPactada)}. El proveedor recibe la notificación.`}
              confirmLabel="Aprobar"
              onConfirm={() => accion(() => aprobarFactura(factura.id), "Factura aprobada")}
            />
            <div className="flex min-w-[240px] flex-1 items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="motivo-rechazo" className="text-xs">Motivo de rechazo</Label>
                <Input id="motivo-rechazo" value={motivo} maxLength={500} onChange={(e) => setMotivo(e.target.value)} placeholder="p. ej. el NIT no coincide" />
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" disabled={motivo.trim().length < 3} onClick={() => accion(() => rechazarFactura(factura.id, motivo.trim()), "Factura rechazada")}>
                <X className="h-4 w-4" /> Rechazar
              </Button>
            </div>
          </div>
        )}
      </section>

      {pp?.estado === "solicitada" && (
        <section className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-semibold"><Zap className="h-4 w-4 text-primary" /> Solicitud de pronto pago</p>
          <p>
            Pagar <strong className="tabular-nums">{formatMoney(pp.montoNeto, pago.moneda)}</strong> el <strong>{fecha(pp.fechaPropuesta)}</strong> en lugar de {formatMoney(pago.monto, pago.moneda)} el {fecha(pago.fechaPagoPactada)} — ahorro de {formatMoney(pago.monto - pp.montoNeto, pago.moneda)} ({(pp.descuentoPct * 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })}%).
          </p>
          {puedePagar ? (
            <div className="flex flex-wrap items-end gap-2">
              <Button size="sm" onClick={() => accion(() => responderProntoPago(pp.id, true), "Pronto pago aceptado")}>Aceptar</Button>
              <Input aria-label="Motivo para rechazar el pronto pago" className="h-8 max-w-xs" value={motivoPP} onChange={(e) => setMotivoPP(e.target.value)} placeholder="Motivo si lo rechazas" />
              <Button size="sm" variant="outline" disabled={motivoPP.trim().length < 3} onClick={() => accion(() => responderProntoPago(pp.id, false, motivoPP.trim()), "Pronto pago rechazado")}>Rechazar</Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Responde el área financiera (CFO o administrador).</p>
          )}
        </section>
      )}

      {pago.estado === "pagado" ? (
        <section className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
          <p>Pagado <strong>{formatMoney(pago.montoPagado ?? pago.montoNeto, pago.moneda)}</strong> el {fecha(pago.fechaPago)} · ref. <strong>{pago.referenciaPago}</strong>{pago.pagadoPor ? ` · registrado por ${pago.pagadoPor}` : ""}</p>
          {pago.soporteNombre && (
            <Button size="sm" variant="ghost" className="mt-1 gap-1 px-0" onClick={() => abrirEnlace(() => urlSoporteCliente(pago.id))}>
              <FileDown className="h-3.5 w-3.5" /> Soporte de pago
            </Button>
          )}
        </section>
      ) : factura?.estado === "aprobada" && puedePagar ? (
        <FormPago pago={pago} onHecho={onCambio} />
      ) : factura?.estado === "aprobada" ? (
        <p className="text-xs text-muted-foreground">El pago lo registra el área financiera (CFO o administrador).</p>
      ) : null}
    </DialogContent>
  );
}

function FormPago({ pago, onHecho }: { pago: PagoPO; onHecho: () => void }) {
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [referencia, setReferencia] = useState("");
  const [soporte, setSoporte] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pagar() {
    setEnviando(true);
    try {
      await registrarPago(pago.id, { fechaPago, referencia: referencia.trim(), soporte });
      toast.success("Pago registrado", { description: `${pago.proveedor} fue notificado.` });
      onHecho();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo registrar el pago."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-border p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold"><Banknote className="h-4 w-4 text-primary" /> Registrar pago de {formatMoney(pago.montoNeto, pago.moneda)}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fecha-pago">Fecha de pago</Label>
          <Input id="fecha-pago" type="date" value={fechaPago} max={hoyISO()} onChange={(e) => setFechaPago(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ref-pago">Referencia bancaria</Label>
          <Input id="ref-pago" value={referencia} maxLength={100} onChange={(e) => setReferencia(e.target.value)} placeholder="Número de transferencia" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="soporte-pago">Soporte (opcional)</Label>
        <Input id="soporte-pago" type="file" accept=".pdf,image/png,image/jpeg" onChange={(e) => setSoporte(e.target.files?.[0] ?? null)} />
      </div>
      <ConfirmDialog
        trigger={
          <Button className="gap-2" disabled={!fechaPago || !referencia.trim() || enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />} Registrar pago
          </Button>
        }
        title="Registrar pago"
        description={`Se marca como pagado ${formatMoney(pago.montoNeto, pago.moneda)} a ${pago.proveedor} (ref. ${referencia.trim()}). No se puede deshacer.`}
        confirmLabel="Registrar"
        onConfirm={pagar}
      />
    </section>
  );
}

