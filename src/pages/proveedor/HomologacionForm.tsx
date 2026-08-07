import { useState } from "react";
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
import { fetchMiHomologacion, subirDocumento, enviarHomologacion as apiEnviar } from "@/lib/api/homologacion";
import { apiErrorMessage } from "@/lib/api/http";
import { useAuth } from "@/lib/auth/AuthContext";

const secciones = ["Datos legales", "Datos financieros", "Certificaciones", "Referencias comerciales"];
const stepsValidacion = [
  { label: "Ejecutando OCR sobre documentos..." },
  { label: "Cruzando con registros públicos..." },
  { label: "Verificación OFAC/PEP: sin coincidencias" },
  { label: "Calculando score inicial..." },
];

export function HomologacionForm() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data: registro, reload } = useApiData(fetchMiHomologacion);
  const [seccion, setSeccion] = useState(0);
  const [archivoError, setArchivoError] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [pasoActual, setPasoActual] = useState<string | null>(null);

  const documentos = registro?.documentos ?? [];
  const subidos = documentos.filter((d) => d.estado !== "pendiente").length;
  const completitud = documentos.length ? Math.round((subidos / documentos.length) * 100) : 0;

  async function subirArchivo(docId: string, nombre: string) {
    // "Estados financieros" fails once so the specific-error path is easy to demo.
    if (nombre === "Estados financieros" && !archivoError[docId]) {
      setArchivoError((prev) => ({ ...prev, [docId]: "El archivo supera el tamaño máximo permitido (10 MB). Comprime el PDF e inténtalo de nuevo." }));
      return;
    }
    setArchivoError((prev) => { const next = { ...prev }; delete next[docId]; return next; });
    try {
      await subirDocumento(docId);
      toast.success("Documento subido", { description: nombre });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function enviarHomologacion() {
    setEnviando(true);
    for (const step of stepsValidacion) {
      setPasoActual(step.label);
      await simulateProcess([{ duration: 700, label: step.label }]);
    }
    try {
      await apiEnviar();
      toast.success("Homologación enviada", { description: "Está en revisión. Te avisaremos del resultado." });
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
          {documentos.map((doc) => {
            const subido = doc.estado !== "pendiente";
            return (
              <div key={doc.id} className={cn("rounded-lg border p-3", archivoError[doc.id] ? "border-destructive/40 bg-destructive/5" : "border-border")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {subido ? <FileCheck className="h-4 w-4 text-success" /> : archivoError[doc.id] ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    <span>{doc.nombre}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => subirArchivo(doc.id, doc.nombre)} disabled={subido}>
                    {subido ? "Subido" : archivoError[doc.id] ? "Reintentar" : "Subir"}
                  </Button>
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
