import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  fetchRequerimiento, addComentario, subirDocumentoRequerimiento, obtenerUrlDescargaDocumento,
  type AprobacionRequerimiento, type DocumentoRequerimiento,
} from "@/lib/api/requerimientos";
import { aprobarSolicitud, rechazarSolicitud } from "@/lib/api/aprobaciones";
import type { RoleCode } from "@/lib/api/matrizAprobacion";
import { apiErrorMessage } from "@/lib/api/http";
import { useAuth } from "@/lib/auth/AuthContext";
import { useApiData } from "@/hooks/useApiData";

function esElegible(aprobacion: AprobacionRequerimiento, role: RoleCode) {
  if (aprobacion.tipoRegla === "SECUENCIAL") {
    return aprobacion.rolesRequeridos[aprobacion.pasoActual] === role;
  }
  return aprobacion.rolesRequeridos.includes(role);
}

export function useDetalleRequerimiento(id: string | undefined) {
  const { currentUser } = useAuth();
  const { data: req, loading, reload } = useApiData(() => fetchRequerimiento(id!), [id]);
  const [comentario, setComentario] = useState("");
  const [sending, setSending] = useState(false);
  const [resolviendo, setResolviendo] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [descargando, setDescargando] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAprobar(aprobacionId: string) {
    setResolviendo(true);
    try {
      await aprobarSolicitud(aprobacionId);
      toast.success("Aprobación registrada");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo aprobar."));
    } finally {
      setResolviendo(false);
    }
  }

  async function handleRechazar(aprobacionId: string, motivo?: string) {
    setResolviendo(true);
    try {
      await rechazarSolicitud(aprobacionId, motivo ?? "");
      toast.info("Solicitud rechazada");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo rechazar."));
    } finally {
      setResolviendo(false);
    }
  }

  async function enviarComentario() {
    if (!comentario.trim() || !id) return;
    setSending(true);
    try {
      await addComentario(id, comentario.trim());
      setComentario("");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function descargar(doc: DocumentoRequerimiento) {
    if (!id || doc.estado !== "subido") return;
    setDescargando(doc.id);
    // Open the tab synchronously (still inside the click's user-activation
    // window) and navigate it once the signed URL resolves — opening after
    // the await gets silently popup-blocked in most browsers.
    const pendingTab = window.open("", "_blank");
    try {
      const { url } = await obtenerUrlDescargaDocumento(id, doc.id);
      if (pendingTab) pendingTab.location.href = url;
    } catch (err) {
      pendingTab?.close();
      toast.error(apiErrorMessage(err, "No se pudo descargar el documento."));
    } finally {
      setDescargando(null);
    }
  }

  function abrirSelectorArchivo() {
    fileInputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !id) return;
    setSubiendo(true);
    try {
      await subirDocumentoRequerimiento(id, file);
      toast.success("Documento adjuntado", { description: file.name });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo adjuntar el documento."));
    } finally {
      setSubiendo(false);
    }
  }

  const aprobacionPendiente = req?.aprobaciones.find((a) => a.estado === "PENDIENTE");
  const rolActual = currentUser?.role.toUpperCase() as RoleCode | undefined;
  const puedeResolver = !!aprobacionPendiente && !!rolActual && esElegible(aprobacionPendiente, rolActual);
  const todosLosPasos = req?.aprobaciones.flatMap((a) => a.pasos.map((p) => ({ ...p, aprobacionId: a.id }))) ?? [];

  return {
    req,
    loading,
    reload,
    comentario,
    setComentario,
    sending,
    enviarComentario,
    resolviendo,
    handleAprobar,
    handleRechazar,
    subiendo,
    descargando,
    fileInputRef,
    abrirSelectorArchivo,
    onFileSelected,
    descargar,
    aprobacionPendiente,
    puedeResolver,
    todosLosPasos,
  };
}
