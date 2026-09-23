import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Wallet } from "lucide-react";
import { fetchMisPagos, type PagoPO } from "@/lib/api/pagos";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

const estadoMap: Record<PagoPO["estado"], string> = { pendiente: "pendiente_aprobacion", pagado: "Activo", vencido: "Vencido" };

export function PagosFactoring() {
  const { data: pagosPOs, loading } = useApiData(fetchMisPagos);
  const pagos = pagosPOs ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Centro de Pagos</h1>
        <p className="text-sm text-muted-foreground">Estado de cobro de tus órdenes de compra y contratos</p>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : pagos.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin pagos registrados" description="Cuando tengas contratos u órdenes de compra activas, verás aquí su estado de cobro." />
      ) : (
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
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-sm font-medium">{p.contratoCodigo}</td>
                    <td className="p-4 text-sm text-muted-foreground">{p.cliente}</td>
                    <td className="p-4 text-sm font-semibold">${p.monto.toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{p.fechaPagoPactada}</td>
                    <td className="p-4"><StatusBadge estado={estadoMap[p.estado]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
