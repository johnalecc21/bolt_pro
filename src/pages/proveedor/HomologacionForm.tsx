import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { simulateProcess } from "@/lib/mock/simulate";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiHomologacion, subirDocumento, obtenerUrlDescarga, enviarHomologacion as apiEnviar } from "@/lib/api/homologacion";
import { apiErrorMessage } from "@/lib/api/http";
import { useAuth } from "@/lib/auth/AuthContext";

const secciones = ["Datos legales", "Datos financieros", "Certificaciones", "Referencias comerciales"];
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
  const subidos = documentos.filter((d) => d.estado !== "pendiente").length;
  const completitud = documentos.length ? Math.round((subidos / documentos.length) * 100) : 0;

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
      <div>
        <h1 className="text-2xl font-bold">Formulario de Homologación</h1>
        <p className="text-sm text-muted-foreground">Completa tu perfil para ser considerado en licitaciones</p>
      </div>

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
          <p className="text-sm font-medium">Documentos</p>
          <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={onFileSelected} />
          {documentos.map((doc) => {
            const subido = doc.estado !== "pendiente";
            const cargando = subiendo === doc.id;
            return (
              <div key={doc.id} className={cn("rounded-lg border p-3", archivoError[doc.id] ? "border-destructive/40 bg-destructive/5" : "border-border")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {subido ? <FileCheck className="h-4 w-4 text-success" /> : archivoError[doc.id] ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    <span>{doc.nombre}</span>
                  </div>
                  <div className="flex gap-2">
                    {subido && (
                      <Button size="sm" variant="ghost" onClick={() => verDocumento(doc.id)}>Ver</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => elegirArchivo(doc.id, doc.nombre)} disabled={subido || cargando}>
                      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : subido ? "Subido" : archivoError[doc.id] ? "Reintentar" : "Subir"}
                    </Button>
                  </div>
                </div>
                {archivoError[doc.id] && <p className="mt-2 text-xs text-destructive">{archivoError[doc.id]}</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t pt-6">
          {enviando ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {pasoActual}
            </div>
          ) : (
            <Button className="gradient-brand text-white gap-2" onClick={enviarHomologacion} disabled={completitud < 100}>
              <CheckCircle2 className="h-4 w-4" /> Enviar a validación
            </Button>
          )}
          {completitud < 100 && !enviando && <p className="mt-2 text-xs text-muted-foreground">Sube todos los documentos para poder enviar.</p>}
        </div>
      </Card>
    </div>
  );
}
