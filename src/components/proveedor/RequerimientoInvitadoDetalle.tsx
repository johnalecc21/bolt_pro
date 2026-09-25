import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, FileText, ListChecks, Paperclip, Scale } from "lucide-react";
import { apiErrorMessage } from "@/lib/api/http";
import { fechaLocal } from "@/lib/fecha";
import { urlDocumentoInvitado, type RequerimientoInvitado } from "@/lib/api/invitaciones";

const CRITERIOS: Record<string, string> = {
  precio: "Precio",
  tiempo: "Tiempo de entrega",
  calidad: "Calidad / Referencias",
  pago: "Condiciones de pago",
};

const cantidad = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 3 });

/**
 * What the buyer is asking for, as the invited supplier sees it: scope,
 * quantities, specifications, how offers are scored and the attachments.
 * Used in the invitation preview and on the quoting page.
 */
export function RequerimientoInvitadoDetalle({ r }: { r: RequerimientoInvitado }) {
  async function descargar(docId: string) {
    try {
      window.open(await urlDocumentoInvitado(r.id, docId), "_blank", "noopener");
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo descargar el documento."));
    }
  }
  const criterios = Object.entries(r.criterios ?? {}).filter(([, v]) => Number(v) > 0);

  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{r.codigo}</Badge>
        <Badge variant="secondary">{r.categoria}</Badge>
        {r.prioridad !== "NORMAL" && (
          <Badge variant="secondary" className="bg-warning/15 text-warning-foreground">Prioridad {r.prioridad.toLowerCase()}</Badge>
        )}
        <span className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Recibe ofertas hasta el <strong className="text-foreground">{fechaLocal(r.fechaLimite)}</strong>
        </span>
        <span className="text-muted-foreground">· Moneda {r.moneda}</span>
      </div>

      <section className="space-y-1.5">
        <h3 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-primary" aria-hidden="true" /> Descripción</h3>
        <p className="whitespace-pre-line text-muted-foreground">{r.descripcion?.trim() || "El comprador no agregó una descripción; revisa los ítems y los documentos adjuntos."}</p>
      </section>

      <section className="space-y-1.5">
        <h3 className="flex items-center gap-2 font-semibold"><ListChecks className="h-4 w-4 text-primary" aria-hidden="true" /> Qué se solicita</h3>
        {r.items.length === 0 ? (
          <p className="text-muted-foreground">Se cotiza como un valor global (sin ítems detallados).</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Ítem</th>
                  <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                  <th className="px-3 py-2 text-left font-medium">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {r.items.map((i, n) => (
                  <tr key={i.id} className="border-t border-border align-top">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{n + 1}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium">{i.descripcion}</span>
                      {i.especificacion && <span className="block text-xs text-muted-foreground">{i.especificacion}</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{cantidad(i.cantidad)}</td>
                    <td className="px-3 py-2">{i.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {r.especificaciones.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="font-semibold">Especificaciones técnicas</h3>
          <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {r.especificaciones.map((e, i) => (
              <div key={`${e.name}-${i}`} className="flex gap-2 border-b border-border/60 pb-1.5">
                <dt className="min-w-0 flex-1 text-muted-foreground">{e.name}</dt>
                <dd className="text-right font-medium">{e.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {criterios.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="flex items-center gap-2 font-semibold"><Scale className="h-4 w-4 text-primary" aria-hidden="true" /> Cómo se evalúan las ofertas</h3>
          <div className="flex flex-wrap gap-2">
            {criterios.map(([k, v]) => (
              <span key={k} className="rounded-md bg-muted px-2.5 py-1">{CRITERIOS[k] ?? k} <strong>{v}%</strong></span>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-1.5">
        <h3 className="flex items-center gap-2 font-semibold"><Paperclip className="h-4 w-4 text-primary" aria-hidden="true" /> Documentos</h3>
        {r.documentos.length === 0 ? (
          <p className="text-muted-foreground">Sin documentos adjuntos.</p>
        ) : (
          <ul className="space-y-1.5">
            {r.documentos.map((d) => (
              <li key={d.id}>
                <Button variant="outline" size="sm" className="max-w-full gap-2" onClick={() => descargar(d.id)}>
                  <Download className="h-4 w-4 shrink-0" aria-hidden="true" /> <span className="truncate">{d.nombre}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
