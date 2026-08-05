import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { UserPlus, Pencil, ShieldAlert } from "lucide-react";
import { useMockLoading } from "@/hooks/useMockLoading";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { logAudit } from "@/lib/mock/auditLog";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleLabels, type Role } from "@/lib/mock/users";

interface UsuarioRow {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  activo: boolean;
  ultimoAcceso: string;
}

const usuariosIniciales: UsuarioRow[] = [
  { id: "U-001", nombre: "Carlos Méndez", email: "carlos@acme.com", rol: "comprador", activo: true, ultimoAcceso: "Hace 15 min" },
  { id: "U-002", nombre: "Laura Torres", email: "laura@acme.com", rol: "comprador", activo: true, ultimoAcceso: "Hace 2 h" },
  { id: "U-003", nombre: "Ana Ruiz", email: "ana.cfo@acme.com", rol: "aprobador_cfo", activo: true, ultimoAcceso: "Ayer" },
  { id: "U-004", nombre: "Roberto Silva", email: "admin@acme.com", rol: "admin_cliente", activo: true, ultimoAcceso: "Hace 5 min" },
  { id: "U-008", nombre: "Sofía Nieto", email: "sofia@acme.com", rol: "comprador", activo: false, ultimoAcceso: "Hace 3 meses" },
];

const rolesEditables: Role[] = ["comprador", "aprobador_cfo", "admin_cliente"];

export function GestionUsuarios() {
  const { currentUser } = useAuth();
  const loading = useMockLoading();
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<UsuarioRow | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("comprador");

  const adminsActivos = usuarios.filter((u) => u.rol === "admin_cliente" && u.activo).length;

  function invitar() {
    if (!inviteEmail.trim()) return;
    const id = `U-${Math.floor(Math.random() * 900 + 100)}`;
    setUsuarios((prev) => [...prev, { id, nombre: inviteEmail.split("@")[0], email: inviteEmail.trim(), rol: inviteRole, activo: true, ultimoAcceso: "Nunca" }]);
    logAudit({ usuario: currentUser?.nombre ?? "—", accion: "Usuario invitado", detalle: `${inviteEmail} → ${roleLabels[inviteRole]}` });
    toast.success("Invitación enviada", { description: inviteEmail });
    setInviteOpen(false);
    setInviteEmail("");
  }

  function cambiarRol(nuevoRol: Role) {
    if (!editUser) return;
    if (editUser.rol === "admin_cliente" && nuevoRol !== "admin_cliente" && adminsActivos <= 1) {
      toast.error("No puedes quitar el rol Admin al último administrador activo");
      return;
    }
    setUsuarios((prev) => prev.map((u) => u.id === editUser.id ? { ...u, rol: nuevoRol } : u));
    logAudit({ usuario: currentUser?.nombre ?? "—", accion: "Cambio de rol", detalle: `${editUser.nombre}: ${roleLabels[editUser.rol]} → ${roleLabels[nuevoRol]}` });
    toast.success("Rol actualizado");
    setEditUser(null);
  }

  function desactivar(u: UsuarioRow) {
    if (u.rol === "admin_cliente" && adminsActivos <= 1) {
      toast.error("No puedes desactivar al último administrador activo");
      return;
    }
    setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, activo: !x.activo } : x));
    logAudit({ usuario: currentUser?.nombre ?? "—", accion: u.activo ? "Usuario desactivado" : "Usuario reactivado", detalle: u.email });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios y Roles</h1>
          <p className="text-sm text-muted-foreground">Administra quién tiene acceso y con qué permisos</p>
        </div>
        <Button className="gradient-brand text-white" onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Invitar usuario
        </Button>
      </div>

      {loading ? <TableSkeleton /> :
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Rol</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">Último acceso</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-sm font-medium">{u.nombre}</td>
                  <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                  <td className="p-4"><Badge variant="secondary">{roleLabels[u.rol]}</Badge></td>
                  <td className="p-4">
                    <span className={u.activo ? "text-xs font-medium text-success" : "text-xs font-medium text-muted-foreground"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{u.ultimoAcceso}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditUser(u)}><Pencil className="h-4 w-4" /></Button>
                      <ConfirmDialog
                        trigger={<Button variant="ghost" size="icon" className="text-destructive"><ShieldAlert className="h-4 w-4" /></Button>}
                        title={u.activo ? "Desactivar usuario" : "Reactivar usuario"}
                        description={`¿Confirmas que quieres ${u.activo ? "desactivar" : "reactivar"} a ${u.nombre}?`}
                        confirmLabel={u.activo ? "Desactivar" : "Reactivar"}
                        destructive={u.activo}
                        onConfirm={() => desactivar(u)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar usuario</DialogTitle>
            <DialogDescription>Se enviará una invitación por correo con acceso al portal cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="nombre@acme.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>
                {rolesEditables.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={invitar} disabled={!inviteEmail.trim()}>Enviar invitación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar rol</DialogTitle>
            <DialogDescription>{editUser?.nombre} — este cambio queda en el log de auditoría.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {rolesEditables.map((r) => (
              <button
                key={r}
                onClick={() => cambiarRol(r)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left text-sm hover:border-primary hover:bg-primary/5"
              >
                {roleLabels[r]}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
