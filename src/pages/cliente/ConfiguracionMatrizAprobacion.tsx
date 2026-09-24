import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { CheckCircle2, AlertTriangle, Plus, Trash2, Calculator, FileText, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import {
  fetchMatrizAprobacion,
  guardarMatrizAprobacion,
  etiquetaAprobadores,
  fetchConfigEmpresa,
  guardarConfigEmpresa,
  type ConfigEmpresa,
  ROLE_OPTIONS,
  ROLE_LABELS,
  type Regla,
  type RoleCode,
} from "@/lib/api/matrizAprobacion";
import { apiErrorMessage } from "@/lib/api/http";
import { formatMoney, MONEDAS, PAISES, type Moneda } from "@/lib/moneda";
import { RequisitosHomologacionCard } from "@/components/cliente/RequisitosHomologacionCard";
import { Switch } from "@/components/ui/switch";

let tempId = 0;
function nextTempId() {
  tempId += 1;
  return `tmp-${tempId}`;
}

function validar(reglas: Regla[], moneda: Moneda): string | null {
  if (reglas.length === 0) return "Agrega al menos un rango.";
  if (reglas.some((r) => r.roles.length === 0)) return "Cada rango necesita al menos un aprobador.";
  const sorted = [...reglas].sort((a, b) => a.min - b.min);
  if (sorted[0].min !== 0) return `El primer rango debe empezar en ${formatMoney(0, moneda)}.`;
  if (sorted[sorted.length - 1].max !== null) return "Debe existir una regla que cubra 'cualquier monto' (rango sin máximo).";
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (cur.max === null) return `La regla ${cur.id} no puede tener máximo abierto si no es la última.`;
    if (cur.max + 1 < next.min) return `Hay un hueco entre ${formatMoney(cur.max, moneda)} y ${formatMoney(next.min, moneda)}.`;
    if (cur.max >= next.min) return `Los rangos ${cur.id} y ${next.id} se solapan.`;
  }
  return null;
}

export function ConfiguracionMatrizAprobacion() {
  const { data: fetched, reload } = useApiData(fetchMatrizAprobacion);
  const { data: configFetched, reload: reloadConfig } = useApiData(fetchConfigEmpresa);
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [ejemplo, setEjemplo] = useState(75000);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfigEmpresa>({ umbralContratoMarco: 50000, monedaBase: "USD", pais: "CO", feedbackCompetitivo: false });
  const [savingUmbral, setSavingUmbral] = useState(false);
  const moneda = configFetched?.monedaBase ?? "USD";
  const error = validar(reglas, moneda);

  useEffect(() => {
    if (fetched) setReglas(fetched);
  }, [fetched]);

  useEffect(() => {
    if (configFetched) setConfig(configFetched);
  }, [configFetched]);

  const [savingFeedback, setSavingFeedback] = useState(false);
  async function cambiarFeedback(activo: boolean) {
    setSavingFeedback(true);
    try {
      const guardado = await guardarConfigEmpresa({ ...config, feedbackCompetitivo: activo });
      setConfig(guardado);
      toast.success(activo ? "Los proveedores verán su posición y brecha" : "Retroalimentación competitiva desactivada");
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar."));
    } finally {
      setSavingFeedback(false);
    }
  }

  async function guardarUmbral() {
    setSavingUmbral(true);
    try {
      await guardarConfigEmpresa(config);
      toast.success("Configuración de la empresa actualizada", {
        description: "La moneda base se aplica a los nuevos requerimientos y a la analítica.",
      });
      reloadConfig();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar la configuración."));
    } finally {
      setSavingUmbral(false);
    }
  }

  function actualizar(id: string, patch: Partial<Regla>) {
    setReglas((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  function alternarRol(id: string, role: RoleCode) {
    setReglas((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const roles = r.roles.includes(role) ? r.roles.filter((x) => x !== role) : [...r.roles, role];
      return { ...r, roles };
    }));
  }

  function agregarRegla() {
    setReglas((prev) => [...prev, { id: nextTempId(), min: 0, max: 0, roles: [], tipo: "Única" }]);
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
        <p className="text-sm text-muted-foreground">Define quién aprueba qué monto — cada rol seleccionado aquí es quien realmente puede aprobar o rechazar en la Bandeja de Aprobaciones.</p>
      </div>

      <Card className="p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" /> Empresa: país, moneda y umbral PO vs. Contrato Marco</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          La moneda base es la de los nuevos requerimientos y en la que se agrega la analítica. Adjudicaciones por debajo del umbral generan una Orden de Compra (PO) simple; desde el umbral en adelante, un Contrato Marco — bajo el cual luego pueden emitirse POs hijas sin necesitar cada una su propia revisión legal.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="block text-muted-foreground">País</span>
            <NativeSelect value={config.pais} onChange={(e) => setConfig((c) => ({ ...c, pais: e.target.value }))}>
              {PAISES.map((p) => <NativeSelectOption key={p.value} value={p.value}>{p.label}</NativeSelectOption>)}
            </NativeSelect>
          </label>
          <label className="space-y-1 text-sm">
            <span className="block text-muted-foreground">Moneda base</span>
            <NativeSelect value={config.monedaBase} onChange={(e) => setConfig((c) => ({ ...c, monedaBase: e.target.value as Moneda }))}>
              {MONEDAS.map((m) => <NativeSelectOption key={m.value} value={m.value}>{m.label}</NativeSelectOption>)}
            </NativeSelect>
          </label>
          <label className="space-y-1 text-sm">
            <span className="block text-muted-foreground">Contrato Marco a partir de ({config.monedaBase})</span>
            <Input type="number" className="w-40" value={config.umbralContratoMarco} onChange={(e) => setConfig((c) => ({ ...c, umbralContratoMarco: Number(e.target.value) }))} />
          </label>
          <Button size="sm" onClick={guardarUmbral} disabled={savingUmbral}>{savingUmbral ? "Guardando..." : "Guardar configuración"}</Button>
        </div>
      </Card>

      <Card className="flex flex-row items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 font-semibold"><MessageSquareText className="h-4 w-4" /> Retroalimentación a proveedores</h2>
          <p className="text-sm text-muted-foreground">
            Cuando un proveedor pierde un proceso, mostrarle su posición por precio (por ejemplo, 2° de 4) y qué tan lejos quedó del precio adjudicado. Nunca
            ve el nombre del ganador ni los precios de otros proveedores. Suele mejorar las ofertas de las siguientes rondas.
          </p>
          <p className="text-xs text-muted-foreground">{config.feedbackCompetitivo ? "Activado: aplica a todos los procesos ya decididos y a los nuevos." : "Desactivado: los proveedores solo ven si ganaron o perdieron."}</p>
        </div>
        <Switch
          checked={config.feedbackCompetitivo}
          disabled={savingFeedback}
          onCheckedChange={cambiarFeedback}
          aria-label="Mostrar a los proveedores su posición y brecha con el adjudicado"
        />
      </Card>

      <RequisitosHomologacionCard />

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
                <tr key={r.id} className="border-b border-border last:border-0 align-top">
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
                  <td className="p-3 min-w-[240px]">
                    <div className="flex flex-wrap gap-1.5">
                      {ROLE_OPTIONS.map((role) => {
                        const selected = r.roles.includes(role);
                        const orden = r.roles.indexOf(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => alternarRol(r.id, role)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                              selected ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-muted/50",
                            )}
                          >
                            {r.tipo === "Secuencial" && selected ? `${orden + 1}. ` : ""}{ROLE_LABELS[role]}
                          </button>
                        );
                      })}
                    </div>
                    {r.tipo === "Secuencial" && r.roles.length > 1 && (
                      <p className="mt-1 text-xs text-muted-foreground">Orden de aprobación: {r.roles.map((role) => ROLE_LABELS[role]).join(" → ")}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <select className="rounded-md border border-input bg-white px-2 py-1.5 text-sm" value={r.tipo} onChange={(e) => actualizar(r.id, { tipo: e.target.value as Regla["tipo"] })}>
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
          Una compra de <strong>{formatMoney(ejemplo, moneda)}</strong> requeriría aprobación de: <strong>{reglaEjemplo ? etiquetaAprobadores(reglaEjemplo.roles, reglaEjemplo.tipo) : "sin regla aplicable"}</strong>.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={!!error || saving}>{saving ? "Guardando..." : "Guardar matriz"}</Button>
      </div>
    </div>
  );
}
