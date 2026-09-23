import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2, Plus, X, Share2, Copy, ExternalLink } from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiPerfil, actualizarMiPerfil, urlVitrina } from "@/lib/api/proveedores";
import { apiErrorMessage } from "@/lib/api/http";

function sameArray(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function PerfilEmpresa() {
  const { data: perfil, loading, reload } = useApiData(fetchMiPerfil);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [sitioWeb, setSitioWeb] = useState("");
  const [certificaciones, setCertificaciones] = useState<string[]>([]);
  const [nuevaCert, setNuevaCert] = useState("");
  const [guardando, setGuardando] = useState(false);
  const cargadoRef = useRef(false);

  useEffect(() => {
    if (perfil && !cargadoRef.current) {
      setNombre(perfil.nombre);
      setCategoria(perfil.categorias[0] ?? "");
      setUbicacion(perfil.ubicacion);
      setSitioWeb(perfil.sitioWeb ?? "");
      setCertificaciones(perfil.certificaciones);
      cargadoRef.current = true;
    }
  }, [perfil]);

  const sinCambios =
    !perfil ||
    (nombre === perfil.nombre &&
      categoria === (perfil.categorias[0] ?? "") &&
      ubicacion === perfil.ubicacion &&
      sitioWeb === (perfil.sitioWeb ?? "") &&
      sameArray(certificaciones, perfil.certificaciones));

  function agregarCert() {
    const cert = nuevaCert.trim();
    if (!cert) return;
    if (certificaciones.some((c) => c.toLowerCase() === cert.toLowerCase())) {
      toast.info("Esa certificación ya está en la lista.");
      setNuevaCert("");
      return;
    }
    setCertificaciones((prev) => [...prev, cert]);
    setNuevaCert("");
  }

  function quitarCert(cert: string) {
    setCertificaciones((prev) => prev.filter((c) => c !== cert));
  }

  async function guardar() {
    if (!nombre.trim()) {
      toast.error("La razón social no puede quedar vacía.");
      return;
    }
    setGuardando(true);
    try {
      await actualizarMiPerfil({
        nombre: nombre.trim(),
        categorias: categoria.trim() ? [categoria.trim()] : [],
        ubicacion: ubicacion.trim(),
        sitioWeb: sitioWeb.trim(),
        certificaciones,
      });
      toast.success("Perfil actualizado");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo actualizar el perfil."));
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil de Empresa</h1>
        <p className="text-sm text-muted-foreground">Mantén actualizada la información que ven los clientes en el directorio</p>
      </div>

      {perfil && (
        <Card className="p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><Share2 className="h-4 w-4" /> Tu vitrina pública</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Un perfil verificado que puedes compartir con prospectos: score, desempeño y documentos validados, sin datos sensibles.
            Solo es visible mientras tu homologación esté aprobada.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-muted px-2 py-1 text-xs">{urlVitrina(perfil.id)}</code>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={async () => {
                await navigator.clipboard.writeText(urlVitrina(perfil.id));
                toast.success("Enlace copiado");
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5" asChild>
              <a href={urlVitrina(perfil.id)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Abrir</a>
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Datos generales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="perfil-nombre">Razón social</Label>
            <Input id="perfil-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="perfil-categoria">Categoría principal</Label>
            <Input id="perfil-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Tecnología, Logística..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="perfil-ubicacion">Ubicación</Label>
            <Input id="perfil-ubicacion" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Bogotá, Colombia" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="perfil-web">Sitio web</Label>
            <Input id="perfil-web" value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} placeholder="tuempresa.com" />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Certificaciones</h2>
        <p className="mb-4 text-sm text-muted-foreground">Las que muestres aquí aparecen en tu tarjeta del directorio de proveedores.</p>
        {certificaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin certificaciones registradas todavía.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {certificaciones.map((c) => (
              <Badge key={c} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1">
                {c}
                <button
                  type="button"
                  onClick={() => quitarCert(c)}
                  aria-label={`Quitar ${c}`}
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Input
            value={nuevaCert}
            onChange={(e) => setNuevaCert(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarCert(); } }}
            placeholder="ISO 9001, BASC, ISO 14001..."
          />
          <Button type="button" variant="outline" onClick={agregarCert} disabled={!nuevaCert.trim()} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button className="gap-2" onClick={guardar} disabled={guardando || sinCambios}>
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
        {!sinCambios && !guardando && <span className="text-sm text-muted-foreground">Tienes cambios sin guardar.</span>}
      </div>
    </div>
  );
}
