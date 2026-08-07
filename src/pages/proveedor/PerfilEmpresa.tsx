import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Plus, UserPlus, Trash2 } from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiPerfil } from "@/lib/api/proveedores";
import { useAuth } from "@/lib/auth/AuthContext";

interface UsuarioEmpresa { nombre: string; email: string; rol: string; }

export function PerfilEmpresa() {
  const { currentUser } = useAuth();
  const { data: perfil } = useApiData(fetchMiPerfil);
  const [certificacionesLocal, setCertificacionesLocal] = useState<string[] | null>(null);
  const certificaciones = certificacionesLocal ?? perfil?.certificaciones ?? [];
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([
    { nombre: currentUser?.nombre ?? "", email: currentUser?.email ?? "", rol: "Administrador" },
  ]);
  const [nuevoEmail, setNuevoEmail] = useState("");

  function agregarUsuario() {
    if (!nuevoEmail.trim()) return;
    setUsuarios((prev) => [...prev, { nombre: nuevoEmail.split("@")[0], email: nuevoEmail.trim(), rol: "Colaborador" }]);
    toast.success("Usuario agregado al portal");
    setNuevoEmail("");
  }

  function quitarCertificacion(nombre: string) {
    setCertificacionesLocal(certificaciones.filter((c) => c !== nombre));
  }

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil de Empresa</h1>
        <p className="text-sm text-muted-foreground">Mantén actualizada la información de tu empresa</p>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Datos generales</h2>
        <div className="grid gap-4 sm:grid-cols-2" key={perfil?.id ?? "loading"}>
          <div className="space-y-1.5"><Label>Razón social</Label><Input defaultValue={perfil?.nombre ?? ""} /></div>
          <div className="space-y-1.5"><Label>Categoría principal</Label><Input defaultValue={perfil?.categorias[0] ?? ""} /></div>
          <div className="space-y-1.5"><Label>Ubicación</Label><Input defaultValue={perfil?.ubicacion ?? ""} /></div>
          <div className="space-y-1.5"><Label>Sitio web</Label><Input placeholder="tuempresa.com" /></div>
        </div>
        <Button className="mt-4" onClick={() => toast.success("Perfil actualizado")}>Guardar cambios</Button>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Certificaciones</h2>
        <div className="space-y-2">
          {certificaciones.length === 0 && <p className="text-sm text-muted-foreground">Sin certificaciones registradas todavía.</p>}
          {certificaciones.map((c) => (
            <div key={c} className="flex items-center justify-between rounded-lg border border-border p-3">
              <Badge variant="secondary">{c}</Badge>
              <Button variant="ghost" size="icon" onClick={() => quitarCertificacion(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => toast.info("Sube el archivo de la nueva certificación desde Homologación")}>
          <Plus className="h-4 w-4" /> Agregar certificación
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Usuarios con acceso al portal</h2>
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.email} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{u.nombre}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Badge variant="secondary">{u.rol}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input placeholder="nuevo.usuario@cloudsphere.com" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} />
          <Button onClick={agregarUsuario} disabled={!nuevoEmail.trim()} className="gap-2 shrink-0"><UserPlus className="h-4 w-4" /> Invitar</Button>
        </div>
      </Card>
    </div>
  );
}
