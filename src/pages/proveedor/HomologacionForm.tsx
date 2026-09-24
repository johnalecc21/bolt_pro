import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, Upload, FileCheck, CheckCircle2, AlertTriangle, Lock, Save, ArrowLeft, ArrowRight, Info, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import {
  fetchMiHomologacion,
  guardarCuestionario,
  subirDocumento,
  obtenerUrlDescarga,
  enviarHomologacion as apiEnviar,
  puedeSubirDocumento,
  documentosObligatoriosFaltantes,
  type HomologacionCuestionario,
} from "@/lib/api/homologacion";
import { apiErrorMessage } from "@/lib/api/http";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SeccionCuestionario, SECCIONES, SECCION_DOCUMENTOS, seccionCompleta } from "./homologacion/SeccionesCuestionario";

const stepsValidacion = [
  { label: "Guardando cuestionario y documentos..." },
  { label: "Calculando score de riesgo y cruce con listas restrictivas (OFAC, ONU)..." },
];

export function HomologacionForm() {
  const navigate = useNavigate();
  const { data: registro, reload } = useApiData(fetchMiHomologacion);
  const [seccion, setSeccion] = useState(0);
  const [cuestionario, setCuestionario] = useState<HomologacionCuestionario>({});
  const [dirty, setDirty] = useState(false);
  const [guardandoCuestionario, setGuardandoCuestionario] = useState(false);
  const [archivoError, setArchivoError] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pasoActual, setPasoActual] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocRef = useRef<{ id: string; nombre: string } | null>(null);
  const cargadoRef = useRef(false);

  useEffect(() => {
    if (registro && !cargadoRef.current) {
      setCuestionario(registro.cuestionario ?? {});
      cargadoRef.current = true;
    }
  }, [registro]);

  const documentos = registro?.documentos ?? [];
  // Only mandatory documents gate the Documentos step and "enviar"; the
  // optional ones (HSE, sostenibilidad, centrales de riesgo, SARLAFT) add
  // score and unlock clients that require them.
  const obligatorios = documentos.filter((d) => d.obligatorio);
  const subidos = obligatorios.length - documentosObligatoriosFaltantes(documentos).length;
  const docsCompletos = obligatorios.length > 0 && subidos === obligatorios.length;

  const estadoSecciones = useMemo(
    () => SECCIONES.map((_, i) => seccionCompleta(i, cuestionario, docsCompletos)),
    [cuestionario, docsCompletos],
  );
  const completas = estadoSecciones.filter(Boolean).length;
  const todoCompleto = completas === SECCIONES.length;
  const incompletas = SECCIONES.map((s, i) => ({ ...s, i })).filter((s) => !estadoSecciones[s.i]);

  const estado = registro?.estado;
  const bloqueadaEnRevision = estado === "en_revision" || estado === "zona_gris";
  const yaAprobada = estado === "aprobado" && !documentos.some((d) => d.estado === "vencido");
  const soloLectura = bloqueadaEnRevision || yaAprobada;
  const meta = SECCIONES[seccion];
  const esUltima = seccion === SECCIONES.length - 1;

  function setField<K extends keyof HomologacionCuestionario>(key: K, value: HomologacionCuestionario[K]) {
    setCuestionario((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function persistir(silencioso = false): Promise<boolean> {
    if (!dirty) return true;
    setGuardandoCuestionario(true);
    try {
      await guardarCuestionario(cuestionario);
      setDirty(false);
      if (!silencioso) toast.success("Cambios guardados");
      return true;
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar el cuestionario."));
      return false;
    } finally {
      setGuardandoCuestionario(false);
    }
  }

  async function irASeccion(destino: number) {
    if (destino === seccion) return;
    if (!soloLectura && dirty) {
      const ok = await persistir(true);
      if (!ok) return;
    }
    setSeccion(destino);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function elegirArchivo(docId: string, nombre: string) {
    pendingDocRef.current = { id: docId, nombre };
    fileInputRef.current?.click();
  }

  async function verDocumento(docId: string) {
    const tab = window.open("", "_blank", "noopener,noreferrer");
    try {
      const url = await obtenerUrlDescarga(docId);
      if (tab) tab.location.href = url;
    } catch (err) {
      tab?.close();
      toast.error(apiErrorMessage(err, "No se pudo abrir el documento."));
    }
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const pending = pendingDocRef.current;
    e.target.value = "";
    if (!file || !pending) return;

    setArchivoError((prev) => { const next = { ...prev }; delete next[pending.id]; return next; });
    setSubiendo(pending.id);
    try {
      await subirDocumento(pending.id, file);
      toast.success("Documento subido", { description: pending.nombre });
      reload();
    } catch (err) {
      const message = apiErrorMessage(err, "No se pudo subir el archivo.");
      setArchivoError((prev) => ({ ...prev, [pending.id]: message }));
      toast.error(message);
    } finally {
      setSubiendo(null);
    }
  }

  async function enviarHomologacion() {
    if (dirty) {
      const ok = await persistir(true);
      if (!ok) return;
    }
    setEnviando(true);
    setPasoActual(stepsValidacion[1].label);
    try {
      const resultado = await apiEnviar();
      if (resultado.alertas.length > 0) {
        toast.warning("Homologación enviada con alertas", {
          description: `${resultado.alertas.length} hallazgo(s) requieren revisión manual de Compliance.`,
        });
      } else {
        toast.success("Homologación enviada", { description: "Está en revisión. Te avisaremos del resultado." });
      }
      navigate("/proveedor/dashboard");
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo enviar la homologación."));
    } finally {
      setEnviando(false);
      setPasoActual(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Homologación de proveedor</h1>
          <p className="text-sm text-muted-foreground">Completa las secciones y sube tus documentos. Guardamos tu avance automáticamente.</p>
        </div>
        {estado && (
          <StatusBadge
            estado={estado === "zona_gris" ? "en_revision" : estado}
            className={estado === "borrador" ? "bg-card border-border" : undefined}
          />
        )}
      </div>

      {registro?.observaciones && estado === "borrador" && (
        <Banner tone="warning" icon={Info} title="Compliance solicitó información adicional">
          {registro.observaciones}
        </Banner>
      )}
      {bloqueadaEnRevision && (
        <Banner tone="warning" icon={Lock}>
          Tu homologación está en revisión. No puedes modificarla hasta que Procurex resuelva.
        </Banner>
      )}
      {yaAprobada && (
        <Banner tone="success" icon={CheckCircle2}>
          Tu homologación ya está aprobada. Solo podrás renovar documentos vencidos o agregar los opcionales que te falten.
        </Banner>
      )}

      {/* Overall progress */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completas / SECCIONES.length) * 100}%` }} />
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">{completas} de {SECCIONES.length} completas</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Step navigation */}
        <aside className="hidden lg:block">
          <nav className="sticky top-6 space-y-1">
            {SECCIONES.map((s, i) => {
              const completa = estadoSecciones[i];
              const activa = i === seccion;
              return (
                <button
                  key={s.titulo}
                  onClick={() => irASeccion(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    activa ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <StepDot index={i} completa={completa} activa={activa} />
                  <span className={cn("truncate", activa && "font-semibold")}>{s.titulo}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Section content */}
        <div className="min-w-0 space-y-4">
          {/* Mobile step indicator */}
          <div className="lg:hidden">
            <p className="text-xs font-medium text-muted-foreground">Paso {seccion + 1} de {SECCIONES.length}</p>
          </div>

          <Card className="p-6 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <meta.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight">{meta.titulo}</h2>
                <p className="text-sm text-muted-foreground">{meta.subtitulo}</p>
              </div>
            </div>

            {/* The Documentos step gates each upload itself (puedeSubirDocumento), so an approved
                proveedor can still renew expired documents or add optional ones. */}
            <fieldset
              disabled={soloLectura && seccion !== SECCION_DOCUMENTOS}
              className={cn("min-w-0", soloLectura && seccion !== SECCION_DOCUMENTOS && "opacity-70")}
            >
              {seccion === SECCION_DOCUMENTOS ? (
                <DocumentosSeccion
                  documentos={documentos}
                  estado={estado}
                  subidos={subidos}
                  subiendo={subiendo}
                  archivoError={archivoError}
                  fileInputRef={fileInputRef}
                  onFileSelected={onFileSelected}
                  onElegirArchivo={elegirArchivo}
                  onVerDocumento={verDocumento}
                />
              ) : (
                <SeccionCuestionario seccion={seccion} c={cuestionario} setField={setField} />
              )}
            </fieldset>

            {/* Submit-readiness (last step only) */}
            {esUltima && !soloLectura && (
              <div className="mt-6 border-t pt-6">
                {todoCompleto ? (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" /> Todo listo para enviar a validación.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-warning-foreground">
                      <AlertTriangle className="h-4 w-4" /> Te falta completar {incompletas.length} sección(es) antes de enviar:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {incompletas.map((s) => (
                        <button
                          key={s.i}
                          onClick={() => irASeccion(s.i)}
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          {s.titulo}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer navigation */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t pt-6">
              <Button variant="outline" onClick={() => irASeccion(Math.max(0, seccion - 1))} disabled={seccion === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
              </Button>
              <div className="flex items-center gap-2">
                {!soloLectura && dirty && (
                  <Button variant="ghost" onClick={() => persistir(false)} disabled={guardandoCuestionario}>
                    {guardandoCuestionario ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar
                  </Button>
                )}
                {esUltima ? (
                  !soloLectura && (
                    enviando ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> {pasoActual}
                      </div>
                    ) : (
                      <Button className="gap-2 gradient-success text-white" onClick={enviarHomologacion} disabled={!todoCompleto}>
                        <CheckCircle2 className="h-4 w-4" />
                        {estado === "rechazado" ? "Reenviar a validación" : "Enviar a validación"}
                      </Button>
                    )
                  )
                ) : (
                  <Button onClick={() => irASeccion(seccion + 1)}>
                    Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StepDot({ index, completa, activa }: { index: number; completa: boolean; activa: boolean }) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
        completa
          ? "bg-success text-success-foreground"
          : activa
            ? "border-2 border-primary bg-primary/5 text-primary"
            : "border border-border bg-card text-muted-foreground",
      )}
    >
      {completa ? <Check className="h-3.5 w-3.5" /> : index + 1}
    </span>
  );
}

function Banner({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "warning" | "success";
  icon: typeof Info;
  title?: string;
  children: React.ReactNode;
}) {
  const styles =
    tone === "success"
      ? "border-success/30 bg-success/5 text-success"
      : "border-warning/30 bg-warning/5 text-warning-foreground";
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", styles)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        <p>{children}</p>
      </div>
    </div>
  );
}

function DocumentosSeccion({
  documentos,
  estado,
  subidos,
  subiendo,
  archivoError,
  fileInputRef,
  onFileSelected,
  onElegirArchivo,
  onVerDocumento,
}: {
  documentos: import("@/lib/api/homologacion").DocumentoHomologacion[];
  estado: import("@/lib/api/homologacion").EstadoHomologacion | undefined;
  subidos: number;
  subiendo: string | null;
  archivoError: Record<string, string>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onElegirArchivo: (id: string, nombre: string) => void;
  onVerDocumento: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Soportes obligatorios cargados</span>
        <span className="font-medium">{subidos} de {documentos.filter((d) => d.obligatorio).length}</span>
      </div>
      <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={onFileSelected} />
      {documentos.map((doc, i) => {
        const tieneArchivo = doc.estado !== "pendiente";
        const puedeEditar = estado ? puedeSubirDocumento(estado, doc) : true;
        const cargando = subiendo === doc.id;
        const label = cargando
          ? undefined
          : !puedeEditar
            ? (tieneArchivo ? "Subido" : "Bloqueado")
            : archivoError[doc.id]
              ? "Reintentar"
              : doc.estado === "vencido"
                ? "Renovar"
                : tieneArchivo
                  ? "Reemplazar"
                  : "Subir";
        const primerOpcional = !doc.obligatorio && (i === 0 || documentos[i - 1].obligatorio);
        return (
          <div key={doc.id}>
          {primerOpcional && (
            <div className="mb-3 mt-5 border-t pt-4">
              <p className="text-sm font-medium">Documentos opcionales</p>
              <p className="text-xs text-muted-foreground">
                No bloquean el envío. Suman puntaje y algunos clientes (energía, minería, sector público) los exigen para invitarte.
              </p>
            </div>
          )}
          <div className={cn("rounded-lg border p-3", archivoError[doc.id] ? "border-destructive/40 bg-destructive/5" : "border-border")}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                {doc.estado === "vencido" ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />
                ) : tieneArchivo ? (
                  <FileCheck className="h-4 w-4 shrink-0 text-success" />
                ) : archivoError[doc.id] ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                ) : (
                  <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{doc.nombre}</span>
                {!doc.obligatorio && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Opcional</span>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {tieneArchivo && (
                  <Button size="sm" variant="ghost" onClick={() => onVerDocumento(doc.id)}>Ver</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onElegirArchivo(doc.id, doc.nombre)} disabled={!puedeEditar || cargando}>
                  {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
                </Button>
              </div>
            </div>
            {archivoError[doc.id] && <p className="mt-2 text-xs text-destructive">{archivoError[doc.id]}</p>}
          </div>
          </div>
        );
      })}
    </div>
  );
}
