import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import {
  CATEGORIAS_DOCUMENTO,
  fetchRequisitosHomologacion,
  guardarRequisitosHomologacion,
  type CategoriaDocumento,
} from "@/lib/api/homologacion";

/** Admin Cliente picks which validated document categories a proveedor needs before it can be invited. */
export function RequisitosHomologacionCard() {
  const { data, reload } = useApiData(fetchRequisitosHomologacion);
  const [seleccion, setSeleccion] = useState<CategoriaDocumento[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setSeleccion(data);
  }, [data]);

  function toggle(categoria: CategoriaDocumento, checked: boolean) {
    setSeleccion((prev) => (checked ? [...prev, categoria] : prev.filter((c) => c !== categoria)));
  }

  async function guardar() {
    setSaving(true);
    try {
      await guardarRequisitosHomologacion(seleccion);
      toast.success("Requisitos de homologación actualizados", {
        description: seleccion.length
          ? "Solo podrás invitar proveedores con estos documentos validados y vigentes."
          : "Basta con que el proveedor tenga la homologación aprobada.",
      });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudieron guardar los requisitos."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        <ShieldCheck className="h-4 w-4" /> Requisitos de homologación para invitar
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Además de la homologación aprobada, exige que el proveedor tenga validados y vigentes los documentos de estas
        categorías. Los que no cumplan quedan fuera de la invitación con el motivo. Sin selección, basta con la homologación aprobada.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {CATEGORIAS_DOCUMENTO.map((c) => (
          <label key={c.value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm">
            <Checkbox
              checked={seleccion.includes(c.value)}
              onCheckedChange={(v) => toggle(c.value, v === true)}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium">{c.label}</span>
              <span className="text-muted-foreground">{c.descripcion}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar requisitos"}
        </Button>
      </div>
    </Card>
  );
}
