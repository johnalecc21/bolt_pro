import { Fragment, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { type Contrato } from "@/lib/types";
import { fetchContratos, fetchContrato, subirArchivoContrato, obtenerUrlArchivoContrato, emitirPo } from "@/lib/api/contratos";
import { generateContratoPdf } from "@/lib/pdf/contrato";
import { apiErrorMessage } from "@/lib/api/http";
import { Download, FileCheck, Calendar, Loader2, Upload, FileUp, FilePlus2 } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useApiData } from "@/hooks/useApiData";

const hoy = new Date().toISOString().slice(0, 10);

export function Contratos() {
  const { data: contratos, loading, reload } = useApiData(() => fetchContratos());
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [descargando, setDescargando] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [emitiendoPoId, setEmitiendoPoId] = useState<string | null>(null);
  const [nuevaPo, setNuevaPo] = useState({ monto: "", vigenciaInicio: hoy, vigenciaFin: "" });
  const [emitiendo, setEmitiendo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subiendoIdRef = useRef<string | null>(null);
  const categorias = ["Todas", ...Array.from(new Set((contratos ?? []).map((c) => c.categoria)))];

  const filtrados = (contratos ?? []).filter((c: Contrato) => {
    const matchQuery = `${c.codigo} ${c.proveedor}`.toLowerCase().includes(query.toLowerCase());
    const matchCat = categoria === "Todas" || c.categoria === categoria;
    return matchQuery && matchCat;
  });

  const hoyMs = Date.now();
  const diasHastaVencer = (fecha: string) => Math.ceil((new Date(fecha).getTime() - hoyMs) / (24 * 60 * 60 * 1000));
  const vigentes = (contratos ?? []).filter((c) => c.estado !== "Vencido");
  const proximosAVencer = [60, 30, 15].map((umbral) => ({
    dias: umbral,
    contratos: vigentes.filter((c) => {
      const restantes = diasHastaVencer(c.vigenciaFin);
      return restantes >= 0 && restantes <= umbral;
    }),
  }));

  async function descargar(c: Contrato) {
    setDescargando(c.id);
    // Open the tab synchronously (still inside the click's user-activation
    // window) and navigate it once the signed URL resolves — opening after
    // the await gets silently popup-blocked in most browsers.
    const pendingTab = c.archivoNombre ? window.open("", "_blank") : null;
    try {
      if (c.archivoNombre) {
        const { url } = await obtenerUrlArchivoContrato(c.id);
        if (pendingTab) pendingTab.location.href = url;
        toast.success("Documento propio abierto", { description: c.archivoNombre });
      } else {
        const detalle = await fetchContrato(c.id);
        generateContratoPdf(detalle);
        toast.success("PDF generado", { description: `${c.codigo}.pdf` });
      }
    } catch (err) {
      pendingTab?.close();
      toast.error(apiErrorMessage(err, "No se pudo descargar el documento."));
    } finally {
      setDescargando(null);
    }
  }

  function abrirSelectorArchivo(id: string) {
    subiendoIdRef.current = id;
    fileInputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = subiendoIdRef.current;
    e.target.value = "";
    if (!file || !id) return;
    setSubiendo(id);
    try {
      await subirArchivoContrato(id, file);
      toast.success("Documento adjuntado", { description: file.name });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo adjuntar el documento."));
    } finally {
      setSubiendo(null);
    }
  }

  function abrirEmitirPo(id: string) {
    setEmitiendoPoId(id);
    setNuevaPo({ monto: "", vigenciaInicio: hoy, vigenciaFin: "" });
  }

  async function confirmarEmitirPo() {
    if (!emitiendoPoId) return;
    const monto = Number(nuevaPo.monto);
    if (!monto || !nuevaPo.vigenciaFin) return;
    setEmitiendo(true);
    try {
      const po = await emitirPo(emitiendoPoId, { monto, vigenciaInicio: nuevaPo.vigenciaInicio, vigenciaFin: nuevaPo.vigenciaFin });
      toast.success("PO emitida", { description: `${po.codigo} — $${monto.toLocaleString()}` });
      setEmitiendoPoId(null);
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo emitir la PO."));
    } finally {
      setEmitiendo(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Contratos / Órdenes de Compra</h1>
        <p className="text-sm text-muted-foreground">Archivo central y versionado de todo lo firmado</p>
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={onFileSelected} />

      <div className="flex flex-wrap gap-3">
        <SearchInput placeholder="Buscar por ID o proveedor..." value={query} onChange={setQuery} />
        <select className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <TableSkeleton /> : (
      <Card className="overflow-hidden">
        {filtrados.length === 0 ? (
          <EmptyState icon={FileCheck} title="No se encontraron documentos" description="Ajusta los filtros de búsqueda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Documento</th>
                  <th className="p-4 font-medium">Proveedor</th>
                  <th className="p-4 font-medium">Categoría</th>
                  <th className="p-4 font-medium">Monto</th>
                  <th className="p-4 font-medium">Vigencia</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <Fragment key={c.id}>
                    <tr className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <p className="text-sm font-medium">{c.codigo}</p>
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          {c.tipo}
                          {c.archivoNombre && (
                            <span className="flex items-center gap-0.5 text-info" title={c.archivoNombre}>
                              <FileUp className="h-3 w-3" /> Documento propio
                            </span>
                          )}
                          {c.hijas && c.hijas.length > 0 && (
                            <span className="text-primary">{c.hijas.length} PO{c.hijas.length === 1 ? "" : "s"} emitida{c.hijas.length === 1 ? "" : "s"}</span>
                          )}
                        </p>
                      </td>
                      <td className="p-4 text-sm">{c.proveedor}</td>
                      <td className="p-4 text-sm text-muted-foreground">{c.categoria}</td>
                      <td className="p-4 text-sm font-medium">${c.monto.toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {c.vigenciaInicio} — {c.vigenciaFin}
                        </div>
                      </td>
                      <td className="p-4"><StatusBadge estado={c.estado} /></td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.tipo === "Contrato" && (
                            <Button variant="ghost" size="icon" onClick={() => abrirEmitirPo(c.id)} title="Emitir PO bajo este Contrato Marco">
                              <FilePlus2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={subiendo === c.id}
                            onClick={() => abrirSelectorArchivo(c.id)}
                            title={c.archivoNombre ? "Reemplazar documento propio" : "Adjuntar mi propio PO/contrato"}
                          >
                            {subiendo === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" disabled={descargando === c.id} onClick={() => descargar(c)} title="Descargar">
                            {descargando === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {emitiendoPoId === c.id && (
                      <tr className="border-b border-border bg-muted/20">
                        <td colSpan={7} className="p-4">
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Monto de la PO</label>
                              <Input type="number" className="h-8 w-32 text-sm" value={nuevaPo.monto} onChange={(e) => setNuevaPo((p) => ({ ...p, monto: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Vigencia inicio</label>
                              <Input type="date" className="h-8 text-sm" value={nuevaPo.vigenciaInicio} onChange={(e) => setNuevaPo((p) => ({ ...p, vigenciaInicio: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Vigencia fin</label>
                              <Input type="date" className="h-8 text-sm" value={nuevaPo.vigenciaFin} onChange={(e) => setNuevaPo((p) => ({ ...p, vigenciaFin: e.target.value }))} />
                            </div>
                            <Button size="sm" className="h-8" disabled={!nuevaPo.monto || !nuevaPo.vigenciaFin || emitiendo} onClick={confirmarEmitirPo}>
                              {emitiendo ? "Emitiendo..." : "Emitir PO"}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEmitiendoPoId(null)}>Cancelar</Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      )}

      <Card className="p-5">
        <h2 className="mb-1 font-semibold">Recordatorios de vencimiento</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Un proceso diario notifica a compradores y administradores cuando un contrato o PO cruza estos plazos antes de su vencimiento.
        </p>
        <div className="flex flex-wrap gap-3">
          {proximosAVencer.map(({ dias, contratos: c }) => (
            <span
              key={dias}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${c.length > 0 ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}
            >
              <Calendar className="h-3.5 w-3.5" /> {dias} días · {c.length === 0 ? "sin pendientes" : `${c.length} contrato${c.length === 1 ? "" : "s"}`}
            </span>
          ))}
        </div>
        {proximosAVencer[2].contratos.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {proximosAVencer[2].contratos.map((c) => (
              <li key={c.id}>
                <span className="font-medium text-foreground">{c.codigo}</span> ({c.proveedor}) vence en {diasHastaVencer(c.vigenciaFin)} días — {c.vigenciaFin}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Trazabilidad — registro de auditoría</h2>
        <AuditLogTable limit={5} showPagination={false} />
      </div>

      <p className="text-xs text-muted-foreground">
        Cada documento enlaza con su requerimiento original. Por ejemplo: <Link to="/cliente/requerimientos/RFP-2024-0032" className="text-primary hover:underline">RFP-2024-0032</Link>.
      </p>
    </div>
  );
}
