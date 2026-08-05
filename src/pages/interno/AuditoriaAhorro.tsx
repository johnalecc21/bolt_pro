import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { logAudit } from "@/lib/mock/auditLog";
import { useAuth } from "@/lib/auth/AuthContext";
import { useMockLoading } from "@/hooks/useMockLoading";
import { TableSkeleton } from "@/components/shared/TableSkeleton";

interface CasoAuditoria {
  id: string;
  cliente: string;
  benchmark: number;
  negociado: number;
  reportado: number;
  ajusteManual: number;
  certificado: boolean;
}

const casosIniciales: CasoAuditoria[] = [
  { id: "RFP-2024-0030", cliente: "Acme S.A.", benchmark: 78000, negociado: 64000, reportado: 14500, ajusteManual: 0, certificado: false },
  { id: "RFP-2024-0031", cliente: "Acme S.A.", benchmark: 108000, negociado: 92000, reportado: 16800, ajusteManual: 0, certificado: false },
  { id: "RFP-2024-0025", cliente: "Acme S.A.", benchmark: 44000, negociado: 38000, reportado: 6000, ajusteManual: -500, certificado: true },
];

export function AuditoriaAhorro() {
  const { currentUser } = useAuth();
  const loading = useMockLoading();
  const [casos, setCasos] = useState(casosIniciales);

  function actualizarAjuste(id: string, ajuste: number) {
    setCasos((prev) => prev.map((c) => c.id === id ? { ...c, ajusteManual: ajuste } : c));
  }

  function certificar(caso: CasoAuditoria, motivo?: string) {
    setCasos((prev) => prev.map((c) => c.id === caso.id ? { ...c, certificado: true } : c));
    logAudit({ usuario: currentUser?.nombre ?? "—", accion: "Ahorro certificado", detalle: `${caso.id} — $${(caso.benchmark - caso.negociado + caso.ajusteManual).toLocaleString()}`, motivo });
    toast.success("Ahorro certificado", { description: caso.id });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoría de Ahorro</h1>
        <p className="text-sm text-muted-foreground">Valida que el ahorro reportado sea real — la base de la credibilidad ante el CFO</p>
      </div>

      {loading ? <TableSkeleton /> : <div className="space-y-4">
        {casos.map((c) => {
          const ahorroReal = c.benchmark - c.negociado + c.ajusteManual;
          const brecha = Math.round(((c.reportado - ahorroReal) / c.reportado) * 100);
          return (
            <Card key={c.id} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{c.id}</h2>
                  <p className="text-xs text-muted-foreground">{c.cliente}</p>
                </div>
                {c.certificado ? (
                  <Badge className="gap-1 bg-success/15 text-success"><CheckCircle2 className="h-3 w-3" /> Ahorro certificado</Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendiente de auditoría</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Benchmark histórico</p>
                  <p className="text-lg font-bold">${c.benchmark.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Precio negociado</p>
                  <p className="text-lg font-bold">${c.negociado.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-info/10 p-3">
                  <p className="text-xs text-info">Ahorro reportado</p>
                  <p className="text-lg font-bold text-info">${c.reportado.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-success/10 p-3">
                  <p className="text-xs text-success">Ahorro auditado</p>
                  <p className="text-lg font-bold text-success">${ahorroReal.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Ajuste manual (con justificación)</label>
                <Input type="number" className="w-32" value={c.ajusteManual} onChange={(e) => actualizarAjuste(c.id, Number(e.target.value))} disabled={c.certificado} />
                {brecha !== 0 && <span className="text-xs text-muted-foreground">Brecha vs. reportado: {brecha}%</span>}
              </div>

              {!c.certificado && (
                <ConfirmDialog
                  trigger={<Button size="sm" className="mt-4 gap-1.5 gradient-success text-white"><TrendingUp className="h-4 w-4" /> Certificar ahorro</Button>}
                  title="Certificar ahorro auditado"
                  description={`Se marcará $${ahorroReal.toLocaleString()} como ahorro certificado para ${c.id}, visible en el dashboard ejecutivo del cliente.`}
                  requireReason
                  reasonLabel="Justificación del ajuste (si aplica)"
                  confirmLabel="Certificar"
                  onConfirm={(motivo) => certificar(c, motivo)}
                />
              )}
            </Card>
          );
        })}
      </div>}
    </div>
  );
}
