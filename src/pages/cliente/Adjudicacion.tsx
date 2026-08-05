import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, FileText, PenTool, ShieldAlert, Check, Send } from "lucide-react";

export function Adjudicacion() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Adjudicación y Cierre</h1>
        <p className="text-sm text-muted-foreground">RFP-2024-0032 · Formalización de la decisión final</p>
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
              <h2 className="text-2xl font-bold">NovaTech Consulting</h2>
              <p className="text-sm text-white/70">Score: 92★ · Montevideo, UY</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Precio final", "$162,000"],
              ["Plazo de entrega", "38 días"],
              ["Condiciones de pago", "45 días"],
              ["Garantía", "12 meses"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-1 font-semibold">{v}</p>
              </div>
            ))}
          </div>
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
            <p className="text-2xl font-bold text-success">$34,500</p>
            <p className="text-sm text-muted-foreground">22% del presupuesto inicial ($185,000)</p>
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
            <div>
              <p className="font-bold">ACME S.A.</p>
              <p className="text-xs text-muted-foreground">NIT: 900.123.456-7</p>
            </div>
            <div className="text-right">
              <p className="font-bold">ORDEN DE COMPRA</p>
              <p className="text-xs text-muted-foreground">PO-2024-0033</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><span>Proveedor:</span><span className="font-medium">NovaTech Consulting</span></div>
            <div className="flex justify-between"><span>Servicio:</span><span className="font-medium">Migración a la nube AWS</span></div>
            <div className="flex justify-between"><span>Monto total:</span><span className="font-bold">$162,000 USD</span></div>
            <div className="flex justify-between"><span>Plazo:</span><span className="font-medium">38 días</span></div>
            <div className="flex justify-between"><span>Pago:</span><span className="font-medium">45 días netos</span></div>
          </div>
        </div>
      </Card>

      {/* Legal review */}
      <Card className="border-warning/30 bg-warning/5 p-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-warning-foreground" />
          <p className="text-sm">
            <strong>Requiere revisión legal</strong> — El monto supera $50,000. El contrato quedará bloqueado hasta la aprobación del equipo legal.
          </p>
        </div>
      </Card>

      {/* Contract preview */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <PenTool className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Contrato — Vista previa editable</h2>
        </div>
        <div className="rounded-lg border border-border p-5 text-sm">
          <p className="mb-3 font-medium">Contrato de Prestación de Servicios</p>
          <p className="text-muted-foreground">Entre <span className="rounded bg-primary/10 px-1 font-medium text-primary">ACME S.A.</span> y <span className="rounded bg-primary/10 px-1 font-medium text-primary">NovaTech Consulting</span>, con fecha de inicio <span className="rounded bg-primary/10 px-1 font-medium text-primary">2024-08-15</span> y duración de <span className="rounded bg-primary/10 px-1 font-medium text-primary">12 meses</span>...</p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked className="rounded" />
          Notificar proveedores no ganadores (con feedback automático)
        </label>
        <Button className="gradient-brand text-white">
          <Send className="mr-2 h-4 w-4" /> Enviar a firma electrónica
        </Button>
      </div>
    </div>
  );
}
