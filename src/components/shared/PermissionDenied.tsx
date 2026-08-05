import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleLabels } from "@/lib/mock/users";

export function PermissionDenied() {
  const { currentUser } = useAuth();
  const portal = currentUser?.portal ?? "cliente";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">No tienes permisos para ver esta página</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {currentUser
            ? `Tu rol actual (${roleLabels[currentUser.role]}) no tiene acceso a esta sección.`
            : "Necesitas iniciar sesión para continuar."}
        </p>
      </div>
      <Button asChild size="sm">
        <Link to={`/${portal}/dashboard`}>Volver al dashboard</Link>
      </Button>
    </div>
  );
}
