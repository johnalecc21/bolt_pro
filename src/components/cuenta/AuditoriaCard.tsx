import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import { exportarAuditoriaCsv, fetchRetencionAuditoria, guardarRetencionAuditoria } from "@/lib/api/auditLog";

const OPCIONES_RETENCION = [12, 24, 36, 60, 120, 180, 240];

/** Export the audit trail as CSV; admins also choose how long it's kept. */
export function AuditoriaCard({ puedeConfigurar }: { puedeConfigurar: boolean }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [exportando, setExportando] = useState(false);
  const { data: retencion } = useApiData(() => (puedeConfigurar ? fetchRetencionAuditoria() : Promise.resolve(null)), [puedeConfigurar]);
  const [meses, setMeses] = useState<number | null>(null);
  useEffect(() => {
    if (retencion != null) setMeses(retencion);
  }, [retencion]);

  async function exportar() {
    setExportando(true);
    try {
      await exportarAuditoriaCsv(desde || undefined, hasta || undefined);
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo exportar la auditoría."));
    } finally {
      setExportando(false);
    }
  }

  async function guardarRetencion(v: number) {
    setMeses(v);
    try {
      await guardarRetencionAuditoria(v);
      toast.success(`La auditoría se conservará ${v} meses`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4" /> Auditoría</h2>
        <p className="text-sm text-muted-foreground">Descarga el registro de acciones de tu empresa (aprobaciones, adjudicaciones, cambios de configuración) en CSV para Excel.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="aud-desde">Desde</Label>
          <Input id="aud-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aud-hasta">Hasta</Label>
          <Input id="aud-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <Button variant="outline" className="gap-1.5" onClick={exportar} disabled={exportando}>
          <Download className="h-4 w-4" /> {exportando ? "Exportando..." : "Exportar CSV"}
        </Button>
      </div>
      {puedeConfigurar && meses != null && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-sm font-medium">Tiempo de conservación</p>
            <p className="text-xs text-muted-foreground">Los registros más antiguos se eliminan automáticamente. En Colombia los libros comerciales se conservan 10 años.</p>
          </div>
          <NativeSelect aria-label="Meses de conservación" value={meses} onChange={(e) => guardarRetencion(Number(e.target.value))}>
            {OPCIONES_RETENCION.map((m) => <NativeSelectOption key={m} value={m}>{m >= 12 && m % 12 === 0 ? `${m / 12} año${m === 12 ? "" : "s"}` : `${m} meses`}</NativeSelectOption>)}
          </NativeSelect>
        </div>
      )}
    </Card>
  );
}
