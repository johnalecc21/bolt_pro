import { Card } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { fechaLocal } from "@/lib/fecha";
import { fetchRiesgoProveedor, TIPO_ALERTA_LABEL } from "@/lib/api/riesgo";

/**
 * Continuous-monitoring status of a supplier, as a buyer sees it: when the
 * restrictive lists were last re-checked and any open findings. List hits
 * show only as "en revisión de compliance".
 */
export function MonitoreoRiesgoProveedor({ proveedorId }: { proveedorId: string }) {
  const { data: r } = useApiData(() => fetchRiesgoProveedor(proveedorId), [proveedorId]);
  if (!r || !r.estado) return null;
  const limpio = r.alertas.length === 0;
  const Icono = limpio ? ShieldCheck : ShieldAlert;
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Icono className={limpio ? "mt-0.5 h-5 w-5 shrink-0 text-success" : "mt-0.5 h-5 w-5 shrink-0 text-warning-foreground"} aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-1 text-sm">
          <h2 className="font-semibold">Monitoreo continuo</h2>
          <p className="text-muted-foreground">
            {r.ultimoMonitoreo ? `Listas restrictivas (OFAC, ONU) consultadas de nuevo el ${fechaLocal(r.ultimoMonitoreo)}.` : "Aún no hay una re-consulta automática de listas restrictivas."}
            {r.proximaRevalidacion && ` Próxima revalidación: ${fechaLocal(r.proximaRevalidacion)}.`}
          </p>
          {limpio ? (
            <p className="text-success">Sin alertas abiertas.</p>
          ) : (
            <ul className="space-y-0.5">
              {r.alertas.map((a, i) => (
                <li key={i} className="text-warning-foreground">
                  <strong>{TIPO_ALERTA_LABEL[a.tipo]}:</strong> {a.detalle} <span className="text-muted-foreground">(desde {fechaLocal(a.desde)})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
