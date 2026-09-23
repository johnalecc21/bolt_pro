import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiErrorMessage } from "@/lib/api/http";
import {
  actualizarItemCatalogo,
  crearItemCatalogo,
  subirImagenItem,
  type ItemCatalogo,
  type ItemCatalogoInput,
} from "@/lib/api/vitrina";
import { MONEDAS, type Moneda } from "@/lib/moneda";
import { useMonedaBase } from "@/hooks/useMonedaBase";

/** Create or edit one product/service of the proveedor's catalog. `item` null = new. */
export function ItemCatalogoDialog({
  open,
  item,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: ItemCatalogo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const monedaBase = useMonedaBase();
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidad, setUnidad] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState<Moneda>(monedaBase);
  // undefined = keep the current photo; "" = remove it; a path = new upload.
  const [imagenPath, setImagenPath] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setNombre(item?.nombre ?? "");
    setCategoria(item?.categoria ?? "");
    setUnidad(item?.unidad ?? "");
    setDescripcion(item?.descripcion ?? "");
    setPrecio(item?.precioReferencia != null ? String(item.precioReferencia) : "");
    setMoneda(item?.moneda ?? monedaBase);
    setImagenPath(undefined);
    setPreview(item?.imagenUrl ?? null);
  }, [open, item, monedaBase]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    try {
      const path = await subirImagenItem(file);
      setImagenPath(path);
      setPreview(URL.createObjectURL(file));
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo subir la imagen."));
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    const payload: ItemCatalogoInput = {
      nombre: nombre.trim(),
      categoria: categoria.trim() || undefined,
      unidad: unidad.trim() || undefined,
      descripcion: descripcion.trim() || undefined,
      ...(precio.trim() ? { precioReferencia: Number(precio), moneda } : {}),
      ...(imagenPath !== undefined ? { imagenPath } : {}),
    };
    setGuardando(true);
    try {
      if (item) await actualizarItemCatalogo(item.id, payload);
      else await crearItemCatalogo(payload);
      toast.success(item ? "Producto actualizado" : "Producto agregado al catálogo");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar."));
    } finally {
      setGuardando(false);
    }
  }

  const precioInvalido = precio.trim() !== "" && (!Number.isInteger(Number(precio)) || Number(precio) < 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar producto o servicio" : "Nuevo producto o servicio"}</DialogTitle>
          <DialogDescription>Aparece en tu vitrina y hace que los compradores te encuentren al buscarlo en el directorio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
              {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onFile} />
              <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={subiendo}>
                {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : preview ? "Cambiar foto" : "Subir foto"}
              </Button>
              {preview && (
                <Button type="button" size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => { setImagenPath(""); setPreview(null); }}>
                  <X className="h-3.5 w-3.5" /> Quitar
                </Button>
              )}
              <p className="text-xs text-muted-foreground">JPG, PNG o WebP · máx. 10 MB</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-nombre">Nombre</Label>
            <Input id="item-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Mantenimiento preventivo de subestaciones" maxLength={120} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-categoria">Categoría</Label>
              <Input id="item-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Servicios eléctricos" maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-unidad">Unidad</Label>
              <Input id="item-unidad" value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder="servicio / mes, unidad, m²" maxLength={40} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-descripcion">Descripción</Label>
            <Textarea id="item-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Alcance, especificaciones, tiempos de entrega…" maxLength={1000} rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-precio">Precio de referencia (opcional)</Label>
            <div className="flex gap-2">
              <Input id="item-precio" type="number" min={0} step={1} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Déjalo vacío para mostrar «a convenir»" aria-invalid={precioInvalido} />
              <div className="w-28 shrink-0">
                <NativeSelect aria-label="Moneda" className="w-full" value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)}>
                  {MONEDAS.map((m) => <NativeSelectOption key={m.value} value={m.value}>{m.value}</NativeSelectOption>)}
                </NativeSelect>
              </div>
            </div>
            {precioInvalido && <p className="text-xs text-destructive">Usa un número entero, sin puntos ni decimales.</p>}
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={guardar} disabled={nombre.trim().length < 2 || precioInvalido || subiendo || guardando}>
              {guardando ? "Guardando..." : item ? "Guardar cambios" : "Agregar al catálogo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
