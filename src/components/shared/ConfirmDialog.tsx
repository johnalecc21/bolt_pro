import { useState, type ReactNode } from "react";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void | Promise<void>;
}

export function ConfirmDialog({
  trigger, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar",
  destructive, requireReason, reasonLabel = "Motivo (obligatorio)", onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setReason("");
      setError(false);
    }
  }

  async function handleConfirm() {
    if (requireReason && !reason.trim()) {
      setError(true);
      return;
    }
    setLoading(true);
    try {
      await onConfirm(requireReason ? reason.trim() : undefined);
      handleOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {requireReason && (
          <div className="space-y-1.5 text-left">
            <Label htmlFor="confirm-dialog-reason">{reasonLabel}</Label>
            <Textarea
              id="confirm-dialog-reason"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(false); }}
              placeholder="Explica el motivo de esta decisión..."
              rows={3}
            />
            {error && <p className="text-xs text-destructive">Este campo es obligatorio.</p>}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <Button variant={destructive ? "destructive" : "default"} onClick={handleConfirm} disabled={loading}>
            {loading ? "Procesando..." : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
