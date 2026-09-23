import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CopilotoPanel } from "@/components/shared/CopilotoPanel";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Sparkles, ArrowLeft, ArrowRight, Plus, X, Check, AlertCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { fetchProveedores } from "@/lib/api/proveedores";
import { createRequerimiento, describirExcluidos } from "@/lib/api/requerimientos";
import { apiErrorMessage } from "@/lib/api/http";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useMonedaBase } from "@/hooks/useMonedaBase";
import { formatMoney, MONEDAS, type Moneda } from "@/lib/moneda";

const categoriasCatalogo = ["Servicios Generales", "Materia Prima"];
const TOTAL_STEPS = 6;

export function NuevoRequerimiento() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("Tecnología");
  const [presupuesto, setPresupuesto] = useState("");
  const monedaBase = useMonedaBase();
  const [moneda, setMoneda] = useState<Moneda>(monedaBase);
  const [fechaLimite, setFechaLimite] = useState("");
  const [criterios, setCriterios] = useState({ precio: 50, tiempo: 25, calidad: 15, pago: 10 });
  const [requisitosTecnicos, setRequisitosTecnicos] = useState("");
  const [especificaciones, setEspecificaciones] = useState([
    { name: "Capacidad mínima", value: "100 TB" },
    { name: "SLA requerido", value: "99.9%" },
    { name: "Soporte", value: "24/7" },
  ]);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { data: proveedores, loading: loadingProveedores } = useApiData(() => fetchProveedores());

  function toggleProveedor(id: string) {
    setProveedoresSeleccionados((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }

  function actualizarEspecificacion(index: number, campo: "name" | "value", valor: string) {
    setEspecificaciones((prev) => prev.map((spec, i) => (i === index ? { ...spec, [campo]: valor } : spec)));
  }

  function eliminarEspecificacion(index: number) {
    setEspecificaciones((prev) => prev.filter((_, i) => i !== index));
  }

  function agregarEspecificacion() {
    setEspecificaciones((prev) => [...prev, { name: "", value: "" }]);
  }
  const total = criterios.precio + criterios.tiempo + criterios.calidad + criterios.pago;
  const esCatalogo = categoriasCatalogo.includes(categoria);

  async function handleSubmit() {
    if (!titulo.trim() || !presupuesto || !fechaLimite) {
      toast.error("Completa título, presupuesto y fecha límite antes de enviar.");
      return;
    }
    setSubmitting(true);
    try {
      const descripcionCompleta = [
        descripcion.trim(),
        requisitosTecnicos.trim() ? `Requisitos técnicos:\n${requisitosTecnicos.trim()}` : "",
      ].filter(Boolean).join("\n\n");
      const { requerimiento, excluidos } = await createRequerimiento({
        titulo: titulo.trim(),
        descripcion: descripcionCompleta || undefined,
        categoria,
        montoEstimado: Number(presupuesto),
        moneda,
        fechaLimite,
        criteriosPeso: criterios,
        especificaciones: especificaciones.filter((e) => e.name.trim() || e.value.trim()),
        proveedorIds: proveedoresSeleccionados,
      });
      if (excluidos.length > 0) {
        toast.warning("Requerimiento enviado a aprobación", {
          description: `${excluidos.length} proveedor(es) no se preseleccionaron por no cumplir los requisitos de homologación: ${describirExcluidos(excluidos)}.`,
        });
      } else {
        toast.success("Requerimiento enviado a aprobación", { description: requerimiento.id });
      }
      navigate(`/cliente/requerimientos/${requerimiento.id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo crear el requerimiento."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Requerimiento</h1>
          <p className="text-sm text-muted-foreground">Paso {step} de {TOTAL_STEPS}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", s <= step ? "gradient-brand" : "bg-muted")} />
        ))}
      </div>

      <Card className="max-w-3xl p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">¿Qué necesitas?</h2>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input placeholder="Ej: Servicios de nube y migración AWS" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción del requerimiento</Label>
              <div className="relative">
                <Textarea
                  placeholder="Ej: Servicios de migración a la nube para 15 servidores..."
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
                <CopilotoPanel
                  context="nuevo-requerimiento"
                  onInsert={(text) => setDescripcion((prev) => (prev ? `${prev}\n\n${text}` : text))}
                  trigger={
                    <Button size="sm" variant="outline" className="absolute bottom-2 right-2 gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Ayuda con IA
                    </Button>
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option>Tecnología</option>
                  <option>Servicios Generales</option>
                  <option>Materia Prima</option>
                  <option>Logística</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <select className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                  <option>Normal</option>
                  <option>Alta</option>
                  <option>Urgente</option>
                </select>
              </div>
            </div>
            {esCatalogo && (
              <div className="flex items-start gap-2 rounded-lg bg-info/10 p-3 text-sm text-info">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p><strong>{categoria}</strong> es una categoría recurrente de bajo riesgo — puedes usar <strong>catálogo directo con proveedor preferido</strong> y saltarte la licitación completa.</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Especificaciones técnicas</h2>
            <div className="space-y-2">
              <Label>Requisitos técnicos</Label>
              <Textarea
                placeholder="Detalla las especificaciones que los proveedores deben cumplir..."
                rows={5}
                value={requisitosTecnicos}
                onChange={(e) => setRequisitosTecnicos(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Especificaciones detalladas</Label>
              <div className="space-y-2">
                {especificaciones.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Nombre"
                      value={spec.name}
                      onChange={(e) => actualizarEspecificacion(i, "name", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Valor"
                      value={spec.value}
                      onChange={(e) => actualizarEspecificacion(i, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => eliminarEspecificacion(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={agregarEspecificacion}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar especificación
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Cantidad y presupuesto</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" placeholder="1" />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Input placeholder="servicio / mes" />
              </div>
              <div className="space-y-2">
                <Label>Presupuesto estimado</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="185000" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} />
                  <NativeSelect aria-label="Moneda" value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)}>
                    {MONEDAS.map((m) => <NativeSelectOption key={m.value} value={m.value}>{m.value}</NativeSelectOption>)}
                  </NativeSelect>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha requerida</Label>
                <Input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Criterios de evaluación</h2>
            <p className="text-sm text-muted-foreground">Ajusta los pesos. Deben sumar 100%.</p>
            <div className="space-y-5">
              {Object.entries({
                precio: "Precio",
                tiempo: "Tiempo de entrega",
                calidad: "Calidad / Referencias",
                pago: "Condiciones de pago",
              }).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <span className={cn("text-sm font-bold", total === 100 ? "text-foreground" : "text-destructive")}>
                      {criterios[key as keyof typeof criterios]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={criterios[key as keyof typeof criterios]}
                    onChange={(e) => setCriterios((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>
              ))}
            </div>
            <div className={cn("flex items-center justify-between rounded-lg p-3 text-sm", total === 100 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              <span>Total</span>
              <span className="font-bold">{total}%</span>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Selecciona proveedores</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{proveedoresSeleccionados.length} seleccionados</span>
              <span className="text-sm text-muted-foreground">· Mínimo recomendado: 3</span>
              {proveedoresSeleccionados.length < 3 && (
                <span className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> Selecciona al menos 3
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Se invitarán automáticamente en cuanto el requerimiento sea aprobado — no antes.
            </p>
            {loadingProveedores ? (
              <p className="text-sm text-muted-foreground">Cargando proveedores...</p>
            ) : (proveedores ?? []).length === 0 ? (
              <EmptyState icon={Users} title="Sin proveedores disponibles" description="No hay proveedores homologados en el directorio todavía." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(proveedores ?? []).map((p) => (
                  <ProviderCard
                    key={p.id}
                    proveedor={p}
                    selectable
                    selected={proveedoresSeleccionados.includes(p.id)}
                    onSelect={() => toggleProveedor(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Revisión final</h2>
            <div className="space-y-3 rounded-lg border border-border p-4">
              {[
                ["Título", titulo || "(sin definir)"],
                ["Descripción", descripcion || "(sin definir)"],
                ["Categoría", categoria],
                ["Prioridad", "Normal"],
                ["Presupuesto", presupuesto ? formatMoney(Number(presupuesto), moneda) : "(sin definir)"],
                ["Fecha requerida", fechaLimite || "(sin definir)"],
                ["Criterios", `Precio ${criterios.precio}% · Tiempo ${criterios.tiempo}% · Calidad ${criterios.calidad}% · Pago ${criterios.pago}%`],
                ["Proveedores preseleccionados", String(proveedoresSeleccionados.length)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm gap-4">
                  <span className="shrink-0 text-muted-foreground">{k}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
            <CopilotoPanel
              context="nuevo-requerimiento"
              trigger={
                <Button variant="outline" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4 text-primary" /> Solicitar ayuda de consultor
                </Button>
              }
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t pt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
          ) : <div />}
          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 4 && total !== 100) || (step === 5 && proveedoresSeleccionados.length < 3)}
            >
              Siguiente <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="gradient-success text-white">
              <Check className="mr-2 h-4 w-4" /> {submitting ? "Enviando..." : "Enviar a aprobación"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
