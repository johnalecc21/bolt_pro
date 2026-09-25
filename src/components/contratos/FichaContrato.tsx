import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EvaluarDesempenoDialog } from "@/components/cliente/EvaluarDesempenoDialog";
import { DialogoAccion } from "@/components/contratos/DialogoAccion";
import {
  AlertTriangle, ArrowLeft, Ban, CalendarPlus, CheckCircle2, Circle, Clock, DollarSign, Download, FilePlus2,
  FileUp, History, Loader2, MessageSquareText, RefreshCw, Scale, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/moneda";
import { apiErrorMessage } from "@/lib/api/http";
import { fechaLocal } from "@/lib/fecha";
import { cargarLogo, generateContratoPdf } from "@/lib/pdf/contrato";
import {
  cambiarMontoContrato, emitirPo, obtenerUrlArchivoContrato, obtenerUrlVersion, prorrogarContrato, regenerarDocumento,
  reportarAvance, subirArchivoContrato, terminarContrato, type FichaContrato as Ficha,
} from "@/lib/api/contratos";
import { actualizarEstadoHito, type EstadoHito, type Hito } from "@/lib/api/seguimiento";
import { describirPenalidad, diasDeAtraso, ESTADO_GENERAL, estadoGeneral, penalidadEstimada } from "@/lib/contratos/hitos";
import { LineaErp, useEstadoErp } from "@/components/integraciones/EstadoErp";

const HITO: Record<EstadoHito, { label: string; icon: typeof Circle; clase: string }> = {
  completado: { label: "Completado", icon: CheckCircle2, clase: "bg-success/15 text-success" },
  en_riesgo: { label: "En riesgo", icon: Clock, clase: "bg-warning/15 text-warning-foreground" },
  atrasado: { label: "Atrasado", icon: AlertTriangle, clase: "bg-destructive/15 text-destructive" },
  pendiente: { label: "Pendiente", icon: Circle, clase: "bg-muted text-muted-foreground" },
};

const MODIFICACION: Record<Ficha["modificaciones"][number]["tipo"], string> = {
  PRORROGA: "Prórroga",
  MONTO: "Cambio de valor",
  TERMINACION: "Terminación anticipada",
};

const hoy = () => fechaLocal(new Date().toISOString());
const diasHasta = (fecha: string) => Math.ceil((new Date(`${fecha}T23:59:59`).getTime() - Date.now()) / 86_400_000);
const tamano = (b: number | null) => (b == null ? "" : b > 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

interface Props {
  ficha: Ficha;
  portal: "cliente" | "proveedor";
  /** Buyer roles allowed to run milestones, POs, extensions and documents. */
  puedeGestionar?: boolean;
  /** Buyer roles allowed to change the value or end the contract. */
  puedeDecidir?: boolean;
  onCambio: () => void;
}

/**
 * Everything about one contract in one place: terms and origin, what was
 * awarded, milestones and the payments they released, the POs of a marco and
 * its remaining ceiling, amendments, document versions and reviews.
 */
export function FichaContrato({ ficha: c, portal, puedeGestionar = false, puedeDecidir = false, onCambio }: Props) {
  const esCliente = portal === "cliente";
  const base = esCliente ? "/cliente" : "/proveedor";
  const general = estadoGeneral(c.hitos);
  // Only buyers see whether the order reached their ERP.
  const erp = useEstadoErp(esCliente ? [c.id] : []);
  // A paid milestone is worth what it released, even if the value changed later.
  const pagoDe = new Map(c.pagos.map((p) => [p.id, p.monto]));
  const valorHito = (h: Hito) => (h.pagoGeneradoId ? pagoDe.get(h.pagoGeneradoId) : undefined);
  const regla = c.marca?.penalidad ?? null;
  const penalidad = penalidadEstimada(c.hitos, c.monto, regla, Date.now(), valorHito);
  const completados = c.hitos.filter((h) => h.estado === "completado").length;
  const restantes = diasHasta(c.vigenciaFin);
  const terminado = c.estadoApi === "TERMINADO";
  const prorrogable = !terminado && (c.operativo || c.estadoApi === "VENCIDO");
  const [descargando, setDescargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [regenerando, setRegenerando] = useState(false);

  async function regenerar() {
    setRegenerando(true);
    try {
      await regenerarDocumento(c.id);
      toast.success("Documento generado desde tu plantilla", { description: "Quedó como la versión vigente." });
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo generar el documento."));
    } finally {
      setRegenerando(false);
    }
  }

  async function abrirVersion(versionId: string, editable = false) {
    const tab = window.open("", "_blank");
    try {
      const { url } = await obtenerUrlVersion(c.id, versionId, editable);
      if (tab) tab.location.href = url;
    } catch (err) {
      tab?.close();
      toast.error(apiErrorMessage(err));
    }
  }
  const fileRef = useRef<HTMLInputElement>(null);

  async function descargar() {
    setDescargando(true);
    const tab = c.archivoNombre ? window.open("", "_blank") : null;
    try {
      if (c.archivoNombre) {
        const { url } = await obtenerUrlArchivoContrato(c.id);
        if (tab) tab.location.href = url;
      } else {
        const logo = c.marca?.logoUrl ? await cargarLogo(c.marca.logoUrl) : null;
        generateContratoPdf({ ...c, esMarco: c.esMarco }, c.marca ? { ...c.marca, logo } : null);
        toast.success("PDF generado", { description: `${c.codigo}.pdf` });
      }
    } catch (err) {
      tab?.close();
      toast.error(apiErrorMessage(err, "No se pudo descargar el documento."));
    } finally {
      setDescargando(false);
    }
  }

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    try {
      await subirArchivoContrato(c.id, file);
      toast.success("Nueva versión del documento", { description: file.name });
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo adjuntar el documento."));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Volver a contratos">
            <Link to={`${base}/contratos`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{c.codigo}</h1>
              <Badge variant="secondary">{c.esMarco ? "Contrato Marco" : c.tipo === "PO" ? (c.padre ? "PO bajo marco" : "Orden de compra") : c.tipo}</Badge>
              <StatusBadge estado={c.estado} />
            </div>
            <p className="text-sm text-muted-foreground">
              {esCliente ? c.proveedor : c.cliente} · {c.categoria}
              {c.requerimiento && (
                <>
                  {" · "}
                  {esCliente ? (
                    <Link to={`/cliente/requerimientos/${c.requerimiento.id}`} className="text-primary hover:underline">{c.requerimiento.codigo} {c.requerimiento.titulo}</Link>
                  ) : (
                    <span>{c.requerimiento.titulo}</span>
                  )}
                </>
              )}
            </p>
            <LineaErp estado={erp(c.id, "ORDEN_COMPRA")} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={descargar} disabled={descargando}>
            {descargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {c.archivoNombre ? "Documento firmado" : "Descargar PDF"}
          </Button>
          {esCliente && puedeGestionar && (
            <>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={subir} />
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={subiendo}>
                {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {c.archivoNombre ? "Subir nueva versión" : "Adjuntar documento firmado"}
              </Button>
            </>
          )}
          {esCliente && puedeGestionar && c.esMarco && c.operativo && <EmitirPoDialogo ficha={c} onHecho={onCambio} />}
          {esCliente && puedeGestionar && prorrogable && <ProrrogarDialogo ficha={c} onHecho={onCambio} />}
          {esCliente && puedeDecidir && !terminado && <MontoDialogo ficha={c} onHecho={onCambio} />}
          {esCliente && puedeDecidir && !terminado && <TerminarDialogo ficha={c} onHecho={onCambio} />}
        </div>
      </div>

      {terminado && (
        <Card className="flex items-start gap-3 border-destructive/30 bg-destructive/5 p-4 text-sm">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Terminado anticipadamente el {c.terminadoAt}</p>
            <p className="text-muted-foreground">{c.motivoTerminacion} Los pagos ya liberados se mantienen; los hitos pendientes no liberan pagos.</p>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={c.esMarco ? "Valor del marco" : "Valor del contrato"} valor={formatMoney(c.monto, c.moneda)} />
        {c.esMarco ? (
          <Kpi label="Saldo para nuevas POs" valor={formatMoney(c.saldoMarco ?? 0, c.moneda)} nota={`${c.hijas.length} PO(s) emitidas`} />
        ) : (
          <Kpi label="Pagado" valor={formatMoney(c.resumenPagos.pagado, c.moneda)} nota={`Liberado ${formatMoney(c.resumenPagos.liberado, c.moneda)}`} />
        )}
        <Kpi
          label="Vigencia"
          valor={c.vigenciaFin}
          nota={terminado ? "Terminado" : restantes >= 0 ? `Quedan ${restantes} días` : `Venció hace ${-restantes} días`}
          alerta={!terminado && restantes <= 30}
        />
        <Kpi
          label="Entregas"
          valor={c.hitos.length ? `${completados} de ${c.hitos.length}` : c.esMarco ? "Por PO" : "—"}
          nota={c.hitos.length ? ESTADO_GENERAL[general] : c.esMarco ? "Se ejecuta con órdenes de compra" : "Sin hitos"}
          alerta={general === "atrasado"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Milestones */}
          {!c.esMarco && (
            <Card className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Hitos de entrega y pago</h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className={cn("font-medium", c.porcentajeAsignado === 100 ? "text-muted-foreground" : "text-warning-foreground")}>
                    {c.porcentajeAsignado}% del valor asignado a hitos{c.porcentajeAsignado < 100 && ` · faltan ${100 - c.porcentajeAsignado}%`}
                  </span>
                  {esCliente && puedeGestionar && !terminado && (
                    <Link to={`/cliente/contratos?vista=entregas&contrato=${c.id}`} className="text-primary hover:underline">Editar hitos</Link>
                  )}
                </div>
              </div>
              {c.hitos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay hitos definidos.</p>
              ) : (
                <ol className="space-y-4">
                  {c.hitos.map((h) => (
                    <HitoFila key={h.id} hito={h} ficha={c} valor={valorHito(h)} esCliente={esCliente} puedeGestionar={puedeGestionar && !terminado} onCambio={onCambio} />
                  ))}
                </ol>
              )}
              {penalidad.total > 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/5 p-3 text-sm">
                  <Scale className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p>
                      <strong>Penalidad estimada por atrasos: {formatMoney(penalidad.total, c.moneda)}</strong>
                      {penalidad.topeAlcanzado && ` (tope alcanzado: ${formatMoney(penalidad.tope, c.moneda)})`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cláusula de {c.marca?.razonSocial || c.cliente}: {regla && describirPenalidad(regla)}.{" "}
                      {penalidad.detalle.map((d) => `${d.label}: ${d.dias} día(s)`).join(" · ")}. {esCliente ? "Es una estimación; aplicarla es una decisión de tu empresa." : "Es una estimación informativa."}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* POs of a marco */}
          {c.esMarco && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Órdenes de compra emitidas</h2>
                <span className="text-xs text-muted-foreground">
                  Emitido {formatMoney(c.monto - (c.saldoMarco ?? 0), c.moneda)} de {formatMoney(c.monto, c.moneda)}
                </span>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Consumido ${Math.round(((c.monto - (c.saldoMarco ?? 0)) / c.monto) * 100)}% del marco`}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ((c.monto - (c.saldoMarco ?? 0)) / c.monto) * 100)}%` }} />
              </div>
              {c.hijas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Un Contrato Marco se ejecuta con órdenes de compra: cada PO descuenta del saldo y nace con su hito de entrega y pago.</p>
              ) : (
                <Tabla
                  cols={["PO", "Monto", "Vigencia", "Pagado", "Estado"]}
                  alinear={[false, true, false, true, false]}
                  filas={c.hijas.map((h) => [
                    <Link key="c" to={`${base}/contratos/${h.id}`} className="font-medium text-primary hover:underline">{h.codigo}</Link>,
                    formatMoney(h.monto, c.moneda),
                    `${h.vigenciaInicio} — ${h.vigenciaFin}`,
                    formatMoney(h.pagado, c.moneda),
                    <StatusBadge key="e" estado={h.estado} />,
                  ])}
                />
              )}
            </Card>
          )}

          {c.lineas.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Ítems adjudicados</h2>
              <Tabla
                cols={["Ítem", "Cantidad", "Precio unitario", "Subtotal"]}
                alinear={[false, true, true, true]}
                filas={c.lineas.map((l) => [
                  l.descripcion,
                  `${l.cantidad.toLocaleString("es-CO", { maximumFractionDigits: 3 })} ${l.unidad}`,
                  formatMoney(l.precioUnitario, c.moneda),
                  formatMoney(l.subtotal, c.moneda),
                ])}
              />
            </Card>
          )}

          {!c.esMarco && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Pagos</h2>
                <Link to={esCliente ? "/cliente/pagos" : "/proveedor/pagos"} className="text-xs text-primary hover:underline">
                  {esCliente ? "Ir a Cuentas por pagar" : "Ir a mi Centro de Pagos"}
                </Link>
              </div>
              {c.pagos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cada hito completado con % de pago libera aquí su pago; el proveedor radica la factura y el plazo de {c.condicionesPagoDias} días corre desde entonces.</p>
              ) : (
                <>
                  <Tabla
                    cols={["Concepto", "A pagar", "Factura", "Vence / pagado", "Estado"]}
                    alinear={[false, true, false, false, false]}
                    filas={c.pagos.map((p) => [
                      p.concepto ?? "—",
                      formatMoney(p.montoNeto, c.moneda),
                      p.factura ? `${p.factura.numero} (${p.factura.estado})` : "Sin factura",
                      p.estado === "pagado" ? `Pagado ${p.fechaPago}` : p.fechaPagoPactada,
                      <StatusBadge key="e" estado={p.estado === "pagado" ? "Pagado" : p.estado === "vencido" ? "Vencido" : "Por pagar"} />,
                    ])}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Liberado {formatMoney(c.resumenPagos.liberado, c.moneda)} · pagado {formatMoney(c.resumenPagos.pagado, c.moneda)} · por pagar {formatMoney(c.resumenPagos.pendiente, c.moneda)}
                  </p>
                </>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Condiciones</h2>
            <dl className="space-y-2 text-sm">
              <Dato k="Vigencia" v={`${c.vigenciaInicio} — ${c.vigenciaFin}`} />
              <Dato k="Firmado" v={c.firmado} />
              {c.poId && <Dato k="Orden de compra" v={c.poId} />}
              {c.padre && (
                <Dato k="Contrato Marco" v={<Link to={`${base}/contratos/${c.padre.id}`} className="text-primary hover:underline">{c.padre.codigo}</Link>} />
              )}
              <Dato k="Pago" v={`${c.condicionesPagoDias} días desde la factura`} />
              {c.plazoDias != null && <Dato k="Plazo ofertado" v={`${c.plazoDias} días`} />}
              {c.garantiaMeses != null && <Dato k="Garantía" v={`${c.garantiaMeses} meses`} />}
              {esCliente && c.centroCosto && <Dato k="Centro de costo" v={c.centroCosto} />}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><History className="h-4 w-4" /> Modificaciones</h2>
            {c.modificaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin modificaciones desde la firma.</p>
            ) : (
              <ol className="space-y-3">
                {c.modificaciones.map((m) => (
                  <li key={m.id} className="border-l-2 border-border pl-3 text-sm">
                    <p className="font-medium">{MODIFICACION[m.tipo]}</p>
                    <p className="text-muted-foreground">
                      {m.tipo === "PRORROGA" && `Vigencia ${m.vigenciaAntes} → ${m.vigenciaDespues}`}
                      {m.tipo === "MONTO" && `Valor ${formatMoney(m.montoAntes ?? 0, c.moneda)} → ${formatMoney(m.montoDespues ?? 0, c.moneda)}`}
                      {m.tipo === "TERMINACION" && "Contrato terminado"}
                    </p>
                    <p className="text-xs text-muted-foreground">“{m.motivo}” — {esCliente ? `${m.usuario}, ` : ""}{fechaLocal(m.fecha)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {esCliente && (
            <Card className="p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold"><FileUp className="h-4 w-4" /> Documento</h2>
                {c.plantillaActiva && (
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={regenerando} onClick={regenerar}>
                    <RefreshCw className={cn("h-3.5 w-3.5", regenerando && "animate-spin")} aria-hidden="true" /> Generar desde plantilla
                  </Button>
                )}
              </div>
              {c.versiones.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {c.plantillaActiva
                    ? "Tu empresa tiene una plantilla para este documento: genérala con los datos actuales, o adjunta el firmado."
                    : "Sin documento propio: la descarga usa el formato de Procurex con los datos de tu empresa. Sube tus plantillas en Plantillas y documentos, o adjunta el contrato firmado; cada subida queda como otra versión."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {c.versiones.map((v, i) => (
                    <li key={v.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium" title={v.nombre}>
                          v{c.versiones.length - i} · {v.nombre} {i === 0 && <Badge variant="secondary" className="ml-1 text-[10px]">Vigente</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fechaLocal(v.fecha)} · {v.origen === "PLANTILLA" ? `Generado de ${v.subidoPor.replace(/^Plantilla /, "la plantilla ")}` : v.subidoPor} {tamano(v.tamanoBytes)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        {v.editable && (
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" aria-label={`Descargar Word de la versión ${c.versiones.length - i}`} onClick={() => abrirVersion(v.id, true)}>
                            Word
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" aria-label={`Descargar versión ${c.versiones.length - i}`} onClick={() => abrirVersion(v.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {esCliente && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Evaluación del proveedor</h2>
              {c.evaluaciones.length === 0 ? (
                <p className="mb-3 text-sm text-muted-foreground">Aún no se ha evaluado este contrato.</p>
              ) : (
                <ul className="mb-3 space-y-2 text-sm">
                  {c.evaluaciones.map((e) => (
                    <li key={e.id}>
                      <span className="font-semibold tabular-nums">{e.puntaje}/100</span>
                      <span className="text-muted-foreground"> · {fechaLocal(e.fecha)} · calidad {e.calidad}, plazos {e.plazos}, servicio {e.servicio}, HSE {e.hse}</span>
                      {e.requierePlanMejora && <span className="block text-xs text-destructive">Requiere plan de mejora</span>}
                    </li>
                  ))}
                </ul>
              )}
              {puedeGestionar && c.proveedorId && <EvaluarDesempenoDialog contratoId={c.id} codigo={c.codigo} proveedor={c.proveedor} onDone={onCambio} />}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function HitoFila({ hito: h, ficha: c, valor, esCliente, puedeGestionar, onCambio }: { hito: Hito; ficha: Ficha; valor?: number; esCliente: boolean; puedeGestionar: boolean; onCambio: () => void }) {
  const e = HITO[h.estado];
  const monto = valor ?? Math.round((c.monto * h.porcentaje) / 100);
  const atraso = diasDeAtraso(h);
  const [nota, setNota] = useState("");
  return (
    <li className="flex items-start gap-3">
      <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", e.clase)} aria-hidden="true">
        <e.icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{h.label}</p>
            <span className="text-xs text-muted-foreground">{e.label}{h.estado === "completado" && atraso > 0 ? ` con ${atraso} día(s) de atraso` : ""}</span>
            {h.porcentaje > 0 && (
              <Badge variant="secondary" className={cn("gap-1 text-xs", h.pagoGeneradoId && "bg-success/15 text-success")}>
                <DollarSign className="h-3 w-3" aria-hidden="true" /> {h.porcentaje}% · {formatMoney(monto, c.moneda)}{h.pagoGeneradoId ? " · pago liberado" : ""}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">Comprometido {h.comprometido}{h.real && ` · recibido ${h.real}`}</span>
        </div>
        {h.avanceProveedor && (
          <p className="flex items-start gap-1.5 rounded bg-info/10 px-2 py-1 text-xs text-info">
            <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{esCliente ? "El proveedor reporta" : "Reportaste"}: “{h.avanceProveedor}”{h.avanceReportadoAt && ` — ${fechaLocal(h.avanceReportadoAt)}`}</span>
          </p>
        )}
        {h.estado !== "completado" && esCliente && puedeGestionar && (
          <ConfirmDialog
            trigger={<Button size="sm" variant="outline" className="h-7 text-xs">Marcar como recibido</Button>}
            title={`Recibir "${h.label}"`}
            description={
              h.porcentaje > 0
                ? `Confirmas que recibiste esta entrega. Se libera un pago de ${formatMoney(monto, c.moneda)} (${h.porcentaje}%) a ${c.proveedor}; después no se puede reabrir.`
                : "Confirmas que recibiste esta entrega."
            }
            confirmLabel="Confirmar recepción"
            onConfirm={async () => {
              try {
                await actualizarEstadoHito(h.id, "completado");
                toast.success(h.porcentaje > 0 ? "Entrega recibida y pago liberado" : "Entrega recibida");
                onCambio();
              } catch (err) {
                toast.error(apiErrorMessage(err));
              }
            }}
          />
        )}
        {h.estado !== "completado" && !esCliente && c.operativo && (
          <DialogoAccion
            trigger={<Button size="sm" variant="outline" className="h-7 text-xs">Reportar avance</Button>}
            titulo={`Reportar avance: ${h.label}`}
            descripcion="Tu cliente recibe una notificación. Él confirma la recepción, que es lo que libera el pago."
            confirmar="Enviar"
            puedeConfirmar={nota.trim().length >= 3}
            exito="Avance reportado"
            onConfirmar={async () => {
              await reportarAvance(c.id, h.id, nota.trim());
              setNota("");
              onCambio();
            }}
          >
            <Label htmlFor={`nota-${h.id}`}>¿Qué entregaste o cómo va?</Label>
            <Textarea id={`nota-${h.id}`} rows={3} maxLength={500} value={nota} onChange={(ev) => setNota(ev.target.value)} placeholder="Ej. Entregamos 10 equipos en la planta norte; falta la instalación." />
          </DialogoAccion>
        )}
      </div>
    </li>
  );
}

function EmitirPoDialogo({ ficha: c, onHecho }: { ficha: Ficha; onHecho: () => void }) {
  const [monto, setMonto] = useState("");
  const [inicio, setInicio] = useState(hoy());
  const [fin, setFin] = useState("");
  const valor = Number(monto);
  const excede = valor > (c.saldoMarco ?? 0);
  return (
    <DialogoAccion
      trigger={<Button size="sm" className="gap-1.5"><FilePlus2 className="h-4 w-4" /> Emitir PO</Button>}
      titulo="Emitir orden de compra"
      descripcion={`Se descuenta del saldo del marco (${formatMoney(c.saldoMarco ?? 0, c.moneda)}) y nace con un hito de entrega del 100%. El proveedor recibe la notificación.`}
      confirmar="Emitir PO"
      puedeConfirmar={valor > 0 && !excede && !!fin && fin > inicio && fin <= c.vigenciaFin}
      exito="PO emitida"
      onConfirmar={async () => {
        await emitirPo(c.id, { monto: valor, vigenciaInicio: inicio, vigenciaFin: fin });
        onHecho();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="po-monto">Monto ({c.moneda})</Label>
        <Input id="po-monto" type="number" min={1} value={monto} onChange={(e) => setMonto(e.target.value)} aria-invalid={excede} />
        {excede && <p className="text-xs text-destructive">Supera el saldo disponible.</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="po-inicio">Inicio</Label>
          <Input id="po-inicio" type="date" value={inicio} min={c.vigenciaInicio} max={c.vigenciaFin} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="po-fin">Fin (máx. {c.vigenciaFin})</Label>
          <Input id="po-fin" type="date" value={fin} min={inicio} max={c.vigenciaFin} onChange={(e) => setFin(e.target.value)} />
        </div>
      </div>
    </DialogoAccion>
  );
}

function ProrrogarDialogo({ ficha: c, onHecho }: { ficha: Ficha; onHecho: () => void }) {
  const [fin, setFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const max = c.padre?.vigenciaFin;
  return (
    <DialogoAccion
      trigger={<Button size="sm" variant="outline" className="gap-1.5"><CalendarPlus className="h-4 w-4" /> Prorrogar</Button>}
      titulo="Prorrogar vigencia"
      descripcion={`Vigencia actual hasta ${c.vigenciaFin}. Queda en el historial de modificaciones y se notifica al proveedor.${max ? ` Una PO no puede superar a su marco (${max}).` : ""}`}
      confirmar="Prorrogar"
      puedeConfirmar={!!fin && fin > c.vigenciaFin && (!max || fin <= max) && motivo.trim().length >= 5}
      exito="Contrato prorrogado"
      onConfirmar={async () => {
        await prorrogarContrato(c.id, fin, motivo.trim());
        onHecho();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="pr-fin">Nueva fecha de fin</Label>
        <Input id="pr-fin" type="date" value={fin} min={c.vigenciaFin} max={max} onChange={(e) => setFin(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pr-motivo">Motivo</Label>
        <Textarea id="pr-motivo" rows={2} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Ampliación del plazo de obra acordada con el proveedor" />
      </div>
    </DialogoAccion>
  );
}

function MontoDialogo({ ficha: c, onHecho }: { ficha: Ficha; onHecho: () => void }) {
  const [monto, setMonto] = useState(String(c.monto));
  const [motivo, setMotivo] = useState("");
  const valor = Number(monto);
  const minimo = c.esMarco ? c.monto - (c.saldoMarco ?? 0) : c.resumenPagos.liberado;
  return (
    <DialogoAccion
      trigger={<Button size="sm" variant="outline" className="gap-1.5"><DollarSign className="h-4 w-4" /> Cambiar valor</Button>}
      titulo="Cambiar el valor del contrato"
      descripcion={`Valor actual ${formatMoney(c.monto, c.moneda)}. No puede quedar por debajo de lo ya comprometido (${formatMoney(minimo, c.moneda)})${c.padre ? ` y un aumento no puede superar el saldo del marco (${formatMoney(c.padre.saldo, c.moneda)})` : ""}. Los hitos pendientes se pagan sobre el nuevo valor.`}
      confirmar="Guardar"
      puedeConfirmar={valor >= minimo && valor > 0 && valor !== c.monto && motivo.trim().length >= 5}
      exito="Valor actualizado"
      onConfirmar={async () => {
        await cambiarMontoContrato(c.id, valor, motivo.trim());
        onHecho();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="mt-monto">Nuevo valor ({c.moneda})</Label>
        <Input id="mt-monto" type="number" min={minimo} value={monto} onChange={(e) => setMonto(e.target.value)} aria-invalid={valor < minimo} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mt-motivo">Motivo</Label>
        <Textarea id="mt-motivo" rows={2} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Adición de 5 equipos por otrosí firmado" />
      </div>
    </DialogoAccion>
  );
}

function TerminarDialogo({ ficha: c, onHecho }: { ficha: Ficha; onHecho: () => void }) {
  const [motivo, setMotivo] = useState("");
  return (
    <DialogoAccion
      trigger={<Button size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"><Ban className="h-4 w-4" /> Terminar</Button>}
      titulo={`Terminar ${c.codigo} anticipadamente`}
      descripcion={`Los pagos ya liberados se mantienen; los hitos pendientes dejan de liberar pagos${c.esMarco ? " y no se podrán emitir más POs" : ""}. Se notifica al proveedor. No se puede deshacer.`}
      confirmar="Terminar contrato"
      destructivo
      puedeConfirmar={motivo.trim().length >= 5}
      exito="Contrato terminado"
      onConfirmar={async () => {
        await terminarContrato(c.id, motivo.trim());
        onHecho();
      }}
    >
      <Label htmlFor="tr-motivo">Motivo</Label>
      <Textarea id="tr-motivo" rows={3} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Incumplimiento reiterado de plazos (cláusula de terminación)" />
    </DialogoAccion>
  );
}

function Kpi({ label, valor, nota, alerta }: { label: string; valor: string; nota?: string; alerta?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{valor}</p>
      {nota && <p className={cn("text-xs", alerta ? "font-medium text-destructive" : "text-muted-foreground")}>{nota}</p>}
    </Card>
  );
}

function Dato({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

function Tabla({ cols, filas, alinear }: { cols: string[]; filas: React.ReactNode[][]; alinear: boolean[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>{cols.map((c, i) => <th key={c} className={cn("px-3 py-2 font-medium", alinear[i] ? "text-right" : "text-left")}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {filas.map((f, r) => (
            <tr key={r} className="border-t border-border">
              {f.map((v, i) => <td key={i} className={cn("px-3 py-2", alinear[i] && "text-right tabular-nums")}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
