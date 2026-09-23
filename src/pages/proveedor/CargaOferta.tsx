import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { FileText, Send, CheckCircle2, Inbox, Calendar } from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { fetchInvitaciones } from "@/lib/api/invitaciones";
import { fetchMiOferta, fetchMisOfertas, guardarMiOferta, enviarMiOferta, type MiOferta } from "@/lib/api/ofertas";
import { fetchPreguntas, preguntar as apiPreguntar } from "@/lib/api/preguntas";
import { apiErrorMessage } from "@/lib/api/http";

import { formatMoney } from "@/lib/moneda";
export function CargaOferta() {
  const { requerimientoId } = useParams();
  return requerimientoId ? <OfertaDetalle requerimientoId={requerimientoId} /> : <MisOfertasList />;
}

function MisOfertasList() {
  const navigate = useNavigate();
  const { data: ofertas, loading } = useApiData(fetchMisOfertas);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Ofertas</h1>
          <p className="text-sm text-muted-foreground">Procesos que aceptaste y en los que puedes cargar o revisar tu oferta</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (!ofertas || ofertas.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Inbox}
          title="Aún no has aceptado ningún proceso"
          description="Ve a Bandeja de Invitaciones y acepta un proceso para empezar a cargar tu oferta."
          actionLabel="Ir a Bandeja de Invitaciones"
          onAction={() => navigate("/proveedor/invitaciones")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Ofertas</h1>
        <p className="text-sm text-muted-foreground">Procesos que aceptaste y en los que puedes cargar o revisar tu oferta</p>
      </div>
      <div className="space-y-3">
        {ofertas.map((o) => (
          <Link key={o.requerimientoId} to={`/proveedor/ofertas/${o.requerimientoId}`}>
            <Card className="p-4 transition-colors hover:bg-muted/30">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.titulo || o.requerimientoId} · {o.categoria}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{o.cliente}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Vence {o.fechaLimite}</span>
                  </div>
                </div>
                {o.precioTotal != null && <p className="text-sm font-semibold">{formatMoney(o.precioTotal, o.moneda)}</p>}
                <StatusBadge estado={o.enviada ? "Activo" : "pendiente_aprobacion"} className="capitalize" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function OfertaDetalle({ requerimientoId }: { requerimientoId: string }) {
  const { data: invitaciones } = useApiData(fetchInvitaciones);
  const invitacion = (invitaciones ?? []).find((i) => i.requerimientoId === requerimientoId);
  const { data: ofertaData, loading, reload } = useApiData(() => fetchMiOferta(requerimientoId), [requerimientoId]);
  const { data: preguntas, reload: reloadPreguntas } = useApiData(
    () => fetchPreguntas(requerimientoId),
    [requerimientoId],
  );

  const [oferta, setOferta] = useState<MiOferta | null>(null);
  const [pregunta, setPregunta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [enviandoPregunta, setEnviandoPregunta] = useState(false);

  useEffect(() => {
    if (ofertaData) setOferta(ofertaData);
  }, [ofertaData]);

  if (loading || !oferta) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando...</div>;
  }

  const camposCompletos = oferta.precioTotal > 0 && oferta.plazoEntregaDias > 0;

  function update(patch: Partial<MiOferta>) {
    setOferta((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function enviarOferta() {
    if (!oferta) return;
    setGuardando(true);
    try {
      await guardarMiOferta({
        requerimientoId,
        precioUnitario: oferta.precioUnitario,
        precioTotal: oferta.precioTotal,
        plazoEntregaDias: oferta.plazoEntregaDias,
        condicionesPagoDias: oferta.condicionesPagoDias,
        garantiaMeses: oferta.garantiaMeses,
        vigenciaOfertaDias: oferta.vigenciaOfertaDias,
      });
      await enviarMiOferta(requerimientoId);
      toast.success("Oferta enviada", { description: "No podrás editarla salvo que se habilite una nueva ventana." });
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo enviar la oferta."));
    } finally {
      setGuardando(false);
    }
  }

  async function enviarPregunta() {
    if (!pregunta.trim() || !requerimientoId) return;
    setEnviandoPregunta(true);
    try {
      await apiPreguntar(requerimientoId, pregunta.trim());
      setPregunta("");
      toast.info("Pregunta enviada al comprador");
      reloadPreguntas();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo enviar la pregunta."));
    } finally {
      setEnviandoPregunta(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{requerimientoId} — Detalle y carga de oferta</h1>
        <p className="text-sm text-muted-foreground">{invitacion?.cliente ?? "Cliente"} · Categoría: {invitacion?.categoria ?? "—"}</p>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" /> Especificaciones del RFP</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{invitacion?.titulo ?? "Revisa el detalle completo del requerimiento en tu correo de invitación."}</p>
          <p>Fecha límite de recepción de ofertas: <strong className="text-foreground">{invitacion?.fechaLimite ?? "—"}</strong></p>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Preguntas y respuestas</h2>
        <div className="space-y-3">
          {(preguntas ?? []).length === 0 && <p className="text-sm text-muted-foreground">Aún no has hecho preguntas sobre este proceso.</p>}
          {(preguntas ?? []).map((qa) => (
            <div key={qa.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{qa.pregunta}</p>
              <p className="text-muted-foreground">{qa.respuesta || "Pendiente de respuesta del comprador."}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">— Tú</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input placeholder="Haz una pregunta sobre este RFP..." value={pregunta} onChange={(e) => setPregunta(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarPregunta()} disabled={oferta.enviada} />
          <Button size="icon" onClick={enviarPregunta} disabled={!pregunta.trim() || oferta.enviada || enviandoPregunta}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Formulario estandarizado de oferta</h2>
        {oferta.enviada ? (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-sm text-success">
            <CheckCircle2 className="h-5 w-5" /> Tu oferta fue enviada y está en revisión. Ya no es editable.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Precio unitario ({invitacion?.moneda ?? "USD"})</Label>
                <Input type="number" value={oferta.precioUnitario || ""} onChange={(e) => update({ precioUnitario: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Precio total ({invitacion?.moneda ?? "USD"})</Label>
                <Input type="number" value={oferta.precioTotal || ""} onChange={(e) => update({ precioTotal: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Plazo de entrega (días)</Label>
                <Input type="number" value={oferta.plazoEntregaDias || ""} onChange={(e) => update({ plazoEntregaDias: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Condiciones de pago (días)</Label>
                <Input type="number" value={oferta.condicionesPagoDias || ""} onChange={(e) => update({ condicionesPagoDias: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Garantía (meses)</Label>
                <Input type="number" value={oferta.garantiaMeses || ""} onChange={(e) => update({ garantiaMeses: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Vigencia de la oferta (días)</Label>
                <Input type="number" value={oferta.vigenciaOfertaDias || ""} onChange={(e) => update({ vigenciaOfertaDias: Number(e.target.value) })} />
              </div>
            </div>
            <ConfirmDialog
              trigger={<Button className="mt-6 gap-2" disabled={!camposCompletos || guardando}><Send className="h-4 w-4" /> Enviar oferta</Button>}
              title="Enviar oferta"
              description="Una vez enviada, no podrás editarla salvo que el comprador habilite una nueva ventana. Esta es la misma estructura que verán todos los proveedores del proceso."
              confirmLabel="Enviar"
              onConfirm={enviarOferta}
            />
          </>
        )}
      </Card>
    </div>
  );
}
