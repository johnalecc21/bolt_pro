import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Wallet, Upload, FileDown, Loader2 } from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import { formatMoney } from "@/lib/moneda";
import {
  etapaPago, fetchMisPagos, radicarFactura,
  urlFacturaProveedor, urlSoporteProveedor, type PagoPO,
} from "@/lib/api/pagos";
import { abrirEnlace, EtapaBadge, fecha, HistorialFacturas, hoyISO } from "@/components/pagos/comun";

/**
 * The proveedor's side of getting paid: file the invoice for each released
 * payment, follow its review, and optionally ask to be paid early.
 */
export function PagosProveedor() {
  const { data, loading, reload } = useApiData(fetchMisPagos);
  const pagos = data ?? [];
  const [params, setParams] = useSearchParams();
  const seleccionado = pagos.find((p) => p.id === params.get("pago")) ?? null;

  const resumen = useMemo(() => {
    const abiertos = pagos.filter((p) => p.estado !== "pagado");
    // Amounts only add up within one currency: summarize the most common one.
    const conteo = new Map<string, number>();
    for (const p of pagos) conteo.set(p.moneda, (conteo.get(p.moneda) ?? 0) + 1);
    const moneda = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
    const enMoneda = (l: PagoPO[]) => l.filter((p) => p.moneda === moneda);
    return {
      moneda,
      porCobrar: enMoneda(abiertos).reduce((s, p) => s + p.monto, 0),
      vencido: enMoneda(abiertos.filter((p) => p.estado === "vencido")).reduce((s, p) => s + p.monto, 0),
      sinFactura: abiertos.filter((p) => ["sin_factura", "factura_rechazada"].includes(etapaPago(p))).length,
      cobrado: enMoneda(pagos.filter((p) => p.estado === "pagado")).reduce((s, p) => s + (p.montoPagado ?? p.monto), 0),
    };
  }, [pagos]);

  const abrir = (id: string | null) => setParams(id ? { pago: id } : {}, { replace: true });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Centro de Pagos</h1>
        <p className="text-sm text-muted-foreground">Radica tus facturas y sigue su revisión y su pago</p>
      </div>

      {!loading && pagos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Por cobrar", formatMoney(resumen.porCobrar, resumen.moneda as PagoPO["moneda"])],
            ["Vencido", formatMoney(resumen.vencido, resumen.moneda as PagoPO["moneda"])],
            ["Pendientes de factura", String(resumen.sinFactura)],
            ["Cobrado", formatMoney(resumen.cobrado, resumen.moneda as PagoPO["moneda"])],
          ].map(([k, v]) => (
            <Card key={k} className="p-4">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{v}</p>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : pagos.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin pagos registrados" description="Cuando el comprador complete un hito de tu contrato se libera el pago correspondiente y podrás radicar la factura aquí." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="p-4 font-medium">Contrato</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 text-right font-medium">Monto</th>
                  <th className="p-4 font-medium">Pago pactado</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => {
                  const etapa = etapaPago(p);
                  const accion = etapa === "sin_factura" || etapa === "factura_rechazada" ? "Radicar factura" : "Ver detalle";
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="p-4">
                        <p className="font-medium">{p.contratoCodigo}</p>
                        {p.concepto && <p className="text-xs text-muted-foreground">{p.concepto}</p>}
                      </td>
                      <td className="p-4 text-muted-foreground">{p.cliente}</td>
                      <td className="p-4 text-right font-semibold tabular-nums">
                        {formatMoney(p.monto, p.moneda)}
                      </td>
                      <td className="p-4 text-muted-foreground">{p.estado === "pagado" ? `Pagado ${fecha(p.fechaPago)}` : fecha(p.fechaPagoPactada)}</td>
                      <td className="p-4"><EtapaBadge etapa={etapa} /></td>
                      <td className="p-4 text-right">
                        <Button size="sm" variant={accion === "Radicar factura" ? "default" : "outline"} onClick={() => abrir(p.id)}>{accion}</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={!!seleccionado} onOpenChange={(o) => !o && abrir(null)}>
        {seleccionado && <DetallePago pago={seleccionado} onCambio={reload} />}
      </Dialog>
    </div>
  );
}

function DetallePago({ pago, onCambio }: { pago: PagoPO; onCambio: () => void }) {
  const etapa = etapaPago(pago);
  const puedeRadicar = etapa === "sin_factura" || etapa === "factura_rechazada";

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{pago.contratoCodigo}{pago.concepto ? ` · ${pago.concepto}` : ""}</DialogTitle>
        <DialogDescription>{pago.cliente} · {pago.categoria}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ["Monto", formatMoney(pago.monto, pago.moneda)],
          [pago.estado === "pagado" ? "Pagado el" : "Pago pactado", pago.estado === "pagado" ? fecha(pago.fechaPago) : fecha(pago.fechaPagoPactada)],
          ["Plazo de pago", `${pago.condicionesPagoDias} días`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Estado:</span> <EtapaBadge etapa={etapa} /></div>

      {pago.estado === "pagado" && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
          <p>Pago de <strong>{formatMoney(pago.montoPagado ?? pago.monto, pago.moneda)}</strong> registrado el {fecha(pago.fechaPago)} · referencia <strong>{pago.referenciaPago}</strong></p>
          {pago.soporteNombre && (
            <Button size="sm" variant="ghost" className="mt-1 gap-1 px-0" onClick={() => abrirEnlace(() => urlSoporteProveedor(pago.id))}>
              <FileDown className="h-3.5 w-3.5" /> Soporte de pago
            </Button>
          )}
        </div>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Facturas</h3>
        <HistorialFacturas pago={pago} onDescargar={(f) => abrirEnlace(() => urlFacturaProveedor(pago.id, f.id))} />
        {puedeRadicar && <FormRadicar pago={pago} onHecho={onCambio} />}
      </section>

    </DialogContent>
  );
}

function FormRadicar({ pago, onHecho }: { pago: PagoPO; onHecho: () => void }) {
  const [numero, setNumero] = useState("");
  const [emision, setEmision] = useState(hoyISO());
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function radicar() {
    if (!archivo) return;
    setEnviando(true);
    try {
      await radicarFactura(pago.id, { numero: numero.trim(), fechaEmision: emision, archivo });
      toast.success("Factura radicada", { description: `El plazo de pago de ${pago.condicionesPagoDias} días empieza a contar hoy.` });
      onHecho();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo radicar la factura."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <p className="text-sm font-medium">Radicar factura por {formatMoney(pago.monto, pago.moneda)}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="num-factura">Número de factura</Label>
          <Input id="num-factura" value={numero} maxLength={60} onChange={(e) => setNumero(e.target.value)} placeholder="FE-1234" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emision-factura">Fecha de emisión</Label>
          <Input id="emision-factura" type="date" value={emision} max={hoyISO()} onChange={(e) => setEmision(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="archivo-factura">Archivo (PDF, XML o imagen · máx. 10 MB)</Label>
        <Input id="archivo-factura" type="file" accept=".pdf,.xml,image/png,image/jpeg" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
      </div>
      <Button className="gap-2" disabled={!numero.trim() || !emision || !archivo || enviando} onClick={radicar}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Radicar factura
      </Button>
    </div>
  );
}
