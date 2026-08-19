import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNuevoRequerimiento, TOTAL_STEPS } from "@/pages/cliente/nuevo-requerimiento/useNuevoRequerimiento";
import { PasoInfoBasica } from "@/pages/cliente/nuevo-requerimiento/PasoInfoBasica";
import { PasoEspecificaciones } from "@/pages/cliente/nuevo-requerimiento/PasoEspecificaciones";
import { PasoPresupuesto } from "@/pages/cliente/nuevo-requerimiento/PasoPresupuesto";
import { PasoCriterios } from "@/pages/cliente/nuevo-requerimiento/PasoCriterios";
import { PasoProveedores } from "@/pages/cliente/nuevo-requerimiento/PasoProveedores";
import { PasoRevision } from "@/pages/cliente/nuevo-requerimiento/PasoRevision";

export function NuevoRequerimiento() {
  const {
    navigate,
    step, setStep,
    titulo, setTitulo,
    descripcion, setDescripcion,
    categoria, setCategoria,
    presupuesto, setPresupuesto,
    fechaLimite, setFechaLimite,
    criterios, setCriterios,
    requisitosTecnicos, setRequisitosTecnicos,
    especificaciones, actualizarEspecificacion, eliminarEspecificacion, agregarEspecificacion,
    proveedoresSeleccionados, toggleProveedor,
    submitting,
    proveedores, loadingProveedores,
    total, esCatalogo,
    handleSubmit,
  } = useNuevoRequerimiento();

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

      <div className="flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", s <= step ? "gradient-brand" : "bg-muted")} />
        ))}
      </div>

      <Card className="max-w-3xl p-6">
        {step === 1 && (
          <PasoInfoBasica
            titulo={titulo}
            onTituloChange={setTitulo}
            descripcion={descripcion}
            onDescripcionChange={setDescripcion}
            categoria={categoria}
            onCategoriaChange={setCategoria}
            esCatalogo={esCatalogo}
          />
        )}

        {step === 2 && (
          <PasoEspecificaciones
            requisitosTecnicos={requisitosTecnicos}
            onRequisitosTecnicosChange={setRequisitosTecnicos}
            especificaciones={especificaciones}
            onActualizarEspecificacion={actualizarEspecificacion}
            onEliminarEspecificacion={eliminarEspecificacion}
            onAgregarEspecificacion={agregarEspecificacion}
          />
        )}

        {step === 3 && (
          <PasoPresupuesto
            presupuesto={presupuesto}
            onPresupuestoChange={setPresupuesto}
            fechaLimite={fechaLimite}
            onFechaLimiteChange={setFechaLimite}
          />
        )}

        {step === 4 && (
          <PasoCriterios criterios={criterios} onCriteriosChange={setCriterios} total={total} />
        )}

        {step === 5 && (
          <PasoProveedores
            proveedores={proveedores}
            loadingProveedores={loadingProveedores}
            proveedoresSeleccionados={proveedoresSeleccionados}
            onToggleProveedor={toggleProveedor}
          />
        )}

        {step === 6 && (
          <PasoRevision
            titulo={titulo}
            descripcion={descripcion}
            categoria={categoria}
            presupuesto={presupuesto}
            fechaLimite={fechaLimite}
            criterios={criterios}
            proveedoresSeleccionados={proveedoresSeleccionados}
          />
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
