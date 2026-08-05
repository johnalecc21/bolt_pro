import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Wallet, Zap } from "lucide-react";
import { pagosPOs, type PagoPO } from "@/lib/mock/pagos";
import { useMockLoading } from "@/hooks/useMockLoading";
import { TableSkeleton } from "@/components/shared/TableSkeleton";

const estadoMap: Record<PagoPO["estado"], string> = { pendiente: "pendiente_aprobacion", pagado: "Activo", vencido: "Vencido" };

export function PagosFactoring() {
  const loading = useMockLoading();
  const [seleccion, setSeleccion] = useState<PagoPO | null>(null);
  const [diasAdelanto, setDiasAdelanto] = useState(30);

  const tasaDescuento = 0.015; // 1.5% mensual
  const montoAdelanto = seleccion ? seleccion.monto * (1 - (tasaDescuento * diasAdelanto) / 30) : 0;

  function solicitar() {
    toast.success("Solicitud de pronto pago enviada", { description: `Recibirás ~$${Math.round(montoAdelanto).toLocaleString()} en 24-48h.` });
    setSeleccion(null);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Centro de Pagos / Pronto Pago</h1>
        <p className="text-sm text-muted-foreground">Gestiona el cobro de tus POs y solicita adelantos con descuento</p>
      </div>

      {loading ? <TableSkeleton /> :
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">PO</th>
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Monto</th>
                <th className="p-4 font-medium">Pago pactado</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pagosPOs.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm font-medium">{p.id}</td>
                  <td className="p-4 text-sm text-muted-foreground">{p.cliente}</td>
                  <td className="p-4 text-sm font-semibold">${p.monto.toLocaleString()}</td>
                  <td className="p-4 text-sm text-muted-foreground">{p.fechaPagoPactada}</td>
                  <td className="p-4"><StatusBadge estado={estadoMap[p.estado]} /></td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm" variant="outline" className="gap-1.5"
                      disabled={p.estado === "pagado" || p.disputaAbierta}
                      onClick={() => setSeleccion(p)}
                      title={p.disputaAbierta ? "No disponible: PO con disputa abierta" : undefined}
                    >
                      <Zap className="h-3.5 w-3.5" /> Pronto pago
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>}

      <Dialog open={!!seleccion} onOpenChange={(v) => !v && setSeleccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Simulador de pronto pago</DialogTitle>
            <DialogDescription>{seleccion?.id} · Monto original ${seleccion?.monto.toLocaleString()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Días de adelanto</span><span className="font-medium">{diasAdelanto} días</span></div>
              <Slider value={[diasAdelanto]} min={5} max={45} step={5} onValueChange={([v]) => setDiasAdelanto(v)} />
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">Recibirías hoy</p>
              <p className="text-2xl font-bold text-success">${Math.round(montoAdelanto).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Descuento por adelanto: ${Math.round((seleccion?.monto ?? 0) - montoAdelanto).toLocaleString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeleccion(null)}>Cancelar</Button>
            <Button onClick={solicitar} className="gradient-brand text-white">Solicitar pronto pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
