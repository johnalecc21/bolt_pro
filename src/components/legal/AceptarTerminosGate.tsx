import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Loader2, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiErrorMessage } from "@/lib/api/http";

/** Blocking, one-time acceptance gate — shown until the user accepts the Términos
 * y Condiciones / Aviso de Privacidad. Mount inside a portal layout; renders
 * nothing once `currentUser.terminosAceptadosEn` is set. */
export function AceptarTerminosGate() {
  const { currentUser, acceptTerms } = useAuth();
  const [aceptando, setAceptando] = useState(false);

  if (!currentUser || currentUser.terminosAceptadosEn) return null;

  async function handleAceptar() {
    setAceptando(true);
    try {
      await acceptTerms();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo registrar tu aceptación. Intenta de nuevo."));
      setAceptando(false);
    }
  }

  return (
    <AlertDialog open>
      <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <AlertDialogTitle>Antes de continuar</AlertDialogTitle>
          <AlertDialogDescription>
            Para usar Procurex necesitamos que aceptes nuestros{" "}
            <a href="/terminos" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              Términos y Condiciones
            </a>{" "}
            y nuestro{" "}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              Aviso de Privacidad
            </a>
            , que explican cómo tratamos los datos de tu empresa y el proceso de homologación.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleAceptar} disabled={aceptando} className="gap-2">
            {aceptando && <Loader2 className="h-4 w-4 animate-spin" />}
            Acepto y continúo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
