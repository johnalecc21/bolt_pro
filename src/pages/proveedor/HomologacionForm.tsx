import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileCheck, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { simulateProcess } from "@/lib/mock/simulate";
import { useApiData } from "@/hooks/useApiData";
import {
  fetchMiHomologacion,
  subirDocumento,
  obtenerUrlDescarga,
  enviarHomologacion as apiEnviar,
  puedeSubirDocumento,
  type CategoriaDocumento,
} from "@/lib/api/homologacion";
import { apiErrorMessage } from "@/lib/api/http";
import { useAuth } from "@/lib/auth/AuthContext";
import { StatusBadge } from "@/components/shared/StatusBadge";

const secciones = ["Datos legales", "Datos financieros", "Certificaciones", "Referencias comerciales"];
const categoriaPorSeccion: CategoriaDocumento[] = ["legal", "financiero", "certificaciones", "referencias"];
const stepsValidacion = [
  { label: "Subiendo documentos para verificación..." },
  { label: "Ejecutando OCR y verificación OFAC/PEP..." },
];

export function HomologacionForm() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data: registro, reload } = useApiData(fetchMiHomologacion);
  const [seccion, setSeccion] = useState(0);
  const [archivoError, setArchivoError] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pasoActual, setPasoActual] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocRef = useRef<{ id: string; nombre: string } | null>(null);

  const documentos = registro?.documentos ?? [];
  const documentosSeccion = documentos.filter((d) => d.categoria === categoriaPorSeccion[seccion]);
  const subidos = documentos.filter((d) => d.estado === "subido" || d.estado === "validado").length;
  const completitud = documentos.length ? Math.round((subidos / documentos.length) * 100) : 0;

  const estado = registro?.estado;
  const bloqueadaEnRevision = estado === "en_revision" || estado === "zona_gris";
  const yaAprobada = estado === "aprobado" && !documentos.some((d) => d.estado === "vencido");

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
    setEnviando(true);
    setPasoActual(stepsValidacion[0].label);
    await simulateProcess([{ duration: 500, label: stepsValidacion[0].label }]);
    setPasoActual(stepsValidacion[1].label);
    try {
      const resultado = await apiEnviar();
      if (resultado.alertas.length > 0) {
        toast.warning("Homologación enviada con alertas", {
          description: `${resultado.alertas.length} hallazgo(s) de la verificación OCR/OFAC requieren revisión manual.`,
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Formulario de Homologación</h1>
          <p className="text-sm text-muted-foreground">Completa tu perfil para ser considerado en licitaciones</p>
        </div>
        {estado && <StatusBadge estado={estado === "zona_gris" ? "en_revision" : estado} />}
      </div>

      {bloqueadaEnRevision && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Tu homologación está en revisión. No podés modificar documentos hasta que Procurex resuelva.</p>
        </div>
      )}
      {yaAprobada && (
        <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Tu homologación ya está aprobada. Solo vas a poder editar un documento si vence y necesita renovarse.</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full gradient-brand rounded-full transition-all" style={{ width: `${completitud}%` }} />
        </div>
        <span className="text-sm font-medium">{completitud}% completo</span>
      </div>

      <div className="flex gap-2 border-b border-border">
        {secciones.map((s, i) => (
          <button
            key={s}
            onClick={() => setSeccion(i)}
            className={cn("border-b-2 px-4 py-2 text-sm font-medium transition-colors", seccion === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="max-w-2xl p-6">
        {seccion === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Razón social</Label><Input defaultValue={currentUser?.nombre ?? ""} /></div>
              <div className="space-y-1.5"><Label>NIT / RUT</Label><Input placeholder="900.456.789-1" /></div>
              <div className="space-y-1.5"><Label>Representante legal</Label><Input placeholder="Diego Ramírez" /></div>
              <div className="space-y-1.5"><Label>País de constitución</Label><Input defaultValue="Colombia" /></div>
            </div>
          </div>
        )}
        {seccion === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Ingresos anuales estimados</Label><Input type="number" placeholder="2500000" /></div>
              <div className="space-y-1.5"><Label>Años de operación</Label><Input type="number" placeholder="8" /></div>
            </div>
          </div>
        )}
        {(seccion === 2 || seccion === 3) && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Carga los documentos requeridos para esta sección.</p>
          </div>
        )}

        <div className="mt-6 space-y-2 border-t pt-6">
          <p className="text-sm font-medium">Documentos de {secciones[seccion].toLowerCase()}</p>
          <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={onFileSelected} />
          {documentosSeccion.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay documentos requeridos en esta sección.</p>
          )}
          {documentosSeccion.map((doc) => {
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
            return (
              <div key={doc.id} className={cn("rounded-lg border p-3", archivoError[doc.id] ? "border-destructive/40 bg-destructive/5" : "border-border")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {doc.estado === "vencido" ? (
                      <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                    ) : tieneArchivo ? (
                      <FileCheck className="h-4 w-4 text-success" />
                    ) : archivoError[doc.id] ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{doc.nombre}</span>
                  </div>
                  <div className="flex gap-2">
                    {tieneArchivo && (
                      <Button size="sm" variant="ghost" onClick={() => verDocumento(doc.id)}>Ver</Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => elegirArchivo(doc.id, doc.nombre)}
                      disabled={!puedeEditar || cargando}
                    >
                      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
                    </Button>
                  </div>
                </div>
                {archivoError[doc.id] && <p className="mt-2 text-xs text-destructive">{archivoError[doc.id]}</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t pt-6">
          {bloqueadaEnRevision || yaAprobada ? null : enviando ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {pasoActual}
            </div>
          ) : (
            <Button className="gap-2" onClick={enviarHomologacion} disabled={completitud < 100}>
              <CheckCircle2 className="h-4 w-4" />
              {estado === "rechazado" ? "Reenviar a validación" : estado === "aprobado" ? "Enviar renovación" : "Enviar a validación"}
            </Button>
          )}
          {!bloqueadaEnRevision && !yaAprobada && completitud < 100 && !enviando && (
            <p className="mt-2 text-xs text-muted-foreground">Sube todos los documentos para poder enviar.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
