import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, Plus, Trash2, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { fetchMatrizAprobacion, guardarMatrizAprobacion, type Regla } from "@/lib/api/matrizAprobacion";
import { apiErrorMessage } from "@/lib/api/http";

let tempId = 0;
function nextTempId() {
  tempId += 1;
  return `tmp-${tempId}`;
}

function validar(reglas: Regla[]): string | null {
  if (reglas.length === 0) return "Agrega al menos un rango.";
  const sorted = [...reglas].sort((a, b) => a.min - b.min);
  if (sorted[0].min !== 0) return "El primer rango debe empezar en $0.";
  if (sorted[sorted.length - 1].max !== null) return "Debe existir una regla que cubra 'cualquier monto' (rango sin máximo).";
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (cur.max === null) return `La regla ${cur.id} no puede tener máximo abierto si no es la última.`;
    if (cur.max + 1 < next.min) return `Hay un hueco entre $${cur.max.toLocaleString()} y $${next.min.toLocaleString()}.`;
    if (cur.max >= next.min) return `Los rangos ${cur.id} y ${next.id} se solapan.`;
  }
  return null;
}

export function ConfiguracionMatrizAprobacion() {
  const { data: fetched, reload } = useApiData(fetchMatrizAprobacion);
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [ejemplo, setEjemplo] = useState(75000);
  const [saving, setSaving] = useState(false);
  const error = validar(reglas);

  useEffect(() => {
    if (fetched) setReglas(fetched);
  }, [fetched]);

  function actualizar(id: string, patch: Partial<Regla>) {
    setReglas((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  function agregarRegla() {
    setReglas((prev) => [...prev, { id: nextTempId(), min: 0, max: 0, aprobadores: "", tipo: "Única" }]);
  }

  function eliminarRegla(id: string) {
    setReglas((prev) => prev.filter((r) => r.id !== id));
  }

  async function guardar() {
    if (error) {
      toast.error("No se puede guardar", { description: error });
      return;
    }
    setSaving(true);
    try {
      await guardarMatrizAprobacion(reglas);
      toast.success("Matriz de aprobación guardada");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar la matriz."));
    } finally {
      setSaving(false);
    }
  }

  const reglaEjemplo = [...reglas].sort((a, b) => a.min - b.min).find((r) => ejemplo >= r.min && (r.max === null || ejemplo <= r.max));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Matriz de Aprobación</h1>
        <p className="text-sm text-muted-foreground">Define quién aprueba qué monto — reemplaza el flujo de firmas en papel/email</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="p-3 font-medium">Monto mín.</th>
                <th className="p-3 font-medium">Monto máx.</th>
                <th className="p-3 font-medium">Aprobador(es)</th>
                <th className="p-3 font-medium">Tipo</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {reglas.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-3"><Input type="number" className="w-28" value={r.min} onChange={(e) => actualizar(r.id, { min: Number(e.target.value) })} /></td>
                  <td className="p-3">
                    <Input
                      type="number"
                      className="w-28"
                      placeholder="Ilimitado"
                      value={r.max ?? ""}
                      onChange={(e) => actualizar(r.id, { max: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                  </td>
                  <td className="p-3"><Input className="min-w-[160px]" value={r.aprobadores} onChange={(e) => actualizar(r.id, { aprobadores: e.target.value })} /></td>
                  <td className="p-3">
                    <select className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={r.tipo} onChange={(e) => actualizar(r.id, { tipo: e.target.value as Regla["tipo"] })}>
                      <option>Única</option>
                      <option>Secuencial</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => eliminarRegla(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t p-3">
          <Button variant="outline" size="sm" onClick={agregarRegla}><Plus className="mr-2 h-4 w-4" /> Agregar rango</Button>
        </div>
      </Card>

      <div className={cn("flex items-center gap-2 rounded-lg p-3 text-sm", error ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success")}>
        {error ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        {error ?? "Los rangos son válidos: sin huecos, sin solapamientos, y cubren cualquier monto."}
      </div>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Calculator className="h-4 w-4" /> Previsualización</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Monto de ejemplo</span>
          <Input type="number" className="w-40" value={ejemplo} onChange={(e) => setEjemplo(Number(e.target.value))} />
        </div>
        <p className="mt-3 rounded-lg bg-info/10 p-3 text-sm text-info">
          Una compra de <strong>${ejemplo.toLocaleString()}</strong> requeriría aprobación de: <strong>{reglaEjemplo?.aprobadores ?? "sin regla aplicable"}</strong> {reglaEjemplo && `(${reglaEjemplo.tipo.toLowerCase()})`}.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button className="gradient-brand text-white" onClick={guardar} disabled={!!error || saving}>{saving ? "Guardando..." : "Guardar matriz"}</Button>
      </div>
    </div>
  );
}
