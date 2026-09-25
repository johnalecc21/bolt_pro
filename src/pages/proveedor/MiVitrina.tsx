import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Copy, Eye, ExternalLink, FileText, ImagePlus, Loader2, Package, Pencil, Plus, Store, Trash2, Upload, Video,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { ItemCatalogoDialog } from "@/components/proveedor/ItemCatalogoDialog";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import {
  actualizarVitrina,
  eliminarArchivoVitrina,
  eliminarItemCatalogo,
  fetchMiVitrina,
  subirArchivoVitrina,
  urlVitrina,
  type ItemCatalogo,
  type TipoArchivoVitrina,
} from "@/lib/api/vitrina";
import { formatMoney } from "@/lib/moneda";
import { videoEmbedUrl } from "@/lib/video";
import { useIncrustado } from "@/components/layout/Incrustado";

const LIMITE_IMAGENES = 20;
const LIMITE_DOCUMENTOS = 5;
const LIMITE_ITEMS = 60;

function tituloDesdeArchivo(nombre: string) {
  return nombre.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 120) || "Archivo";
}

/** The proveedor edits what its public vitrina shows: pitch, contact, video, gallery, PDFs and catalog. */
export function MiVitrina() {
  const incrustado = useIncrustado();
  const { data: vitrina, loading, reload } = useApiData(fetchMiVitrina);
  const [descripcion, setDescripcion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [video, setVideo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagenes, setSubiendoImagenes] = useState(0);
  const [tipoDocumento, setTipoDocumento] = useState<Exclude<TipoArchivoVitrina, "IMAGEN">>("BROCHURE");
  const [subiendoDocumento, setSubiendoDocumento] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemCatalogo | null>(null);
  const [dialogItemAbierto, setDialogItemAbierto] = useState(false);
  const imagenesRef = useRef<HTMLInputElement>(null);
  const documentoRef = useRef<HTMLInputElement>(null);
  const cargadoRef = useRef(false);

  useEffect(() => {
    if (!vitrina || cargadoRef.current) return;
    setDescripcion(vitrina.descripcion ?? "");
    setTelefono(vitrina.telefonoContacto ?? "");
    setEmail(vitrina.emailContacto ?? "");
    setVideo(vitrina.videoUrl ?? "");
    cargadoRef.current = true;
  }, [vitrina]);

  async function guardarPresentacion() {
    setGuardando(true);
    try {
      await actualizarVitrina({ descripcion, telefonoContacto: telefono, emailContacto: email, videoUrl: video });
      toast.success("Presentación actualizada");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar."));
    } finally {
      setGuardando(false);
    }
  }

  async function onImagenes(e: React.ChangeEvent<HTMLInputElement>) {
    const disponibles = LIMITE_IMAGENES - (vitrina?.galeria.length ?? 0);
    const files = Array.from(e.target.files ?? []).slice(0, Math.max(0, disponibles));
    e.target.value = "";
    if (files.length === 0) return;
    setSubiendoImagenes(files.length);
    let ok = 0;
    for (const file of files) {
      try {
        await subirArchivoVitrina(file, "IMAGEN", tituloDesdeArchivo(file.name));
        ok += 1;
      } catch (err) {
        toast.error(apiErrorMessage(err, `No se pudo subir ${file.name}.`));
      } finally {
        setSubiendoImagenes((n) => n - 1);
      }
    }
    if (ok > 0) toast.success(ok === 1 ? "Imagen agregada" : `${ok} imágenes agregadas`);
    reload();
  }

  async function onDocumento(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendoDocumento(true);
    try {
      await subirArchivoVitrina(file, tipoDocumento, tituloDesdeArchivo(file.name));
      toast.success(tipoDocumento === "BROCHURE" ? "Brochure agregado" : "Catálogo agregado");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo subir el PDF."));
    } finally {
      setSubiendoDocumento(false);
    }
  }

  async function eliminarArchivo(id: string) {
    try {
      await eliminarArchivoVitrina(id);
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function eliminarItem(id: string) {
    try {
      await eliminarItemCatalogo(id);
      toast.success("Eliminado del catálogo");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function abrirItem(item: ItemCatalogo | null) {
    setItemEditando(item);
    setDialogItemAbierto(true);
  }

  async function copiarEnlace() {
    if (!vitrina) return;
    await navigator.clipboard.writeText(urlVitrina(vitrina.id));
    toast.success("Enlace copiado");
  }

  if (loading && !vitrina) return <div className="p-6"><CardGridSkeleton count={3} /></div>;
  if (!vitrina) return null;

  const embed = videoEmbedUrl(video);
  const documentosPorTipo = (tipo: string) => vitrina.documentos.filter((d) => d.tipo === tipo).length;

  return (
    <div className={incrustado ? "max-w-4xl space-y-6" : "max-w-4xl space-y-6 p-6"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {!incrustado && (
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold"><Store className="h-6 w-6" /> Mi vitrina</h1>
            <p className="text-sm text-muted-foreground">Lo que ven los compradores de tu empresa: presentación, fotos, brochures y catálogo.</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-sm" title="Visitas a tu vitrina pública">
            <Eye className="h-4 w-4 text-muted-foreground" /> {vitrina.vitrinaVistas.toLocaleString("es-CO")} visitas
          </span>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={copiarEnlace}><Copy className="h-3.5 w-3.5" /> Copiar enlace</Button>
          <Button size="sm" className="gap-1.5" asChild>
            <a href={urlVitrina(vitrina.id)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Ver como comprador</a>
          </Button>
        </div>
      </div>

      {!vitrina.publicada && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning-foreground">
          Tu vitrina se publica cuando tu homologación esté aprobada. Puedes ir preparándola desde ya.
        </div>
      )}

      {/* Presentación y contacto */}
      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Presentación y contacto</h2>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="vitrina-descripcion">¿Qué hace tu empresa?</Label>
            <span className="text-xs text-muted-foreground">{descripcion.length}/3000</span>
          </div>
          <Textarea
            id="vitrina-descripcion"
            rows={6}
            maxLength={3000}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Servicios principales, sectores que atiendes, cobertura, clientes destacados, diferenciales…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="vitrina-email">Correo comercial</Label>
            <Input id="vitrina-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ventas@tuempresa.com" maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vitrina-telefono">Teléfono / WhatsApp</Label>
            <Input id="vitrina-telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+57 300 000 0000" maxLength={40} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vitrina-video" className="flex items-center gap-1.5"><Video className="h-4 w-4" /> Video institucional (YouTube o Vimeo)</Label>
          <Input id="vitrina-video" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" maxLength={300} />
          {video.trim() && !embed && <p className="text-xs text-muted-foreground">Se mostrará como enlace (solo YouTube y Vimeo se ven incrustados).</p>}
          {embed && (
            <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg border border-border">
              <iframe src={embed} title="Vista previa del video" className="h-full w-full" allowFullScreen />
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={guardarPresentacion} disabled={guardando}>{guardando ? "Guardando..." : "Guardar presentación"}</Button>
        </div>
      </Card>

      {/* Galería */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Galería de imágenes</h2>
            <p className="text-xs text-muted-foreground">Instalaciones, equipos, proyectos entregados. JPG, PNG o WebP · {vitrina.galeria.length}/{LIMITE_IMAGENES}</p>
          </div>
          <input ref={imagenesRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={onImagenes} />
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => imagenesRef.current?.click()} disabled={subiendoImagenes > 0 || vitrina.galeria.length >= LIMITE_IMAGENES}>
            {subiendoImagenes > 0 ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo {subiendoImagenes}…</> : <><ImagePlus className="h-4 w-4" /> Agregar imágenes</>}
          </Button>
        </div>
        {vitrina.galeria.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aún no tienes imágenes. Las vitrinas con fotos reciben más atención.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {vitrina.galeria.map((img) => (
              <figure key={img.id} className="group relative overflow-hidden rounded-lg border border-border bg-muted/40">
                {img.url ? <img src={img.url} alt={img.titulo} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] w-full" />}
                <figcaption className="truncate px-2 py-1 text-xs">{img.titulo}</figcaption>
                <ConfirmDialog
                  trigger={
                    <button className="absolute right-1.5 top-1.5 rounded-md bg-background/90 p-1.5 text-destructive shadow-sm" aria-label={`Eliminar ${img.titulo}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  }
                  title="Eliminar imagen"
                  description={`"${img.titulo}" dejará de verse en tu vitrina.`}
                  confirmLabel="Eliminar"
                  destructive
                  onConfirm={() => eliminarArchivo(img.id)}
                />
              </figure>
            ))}
          </div>
        )}
      </Card>

      {/* Brochures y catálogos */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Brochures y catálogos (PDF)</h2>
            <p className="text-xs text-muted-foreground">Los compradores pueden descargarlos desde tu vitrina · hasta {LIMITE_DOCUMENTOS} de cada tipo, 10 MB c/u</p>
          </div>
          <div className="flex items-center gap-2">
            <NativeSelect size="sm" aria-label="Tipo de documento" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as "BROCHURE" | "CATALOGO")}>
              <NativeSelectOption value="BROCHURE">Brochure</NativeSelectOption>
              <NativeSelectOption value="CATALOGO">Catálogo</NativeSelectOption>
            </NativeSelect>
            <input ref={documentoRef} type="file" accept=".pdf" className="hidden" onChange={onDocumento} />
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => documentoRef.current?.click()} disabled={subiendoDocumento || documentosPorTipo(tipoDocumento) >= LIMITE_DOCUMENTOS}>
              {subiendoDocumento ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir PDF
            </Button>
          </div>
        </div>
        {vitrina.documentos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Sube tu brochure de servicios o tu catálogo de productos.</p>
        ) : (
          <div className="space-y-2">
            {vitrina.documentos.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{d.titulo}</span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">{d.tipo === "BROCHURE" ? "Brochure" : "Catálogo"}</Badge>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {d.url && <Button size="sm" variant="ghost" asChild><a href={d.url} target="_blank" rel="noopener noreferrer">Ver</a></Button>}
                  <ConfirmDialog
                    trigger={<Button size="sm" variant="ghost" className="text-destructive" aria-label={`Eliminar ${d.titulo}`}><Trash2 className="h-4 w-4" /></Button>}
                    title="Eliminar PDF"
                    description={`"${d.titulo}" dejará de estar disponible en tu vitrina.`}
                    confirmLabel="Eliminar"
                    destructive
                    onConfirm={() => eliminarArchivo(d.id)}
                  />
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Catálogo */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Catálogo de productos y servicios</h2>
            <p className="text-xs text-muted-foreground">Los compradores te encuentran en el directorio buscando estos nombres · {vitrina.catalogo.length}/{LIMITE_ITEMS}</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => abrirItem(null)} disabled={vitrina.catalogo.length >= LIMITE_ITEMS}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        {vitrina.catalogo.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Agrega lo que vendes: productos, servicios o paquetes, con foto y precio de referencia.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {vitrina.catalogo.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-lg border border-border p-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">
                  {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.nombre}</p>
                  {item.categoria && <p className="text-xs text-muted-foreground">{item.categoria}</p>}
                  <p className="mt-1 text-sm font-semibold">
                    {item.precioReferencia != null && item.moneda ? formatMoney(item.precioReferencia, item.moneda) : "A convenir"}
                    {item.unidad && <span className="font-normal text-muted-foreground"> / {item.unidad}</span>}
                  </p>
                  <div className="mt-1 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => abrirItem(item)}><Pencil className="h-3 w-3" /> Editar</Button>
                    <ConfirmDialog
                      trigger={<Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-destructive"><Trash2 className="h-3 w-3" /> Eliminar</Button>}
                      title="Eliminar del catálogo"
                      description={`"${item.nombre}" dejará de aparecer en tu vitrina y en las búsquedas.`}
                      confirmLabel="Eliminar"
                      destructive
                      onConfirm={() => eliminarItem(item.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ItemCatalogoDialog open={dialogItemAbierto} item={itemEditando} onClose={() => setDialogItemAbierto(false)} onSaved={reload} />
    </div>
  );
}
