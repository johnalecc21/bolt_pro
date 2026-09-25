import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import {
  AlertTriangle, CheckCircle2, Copy, Download, Eye, FileText, FileType2, ImagePlus, Loader2, Palette, Power, Trash2, Upload, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import { fechaLocal } from "@/lib/fecha";
import { fetchCategoriasContratos } from "@/lib/api/contratos";
import { cargarLogo, generateContratoPdf } from "@/lib/pdf/contrato";
import {
  activarPlantilla, descargarEjemplo, eliminarPlantilla, erroresPlantilla, fetchMarca, fetchPlantillas, guardarMarca, quitarLogo,
  subirLogo, subirPlantilla, TIPO_PLANTILLA_LABEL, urlPlantilla, vistaPrevia,
  type CamposMarca, type GrupoMarcadores, type Marca, type Plantilla, type TipoPlantilla,
} from "@/lib/api/plantillas";

const TIPOS: TipoPlantilla[] = ["ORDEN_COMPRA", "CONTRATO_MARCO"];

/**
 * The company's own contract / PO templates (Word with placeholders, filled
 * on signing) and its letterhead for the documents Procurex generates.
 */
export function PlantillasDocumentos() {
  const [tab, setTab] = useState("plantillas");
  const { data, loading, reload } = useApiData(fetchPlantillas);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Plantillas y documentos</h1>
        <p className="text-sm text-muted-foreground">
          Usa tus propios formatos de orden de compra y contrato: Procurex los llena con los datos reales al firmar, y el PDF queda como documento vigente.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="plantillas">Plantillas Word</TabsTrigger>
          <TabsTrigger value="marca">Marca y datos</TabsTrigger>
          <TabsTrigger value="guia">Guía de marcadores</TabsTrigger>
        </TabsList>
        <TabsContent value="plantillas" className="mt-4 space-y-6">
          {loading && !data ? <TableSkeleton /> : data && <Plantillas datos={data} onCambio={reload} onGuia={() => setTab("guia")} />}
        </TabsContent>
        <TabsContent value="marca" className="mt-4">
          <MarcaDocumentos />
        </TabsContent>
        <TabsContent value="guia" className="mt-4">
          {data && <Guia grupos={data.marcadores} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------- plantillas

function Plantillas({ datos, onCambio, onGuia }: { datos: Awaited<ReturnType<typeof fetchPlantillas>>; onCambio: () => void; onGuia: () => void }) {
  const [subiendo, setSubiendo] = useState<TipoPlantilla | null>(null);
  const [recien, setRecien] = useState<Plantilla | null>(null);

  return (
    <>
      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">Cómo funciona</h2>
        <ol className="grid gap-3 text-sm sm:grid-cols-3">
          {[
            ["1. Prepara tu Word", "Toma tu formato actual y reemplaza los datos variables por marcadores como {{proveedor.nit}} o {{contrato.valor}}. Puedes partir de nuestro ejemplo."],
            ["2. Súbela y revisa", "Procurex la valida (marcadores mal escritos, llaves sin cerrar) y la puedes ver llena con tu último contrato real."],
            ["3. Actívala", "Desde ahí, cada firma o PO emitida genera el documento con tu formato; las prórrogas y cambios de valor generan una versión nueva."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">{t}</p>
              <p className="text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          {TIPOS.map((t) => (
            <Button key={t} variant="outline" size="sm" className="gap-1.5" onClick={() => descargarEjemplo(t).catch((e) => toast.error(apiErrorMessage(e)))}>
              <Download className="h-4 w-4" aria-hidden="true" /> Ejemplo de {TIPO_PLANTILLA_LABEL[t].toLowerCase()}
            </Button>
          ))}
          <Button variant="link" size="sm" onClick={onGuia}>Ver todos los marcadores</Button>
        </div>
        {!datos.pdfDisponible && (
          <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" aria-hidden="true" />
            El servidor aún no tiene el conversor a PDF: los documentos se entregan en Word ya llenos.
          </p>
        )}
      </Card>

      {TIPOS.map((tipo) => {
        const lista = datos.plantillas.filter((p) => p.tipo === tipo);
        return (
          <Card key={tipo} className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{TIPO_PLANTILLA_LABEL[tipo]}</h2>
                <p className="text-sm text-muted-foreground">
                  {tipo === "ORDEN_COMPRA" ? "Para las POs directas y las emitidas bajo un contrato marco." : "Para los contratos marco (adjudicaciones sobre el umbral de la empresa)."}
                  {" "}Sin plantilla activa se usa el formato de Procurex con tu marca.
                </p>
              </div>
              <Button className="gap-1.5" onClick={() => setSubiendo(tipo)}><Upload className="h-4 w-4" aria-hidden="true" /> Subir plantilla</Button>
            </div>
            {lista.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Aún no has subido plantillas de {TIPO_PLANTILLA_LABEL[tipo].toLowerCase()}.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {lista.map((p) => <FilaPlantilla key={p.id} p={p} pdf={datos.pdfDisponible} onCambio={onCambio} />)}
              </ul>
            )}
          </Card>
        );
      })}

      <SubirPlantilla
        tipo={subiendo}
        onClose={() => setSubiendo(null)}
        onSubida={(p) => {
          setSubiendo(null);
          setRecien(p);
          onCambio();
        }}
      />
      <Dialog open={!!recien} onOpenChange={(o) => !o && setRecien(null)}>
        {recien && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" /> Plantilla válida</DialogTitle>
              <DialogDescription>
                "{recien.nombre}" usa {recien.marcadores.length} marcador(es). Revísala llena con datos reales y actívala cuando esté bien.
              </DialogDescription>
            </DialogHeader>
            <Advertencias lista={recien.advertencias} />
            <DialogFooter className="gap-2">
              <Button variant="outline" className="gap-1.5" onClick={() => previsualizar(recien, datos.pdfDisponible)}><Eye className="h-4 w-4" aria-hidden="true" /> Vista previa</Button>
              <Button
                className="gap-1.5"
                onClick={async () => {
                  try {
                    await activarPlantilla(recien.id, true);
                    toast.success("Plantilla activada");
                    setRecien(null);
                    onCambio();
                  } catch (err) {
                    toast.error(apiErrorMessage(err));
                  }
                }}
              >
                <Power className="h-4 w-4" aria-hidden="true" /> Activar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

async function previsualizar(p: Plantilla, pdf: boolean, formato?: "pdf" | "docx") {
  const id = toast.loading("Generando vista previa…");
  try {
    const r = await vistaPrevia(p.id, formato ?? (pdf ? "pdf" : "docx"));
    toast.success(r.formato === "pdf" ? "Vista previa abierta" : "Vista previa descargada (Word)", {
      id,
      description: r.conDatosReales ? "Con los datos de tu último documento de este tipo." : "Con datos de ejemplo: aún no hay documentos de este tipo.",
    });
  } catch (err) {
    toast.error(apiErrorMessage(err, "No se pudo generar la vista previa."), { id });
  }
}

function Advertencias({ lista }: { lista: string[] }) {
  if (lista.length === 0) return null;
  return (
    <ul className="space-y-1 rounded-lg bg-warning/10 p-3 text-sm">
      {lista.map((a) => (
        <li key={a} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" aria-hidden="true" /> {a}</li>
      ))}
    </ul>
  );
}

function FilaPlantilla({ p, pdf, onCambio }: { p: Plantilla; pdf: boolean; onCambio: () => void }) {
  const [ocupado, setOcupado] = useState(false);
  async function accion(fn: () => Promise<unknown>, ok: string) {
    setOcupado(true);
    try {
      await fn();
      toast.success(ok);
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <li className="flex flex-wrap items-start gap-3 p-3">
      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {p.nombre}
          {p.activa ? (
            <Badge variant="secondary" className="gap-1 bg-success/15 text-success"><CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Activa</Badge>
          ) : (
            <Badge variant="secondary">Inactiva</Badge>
          )}
          <Badge variant="secondary">{p.categoria ?? "Todas las categorías"}</Badge>
        </p>
        <p className="text-xs text-muted-foreground">{p.archivoNombre} · {p.marcadores.length} marcadores · subida por {p.subidaPor} el {fechaLocal(p.createdAt)}</p>
        {p.advertencias.length > 0 && <p className="mt-1 text-xs text-warning-foreground">⚠ {p.advertencias.join(" ")}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => previsualizar(p, pdf)}><Eye className="h-4 w-4" aria-hidden="true" /> Vista previa</Button>
        {pdf && <Button size="sm" variant="ghost" onClick={() => previsualizar(p, pdf, "docx")}>Word</Button>}
        <Button size="sm" variant={p.activa ? "ghost" : "default"} disabled={ocupado} onClick={() => accion(() => activarPlantilla(p.id, !p.activa), p.activa ? "Plantilla desactivada" : "Plantilla activada")}>
          {p.activa ? "Desactivar" : "Activar"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Descargar ${p.archivoNombre}`}
          onClick={async () => {
            const tab = window.open("", "_blank");
            try {
              const url = await urlPlantilla(p.id);
              if (tab) tab.location.href = url;
            } catch (err) {
              tab?.close();
              toast.error(apiErrorMessage(err));
            }
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
        <ConfirmDialog
          trigger={<Button size="icon" variant="ghost" aria-label={`Eliminar ${p.nombre}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
          title="Eliminar plantilla"
          description={`"${p.nombre}" deja de usarse para documentos nuevos. Los documentos ya generados no cambian.`}
          confirmLabel="Eliminar"
          onConfirm={() => accion(() => eliminarPlantilla(p.id), "Plantilla eliminada")}
        />
      </div>
    </li>
  );
}

function SubirPlantilla({ tipo, onClose, onSubida }: { tipo: TipoPlantilla | null; onClose: () => void; onSubida: (p: Plantilla) => void }) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    if (!tipo) return;
    setNombre("");
    setCategoria("");
    setArchivo(null);
    setErrores([]);
    fetchCategoriasContratos().then(setCategorias).catch(() => setCategorias([]));
  }, [tipo]);

  async function enviar() {
    if (!tipo || !archivo) return;
    setEnviando(true);
    setErrores([]);
    try {
      onSubida(await subirPlantilla(archivo, { nombre: nombre.trim() || archivo.name.replace(/\.docx$/i, ""), tipo, categoria }));
    } catch (err) {
      const lista = erroresPlantilla(err);
      if (lista.length) setErrores(lista);
      else toast.error(apiErrorMessage(err, "No se pudo subir la plantilla."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={!!tipo} onOpenChange={(o) => !o && onClose()}>
      {tipo && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subir plantilla de {TIPO_PLANTILLA_LABEL[tipo].toLowerCase()}</DialogTitle>
            <DialogDescription>Archivo Word (.docx) con marcadores entre llaves dobles, por ejemplo {"{{proveedor.razonSocial}}"}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pl-archivo">Archivo</Label>
              <Input id="pl-archivo" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); setErrores([]); }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-nombre">Nombre</Label>
              <Input id="pl-nombre" value={nombre} maxLength={120} placeholder={archivo?.name.replace(/\.docx$/i, "") ?? "OC corporativa 2026"} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-categoria">Usar para</Label>
              <select id="pl-categoria" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categorias.map((c) => <option key={c} value={c}>Solo {c}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Una plantilla de una categoría tiene prioridad sobre la general.</p>
            </div>
            {errores.length > 0 && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">
                <p className="mb-1 flex items-center gap-2 font-medium text-destructive"><XCircle className="h-4 w-4" aria-hidden="true" /> La plantilla tiene errores. Corrígelos en Word y súbela de nuevo:</p>
                <ul className="list-disc space-y-0.5 pl-6">{errores.map((e) => <li key={e}>{e}</li>)}</ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button className="gap-1.5" disabled={!archivo || enviando} onClick={enviar}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />} Subir y validar
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------- marca

const CAMPOS: [keyof CamposMarca, string, string][] = [
  ["razonSocial", "Razón social", "Acme S.A.S."],
  ["nit", "NIT", "900.123.456-7"],
  ["direccion", "Dirección", "Cra 7 # 71-21"],
  ["ciudad", "Ciudad", "Bogotá D.C."],
  ["telefono", "Teléfono", "601 555 0100"],
  ["email", "Correo", "compras@empresa.co"],
  ["sitioWeb", "Sitio web", "www.empresa.co"],
  ["representanteLegal", "Representante legal (firma)", "María Gómez"],
  ["cargoRepresentante", "Cargo", "Gerente General"],
];

function MarcaDocumentos() {
  const { data, loading, reload } = useApiData(fetchMarca);
  const [form, setForm] = useState<CamposMarca | null>(null);
  const [guardando, setGuardando] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      const { nombreEmpresa: _n, tieneLogo: _t, logoUrl: _l, ...campos } = data;
      setForm(campos);
    }
  }, [data]);

  if (loading && !data) return <TableSkeleton />;
  if (!data || !form) return null;
  const set = (k: keyof CamposMarca, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));

  async function guardar() {
    setGuardando(true);
    try {
      await guardarMarca(form!);
      toast.success("Datos guardados", { description: "Se usan en los documentos nuevos y en los marcadores {{empresa.…}}." });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  async function logo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      await subirLogo(f);
      toast.success("Logo actualizado");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function vistaPreviaPdf(marca: Marca) {
    const logoData = marca.logoUrl ? await cargarLogo(marca.logoUrl) : null;
    const hoy = fechaLocal(new Date().toISOString());
    generateContratoPdf(
      {
        id: "ejemplo",
        codigo: "PO-0000 (ejemplo)",
        tipo: "Orden de compra",
        proveedor: "Proveedor de ejemplo S.A.S.",
        cliente: marca.nombreEmpresa,
        categoria: "Mantenimiento",
        monto: 15_000_000,
        moneda: "COP",
        vigenciaInicio: hoy,
        vigenciaFin: hoy,
        estado: "Activo",
        objeto: "Suministro de repuestos para mantenimiento preventivo.",
        lineas: [{ descripcion: "Rodamiento 6204", unidad: "und", cantidad: 10, precioUnitario: 1_500_000, subtotal: 15_000_000 }],
        hitos: [{ label: "Entrega", comprometido: hoy, real: null, estado: "Pendiente", porcentaje: 100 }],
        garantiaMeses: 12,
        plazoDias: 15,
        condicionesPagoDias: 30,
      },
      { ...form!, logo: logoData },
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Datos de tu empresa en los documentos</h2>
          <p className="text-sm text-muted-foreground">Llenan los marcadores {"{{empresa.…}}"} de tus plantillas y el encabezado del formato de Procurex.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CAMPOS.map(([k, label, ph]) => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={`marca-${k}`}>{label}</Label>
              <Input id={`marca-${k}`} value={form[k]} placeholder={k === "razonSocial" ? data.nombreEmpresa : ph} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="marca-clausulas">Cláusulas de tu empresa</Label>
          <Textarea id="marca-clausulas" rows={7} value={form.clausulas} maxLength={20000} placeholder="PRIMERA. CONFIDENCIALIDAD. …" onChange={(e) => set("clausulas", e.target.value)} />
          <p className="text-xs text-muted-foreground">Se agregan al formato de Procurex y están disponibles como {"{{clausulas}}"} en tus plantillas.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="marca-pie">Pie de página</Label>
          <Input id="marca-pie" value={form.piePagina} maxLength={300} placeholder="Documento confidencial · Acme S.A.S." onChange={(e) => set("piePagina", e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={guardando} onClick={guardar}>{guardando ? "Guardando…" : "Guardar"}</Button>
          <Button variant="outline" className="gap-1.5" onClick={() => vistaPreviaPdf(data)}><FileType2 className="h-4 w-4" aria-hidden="true" /> Vista previa del formato Procurex</Button>
        </div>
      </Card>

      <Card className="h-fit space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-semibold"><Palette className="h-4 w-4 text-primary" aria-hidden="true" /> Logo y color</h2>
        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-3">
          {data.logoUrl ? <img src={data.logoUrl} alt="Logo de la empresa" className="max-h-full max-w-full object-contain" /> : <span className="text-sm text-muted-foreground">Sin logo</span>}
        </div>
        <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={logo} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => logoRef.current?.click()}><ImagePlus className="h-4 w-4" aria-hidden="true" /> {data.tieneLogo ? "Cambiar" : "Subir logo"}</Button>
          {data.tieneLogo && (
            <Button variant="ghost" size="sm" onClick={() => quitarLogo().then(reload).catch((e) => toast.error(apiErrorMessage(e)))}>Quitar</Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG o WebP de hasta 2 MB. Mejor con fondo transparente.</p>
        <div className="space-y-1.5">
          <Label htmlFor="marca-color">Color del encabezado</Label>
          <div className="flex items-center gap-2">
            <input id="marca-color" type="color" className="h-9 w-12 cursor-pointer rounded border border-input bg-background" value={form.colorPrimario || "#0B7DBB"} onChange={(e) => set("colorPrimario", e.target.value)} />
            <Input value={form.colorPrimario} placeholder="#0B7DBB" maxLength={7} aria-label="Color en hexadecimal" onChange={(e) => set("colorPrimario", e.target.value)} />
          </div>
        </div>
        <div className="rounded-lg p-3 text-sm text-white" style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(form.colorPrimario) ? form.colorPrimario : "#0B7DBB" }}>
          <p className="font-semibold">{form.razonSocial || data.nombreEmpresa}</p>
          <p className="text-xs opacity-90">{[form.nit && `NIT ${form.nit}`, form.ciudad].filter(Boolean).join(" · ") || "NIT · Ciudad"}</p>
        </div>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------- guía

function Guia({ grupos }: { grupos: GrupoMarcadores[] }) {
  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Copiado", { description: texto });
    } catch {
      toast.error("No se pudo copiar; selecciónalo y cópialo a mano.");
    }
  }
  return (
    <div className="space-y-6">
      <Card className="space-y-2 p-5 text-sm">
        <h2 className="font-semibold">Reglas rápidas</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Escribe cada marcador con llaves dobles y tal cual aparece aquí (distingue mayúsculas): <code className="text-foreground">{"{{proveedor.nit}}"}</code>.</li>
          <li>
            Para una tabla de ítems, pon <code className="text-foreground">{"{{#lineas}}"}</code> en la primera celda de la fila y <code className="text-foreground">{"{{/lineas}}"}</code> en la última: la fila se repite por cada ítem. Igual con hitos y modificaciones.
          </li>
          <li>
            Para un texto que solo aparece si hay dato: <code className="text-foreground">{"{{#contrato.contratoMarco}}"}Se emite bajo el marco {"{{contrato.contratoMarco}}"}.{"{{/contrato.contratoMarco}}"}</code>
          </li>
          <li>Da al marcador el formato que quieras (negrita, tamaño, color) en Word: el valor lo conserva.</li>
        </ul>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {grupos.map((g) => (
          <Card key={g.titulo} className="p-5">
            <h2 className="font-semibold">{g.titulo}</h2>
            {g.bucle && (
              <p className="mb-2 text-xs text-muted-foreground">
                Dentro de <code>{`{{#${g.bucle}}}`}</code> … <code>{`{{/${g.bucle}}}`}</code>
              </p>
            )}
            <ul className="mt-2 divide-y divide-border text-sm">
              {g.marcadores.map((m) => {
                const tag = `{{${m.clave}}}`;
                return (
                  <li key={m.clave} className="flex items-center gap-2 py-1.5">
                    <button type="button" className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-xs hover:bg-primary/10")} onClick={() => copiar(tag)} aria-label={`Copiar ${tag}`}>
                      {tag}
                    </button>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground" title={`${m.descripcion} — ej.: ${m.ejemplo}`}>{m.descripcion}</span>
                    <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
