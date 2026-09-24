import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { BadgeCheck, ListOrdered, Split } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney, type Moneda } from "@/lib/moneda";
import {
  asignacionInicial, compararItems, totalAsignacion,
  type ItemComparable, type OfertaComparable,
} from "@/lib/comparativo/items";

const fmtCantidad = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 3 });

interface Props {
  items: ItemComparable[];
  ofertas: OfertaComparable[];
  moneda: Moneda;
  /** proveedorId per itemId once awarded — the table then shows the decision, read-only. */
  adjudicado?: Record<string, string>;
  /** Present when the buyer can still award (full mode, no award yet). */
  onAdjudicar?: (asignaciones: { itemId: string; proveedorId: string }[]) => Promise<void>;
}

/**
 * Line-by-line comparison for an itemized tender. The cheapest quote per
 * line is marked with an icon and the word "Mejor" (not color alone); the
 * buyer can then assign each line to any supplier that quoted it, or leave
 * it unawarded, and split the award across suppliers.
 */
export function ComparativoItems({ items, ofertas, moneda, adjudicado, onAdjudicar }: Props) {
  const resumen = useMemo(() => compararItems(items, ofertas), [items, ofertas]);
  const [asignacion, setAsignacion] = useState<Record<string, string>>(() => adjudicado ?? asignacionInicial(resumen));
  const [enviando, setEnviando] = useState(false);
  const elegido = adjudicado ?? asignacion;
  const total = totalAsignacion(resumen, elegido);
  const ahorroVsUnico = resumen.mejorUnico ? resumen.mejorUnico.total - resumen.mejorCombinacion : null;
  const nombre = new Map(ofertas.map((o) => [o.proveedorId, o.proveedor]));
  const desiertos = items.length - total.lineas;

  async function adjudicar() {
    if (!onAdjudicar) return;
    setEnviando(true);
    try {
      await onAdjudicar(
        Object.entries(asignacion)
          .filter(([, p]) => p)
          .map(([itemId, proveedorId]) => ({ itemId, proveedorId })),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Comparativo por ítem</h2>
            <p className="text-sm text-muted-foreground">{items.length} línea(s) · precio unitario y subtotal de cada proveedor</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:flex">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Mejor combinación por ítem</p>
            <p className="font-semibold tabular-nums">{formatMoney(resumen.mejorCombinacion, moneda)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Mejor proveedor único</p>
            <p className="font-semibold tabular-nums">
              {resumen.mejorUnico ? `${formatMoney(resumen.mejorUnico.total, moneda)}` : "Ninguno cotizó todo"}
            </p>
            {resumen.mejorUnico && <p className="text-xs text-muted-foreground">{resumen.mejorUnico.proveedor}</p>}
          </div>
        </div>
      </div>

      {ahorroVsUnico != null && ahorroVsUnico > 0 && (
        <p className="border-b border-border bg-success/5 px-5 py-2.5 text-sm">
          <Split className="mr-1.5 inline h-4 w-4 text-success" />
          Dividir por ítems ahorra <strong className="tabular-nums">{formatMoney(ahorroVsUnico, moneda)}</strong> frente a adjudicar todo a {resumen.mejorUnico!.proveedor}.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <th className="p-3 text-left font-medium">Ítem</th>
              <th className="p-3 text-right font-medium">Cantidad</th>
              {ofertas.map((o, k) => (
                <th key={o.proveedorId} className="p-3 text-right font-medium">
                  <span className="text-foreground">{o.proveedor}</span>
                  {!resumen.totales[k].completa && (
                    <span className="block font-normal">cotizó {resumen.totales[k].lineas} de {items.length}</span>
                  )}
                </th>
              ))}
              <th className="p-3 text-left font-medium">{adjudicado ? "Adjudicado a" : "Adjudicar a"}</th>
            </tr>
          </thead>
          <tbody>
            {resumen.filas.map((f) => (
              <tr key={f.item.id} className="border-b border-border align-top">
                <td className="p-3">{f.item.descripcion}</td>
                <td className="p-3 text-right tabular-nums whitespace-nowrap">{fmtCantidad(f.item.cantidad)} {f.item.unidad}</td>
                {f.celdas.map((c) => {
                  const mejor = c.proveedorId === f.mejor;
                  const asignada = elegido[f.item.id] === c.proveedorId;
                  return (
                    <td key={c.proveedorId} className={cn("p-3 text-right tabular-nums", asignada && "bg-primary/5")}>
                      {c.subtotal == null ? (
                        <span className="text-muted-foreground">No cotiza</span>
                      ) : (
                        <>
                          <span className={cn("block", mejor && "font-semibold")}>{formatMoney(c.subtotal, moneda)}</span>
                          <span className="block text-xs text-muted-foreground">{formatMoney(c.precioUnitario!, moneda)} c/u</span>
                          {mejor && (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-success">
                              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Mejor
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
                <td className="p-3">
                  {adjudicado || !onAdjudicar ? (
                    <span>{elegido[f.item.id] ? nombre.get(elegido[f.item.id]) : <span className="text-muted-foreground">Desierto</span>}</span>
                  ) : (
                    <NativeSelect
                      size="sm"
                      aria-label={`Adjudicar ${f.item.descripcion}`}
                      value={asignacion[f.item.id] ?? ""}
                      onChange={(e) => setAsignacion((a) => ({ ...a, [f.item.id]: e.target.value }))}
                    >
                      <NativeSelectOption value="">No adjudicar</NativeSelectOption>
                      {f.celdas.filter((c) => c.subtotal != null).map((c) => (
                        <NativeSelectOption key={c.proveedorId} value={c.proveedorId}>
                          {nombre.get(c.proveedorId)}{c.proveedorId === f.mejor ? " (mejor)" : ""}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-muted/30 font-medium">
              <td className="p-3" colSpan={2}>Total cotizado</td>
              {resumen.totales.map((t) => (
                <td key={t.proveedorId} className="p-3 text-right tabular-nums">{formatMoney(t.total, moneda)}</td>
              ))}
              <td className="p-3 tabular-nums">{formatMoney(total.total, moneda)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm text-muted-foreground">
          {adjudicado ? "Adjudicado" : "Selección actual"}: <strong className="text-foreground tabular-nums">{formatMoney(total.total, moneda)}</strong> · {total.proveedores} proveedor(es) · {total.lineas} de {items.length} ítem(s)
          {desiertos > 0 && <> · <span className="text-warning-foreground">{desiertos} desierto(s)</span></>}
        </p>
        {onAdjudicar && !adjudicado && (
          <ConfirmDialog
            trigger={
              <Button className="gap-2" disabled={enviando || total.lineas === 0}>
                <Split className="h-4 w-4" /> {enviando ? "Adjudicando..." : total.proveedores > 1 ? `Adjudicar por ítems a ${total.proveedores} proveedores` : "Adjudicar selección"}
              </Button>
            }
            title="Adjudicar por ítems"
            description={`Se adjudican ${total.lineas} ítem(s) por ${formatMoney(total.total, moneda)} a ${total.proveedores} proveedor(es); cada uno recibe su propia orden de compra y contrato.${desiertos > 0 ? ` ${desiertos} ítem(s) quedan desiertos.` : ""} La licitación se cierra y la decisión no se puede cambiar.`}
            confirmLabel="Adjudicar"
            onConfirm={adjudicar}
          />
        )}
      </div>
    </Card>
  );
}
