import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Plus, UserPlus, Trash2 } from "lucide-react";

interface Certificacion { nombre: string; vigencia: string; vencida: boolean; }
interface UsuarioEmpresa { nombre: string; email: string; rol: string; }

export function PerfilEmpresa() {
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([
    { nombre: "ISO 27001", vigencia: "2027-03-01", vencida: false },
    { nombre: "ISO 9001", vigencia: "2024-11-15", vencida: true },
    { nombre: "ESG", vigencia: "2027-06-20", vencida: false },
  ]);
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([
    { nombre: "Diego Ramírez", email: "contacto@cloudsphere.com", rol: "Administrador" },
  ]);
  const [nuevoEmail, setNuevoEmail] = useState("");

  function agregarUsuario() {
    if (!nuevoEmail.trim()) return;
    setUsuarios((prev) => [...prev, { nombre: nuevoEmail.split("@")[0], email: nuevoEmail.trim(), rol: "Colaborador" }]);
    toast.success("Usuario agregado al portal");
    setNuevoEmail("");
  }

  function quitarCertificacion(nombre: string) {
    setCertificaciones((prev) => prev.filter((c) => c.nombre !== nombre));
  }

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil de Empresa</h1>
        <p className="text-sm text-muted-foreground">Mantén actualizada la información de tu empresa</p>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Datos generales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Razón social</Label><Input defaultValue="CloudSphere Technologies" /></div>
          <div className="space-y-1.5"><Label>Categoría principal</Label><Input defaultValue="TI / Cloud" /></div>
          <div className="space-y-1.5"><Label>Ubicación</Label><Input defaultValue="Bogotá, CO" /></div>
          <div className="space-y-1.5"><Label>Sitio web</Label><Input defaultValue="cloudsphere.com" /></div>
        </div>
        <Button className="mt-4" onClick={() => toast.success("Perfil actualizado")}>Guardar cambios</Button>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Certificaciones</h2>
        <div className="space-y-2">
          {certificaciones.map((c) => (
            <div key={c.nombre} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{c.nombre}</Badge>
                <span className={c.vencida ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>Vigente hasta {c.vigencia}{c.vencida && " (vencida)"}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => quitarCertificacion(c.nombre)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
