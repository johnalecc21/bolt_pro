import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PaginationBar } from "@/components/shared/PaginationBar";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import {
  AlertTriangle, CheckCircle2, Copy, Download, FileSpreadsheet, KeyRound, Loader2, PlugZap, RefreshCw, Send, ShieldCheck, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/hooks/useApiData";
import { apiErrorMessage } from "@/lib/api/http";
import { fechaLocal } from "@/lib/fecha";
import { descargarSeccionCsv, generarExcel } from "@/lib/analitica/exportar";
import { HOJAS, hojasASecciones, totalFilas } from "@/lib/integraciones/hojas";
import { EstadoErpBadge } from "@/components/integraciones/EstadoErp";
import {
  actualizarIntegracion, descartarEvento, ESTADO_EVENTO_LABEL, fetchEvento, fetchEventos, fetchExportacion, fetchIntegracion,
  fetchMapeos, fetchPendientes, generarApiKey, generarSecreto, guardarMapeos, marcarExportados, probarConexion, reintentarEvento,
  TIPO_EVENTO_LABEL, type EstadoEventoErp, type EventoErp, type HojasErp, type IntegracionErp, type Mapeo, type TipoEventoErp,
} from "@/lib/api/integraciones";

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");
const hoy = () => fechaLocal(new Date().toISOString());
const inicioMes = () => `${hoy().slice(0, 8)}01`;

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success("Copiado");
  } catch {
    toast.error("No se pudo copiar; selecciónalo y cópialo a mano.");
  }
}

/**
 * Connects Procurex to any ERP: import files (no IT needed) or a signed
 * webhook plus an API for payments. Finance roles only.
 */
export function IntegracionesErp() {
  const { data: cfg, loading, reload } = useApiData(fetchIntegracion);
  const [tab, setTab] = useState("exportar");

  if (loading && !cfg) return <div className="p-6"><TableSkeleton /></div>;
  if (!cfg) return null;
  const conteo = cfg.conteo;
  const problemas = (conteo.ERROR ?? 0) + (conteo.FALLIDO ?? 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Integración con ERP</h1>
          <p className="text-sm text-muted-foreground">Lleva órdenes, recepciones, facturas y pagos a tu sistema contable sin digitarlos de nuevo. Funciona con cualquier ERP.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary" className={cn("gap-1", cfg.activa ? "bg-success/15 text-success" : "")}>
            {cfg.activa ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
            {cfg.activa ? `Activa · ${cfg.modo === "WEBHOOK" ? "webhook" : "archivo"}` : "Inactiva"}
          </Badge>
          {cfg.sistema && <Badge variant="secondary">{cfg.sistema}</Badge>}
          {problemas > 0 && (
            <button className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline" onClick={() => setTab("sync")}>
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> {problemas} con error
            </button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="exportar">Exportar</TabsTrigger>
          <TabsTrigger value="conexion">Conexión</TabsTrigger>
          <TabsTrigger value="mapeos">Mapeos</TabsTrigger>
          <TabsTrigger value="sync">Sincronización{(conteo.PENDIENTE ?? 0) + problemas > 0 ? ` (${(conteo.PENDIENTE ?? 0) + problemas})` : ""}</TabsTrigger>
        </TabsList>
        <TabsContent value="exportar" className="mt-4 space-y-6">
          <ExportarPeriodo />
          <Pendientes cfg={cfg} onCambio={reload} />
        </TabsContent>
        <TabsContent value="conexion" className="mt-4">
          <Conexion cfg={cfg} onCambio={reload} />
        </TabsContent>
        <TabsContent value="mapeos" className="mt-4">
          <Mapeos />
        </TabsContent>
        <TabsContent value="sync" className="mt-4">
          <Sincronizacion onCambio={reload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ------------------------------------------------------------------ Exportar

function ResumenHojas({ hojas, sufijo, onExcel }: { hojas: HojasErp; sufijo: string; onExcel: () => void }) {
  const secciones = hojasASecciones(hojas);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {HOJAS.map((h) => {
          const s = secciones.find((x) => x.id === h.id);
          return (
            <div key={h.id} className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{h.titulo}</p>
              <p className="text-lg font-semibold tabular-nums">{hojas[h.id].length}</p>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" disabled={!s} onClick={() => s && descargarSeccionCsv(s, sufijo)}>
                CSV
              </Button>
            </div>
          );
        })}
      </div>
      <Button className="gap-2" onClick={onExcel} disabled={totalFilas(hojas) === 0}>
        <FileSpreadsheet className="h-4 w-4" /> Descargar Excel (todas las hojas)
      </Button>
    </div>
  );
}

function ExportarPeriodo() {
  const [desde, setDesde] = useState(inicioMes());
  const [hasta, setHasta] = useState(hoy());
  const [hojas, setHojas] = useState<(HojasErp & { truncado: boolean }) | null>(null);
  const [cargando, setCargando] = useState(false);

  async function preparar() {
    setCargando(true);
    try {
      setHojas(await fetchExportacion(desde, hasta));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Exportar un período</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Todo lo firmado, recibido, aprobado y pagado entre dos fechas, en hojas listas para importar (terceros, órdenes y sus líneas, recepciones, facturas, pagos). No necesita tener la integración activa.
      </p>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="exp-desde">Desde</Label>
          <Input id="exp-desde" type="date" value={desde} max={hasta} onChange={(e) => { setDesde(e.target.value); setHojas(null); }} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-hasta">Hasta</Label>
          <Input id="exp-hasta" type="date" value={hasta} min={desde} max={hoy()} onChange={(e) => { setHasta(e.target.value); setHojas(null); }} />
        </div>
        <Button variant="outline" className="gap-2" onClick={preparar} disabled={cargando || !desde || !hasta}>
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Preparar exportación
        </Button>
      </div>
      {hojas && (
        <>
          {hojas.truncado && <p className="mb-2 text-xs text-warning-foreground">El período tiene más de 2.000 documentos de algún tipo; divide el rango para no dejar ninguno por fuera.</p>}
          {totalFilas(hojas) === 0 ? (
            <p className="text-sm text-muted-foreground">No hay documentos en ese período.</p>
          ) : (
            <ResumenHojas
              hojas={hojas}
              sufijo={`${desde}_${hasta}`}
              onExcel={() =>
                generarExcel({
                  titulo: "Exportación para ERP",
                  portada: [`Período: ${desde} a ${hasta}`, `Generado: ${new Date().toLocaleString("es-CO")}`],
                  notas: ["Columnas estables: mapea cada hoja una vez en el importador de tu ERP.", "Valores sin impuestos: el ERP calcula IVA y retenciones.", "id_procurex identifica cada documento para no importarlo dos veces."],
                  secciones: hojasASecciones(hojas),
                  archivo: `procurex-erp_${desde}_${hasta}.xlsx`,
                })
              }
            />
          )}
        </>
      )}
    </Card>
  );
}

function Pendientes({ cfg, onCambio }: { cfg: IntegracionErp; onCambio: () => void }) {
  const [datos, setDatos] = useState<{ ids: string[]; hojas: HojasErp; truncado: boolean } | null>(null);
  const [descargado, setDescargado] = useState(false);
  const archivo = cfg.activa && cfg.modo === "ARCHIVO";

  useEffect(() => {
    if (archivo) fetchPendientes().then(setDatos).catch(() => setDatos(null));
  }, [archivo, cfg.conteo.PENDIENTE]);

  if (!archivo) {
    return (
      <Card className="p-5 text-sm text-muted-foreground">
        <h2 className="mb-1 font-semibold text-foreground">Pendientes desde la última exportación</h2>
        {cfg.activa
          ? "La integración envía los documentos por webhook; su estado está en Sincronización."
          : "Activa la integración en modo archivo (pestaña Conexión) para que cada documento nuevo quede en esta bandeja hasta que lo exportes."}
      </Card>
    );
  }

  const fechaArchivo = hoy();
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Pendientes desde la última exportación</h2>
      <p className="mb-4 text-sm text-muted-foreground">Cada documento nuevo o modificado queda aquí. Descárgalo, impórtalo en el ERP y márcalo como exportado.</p>
      {!datos ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : datos.ids.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay nada pendiente. 🎉</p>
      ) : (
        <div className="space-y-4">
          <ResumenHojas
            hojas={datos.hojas}
            sufijo={`pendientes_${fechaArchivo}`}
            onExcel={async () => {
              await generarExcel({
                titulo: "Pendientes para el ERP",
                portada: [`${datos.ids.length} documento(s)`, `Generado: ${new Date().toLocaleString("es-CO")}`],
                notas: ["Una orden modificada vuelve a aparecer con su versión nueva: actualízala por id_procurex."],
                secciones: hojasASecciones(datos.hojas),
                archivo: `procurex-erp_pendientes_${fechaArchivo}.xlsx`,
              });
              setDescargado(true);
            }}
          />
          <ConfirmDialog
            trigger={<Button variant={descargado ? "default" : "outline"} className="gap-2"><CheckCircle2 className="h-4 w-4" /> Marcar {datos.ids.length} como exportados</Button>}
            title="Marcar como exportados"
            description="Confirma que ya importaste el archivo en tu ERP. Estos documentos salen de la bandeja; si alguno cambia después, volverá a aparecer."
            confirmLabel="Marcar exportados"
            onConfirm={async () => {
              try {
                const n = await marcarExportados(datos.ids);
                toast.success(`${n} documento(s) marcados como exportados`);
                setDescargado(false);
                onCambio();
              } catch (err) {
                toast.error(apiErrorMessage(err));
              }
            }}
          />
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ Conexión

const TIPOS: TipoEventoErp[] = ["PROVEEDOR", "ORDEN_COMPRA", "RECEPCION", "FACTURA", "PAGO"];

function Conexion({ cfg, onCambio }: { cfg: IntegracionErp; onCambio: () => void }) {
  const [sistema, setSistema] = useState(cfg.sistema ?? "");
  const [url, setUrl] = useState(cfg.webhookUrl ?? "");
  const [revelado, setRevelado] = useState<{ titulo: string; valor: string; nota: string } | null>(null);
  const [probando, setProbando] = useState(false);
  const eventos = cfg.eventos.length ? cfg.eventos : TIPOS;

  async function guardar(cambios: Parameters<typeof actualizarIntegracion>[0], ok = "Guardado") {
    try {
      await actualizarIntegracion(cambios);
      toast.success(ok);
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Estado</h2>
            <p className="text-sm text-muted-foreground">Mientras esté activa, cada documento nuevo o modificado se prepara para el ERP.</p>
          </div>
          <Switch checked={cfg.activa} onCheckedChange={(v) => guardar({ activa: v }, v ? "Integración activada" : "Integración desactivada")} aria-label="Integración activa" />
        </div>

        <div className="space-y-2">
          <Label>Cómo llegan los documentos al ERP</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ["ARCHIVO", "Archivo", "Descargas un Excel/CSV y lo importas. Sin TI."],
              ["WEBHOOK", "Webhook", "Procurex envía cada documento firmado a tu ERP o integrador."],
            ] as const).map(([modo, titulo, desc]) => (
              <button
                key={modo}
                type="button"
                aria-pressed={cfg.modo === modo}
                onClick={() => cfg.modo !== modo && guardar({ modo }, `Modo ${titulo.toLowerCase()}`)}
                className={cn("rounded-lg border p-3 text-left text-sm transition-colors", cfg.modo === modo ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}
              >
                <p className="font-medium">{titulo}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="erp-sistema">Tu ERP (referencia)</Label>
            <Input id="erp-sistema" value={sistema} maxLength={60} placeholder="Siigo, Alegra, SAP B1, World Office…" onChange={(e) => setSistema(e.target.value)} />
          </div>
          <Button variant="outline" disabled={sistema === (cfg.sistema ?? "")} onClick={() => guardar({ sistema })}>Guardar</Button>
        </div>

        <div className="space-y-2">
          <Label>Qué documentos enviar</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {TIPOS.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={eventos.includes(t)}
                  onCheckedChange={(v) => {
                    const nuevos = v ? [...eventos, t] : eventos.filter((x) => x !== t);
                    if (nuevos.length === 0) return toast.error("Deja al menos un tipo de documento.");
                    guardar({ eventos: nuevos.length === TIPOS.length ? [] : nuevos });
                  }}
                />
                {TIPO_EVENTO_LABEL[t]}
              </label>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className={cn("space-y-4 p-5", cfg.modo !== "WEBHOOK" && "opacity-60")}>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Webhook (envío automático)</h2>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="erp-url">URL de tu ERP o integrador (HTTPS)</Label>
              <Input id="erp-url" value={url} placeholder="https://erp.tuempresa.com/procurex" onChange={(e) => setUrl(e.target.value)} />
            </div>
            <Button variant="outline" disabled={url === (cfg.webhookUrl ?? "")} onClick={() => guardar({ webhookUrl: url })}>Guardar</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Secreto de firma: {cfg.tieneSecreto ? "configurado" : "sin generar"}
            </span>
            <ConfirmDialog
              trigger={<Button size="sm" variant="outline">{cfg.tieneSecreto ? "Regenerar" : "Generar"}</Button>}
              title="Secreto de firma"
              description={cfg.tieneSecreto ? "El secreto actual deja de funcionar: tu ERP deberá usar el nuevo para verificar las firmas." : "Tu ERP lo usa para comprobar que cada envío viene de Procurex."}
              confirmLabel="Generar"
              onConfirm={async () => {
                try {
                  const s = await generarSecreto();
                  setRevelado({ titulo: "Secreto de firma", valor: s, nota: "Cópialo ahora: no se vuelve a mostrar. Tu receptor verifica la cabecera X-Procurex-Firma con él (HMAC-SHA256)." });
                  onCambio();
                } catch (err) {
                  toast.error(apiErrorMessage(err));
                }
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              disabled={!cfg.webhookUrl || !cfg.tieneSecreto || probando}
              onClick={async () => {
                setProbando(true);
                try {
                  const r = await probarConexion();
                  (r.ok ? toast.success : toast.error)(r.ok ? "Conexión correcta" : "La prueba falló", { description: r.mensaje });
                  onCambio();
                } catch (err) {
                  toast.error(apiErrorMessage(err));
                } finally {
                  setProbando(false);
                }
              }}
            >
              {probando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} Probar conexión
            </Button>
            {cfg.ultimaPrueba && (
              <span className={cn("text-xs", cfg.ultimaPruebaOk ? "text-success" : "text-destructive")}>
                {cfg.ultimaPruebaOk ? "✓" : "✗"} {new Date(cfg.ultimaPrueba).toLocaleString("es-CO")}: {cfg.ultimaPruebaMsg}
              </span>
            )}
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">API para que el ERP informe los pagos</h2>
          </div>
          <p className="text-sm text-muted-foreground">Cuando tesorería paga en el ERP, este llama a Procurex y el pago queda registrado (y el proveedor notificado) sin digitarlo.</p>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <span>API key: {cfg.apiKeyPrefijo ? <code>{cfg.apiKeyPrefijo}…</code> : "sin generar"}</span>
            <ConfirmDialog
              trigger={<Button size="sm" variant="outline">{cfg.apiKeyPrefijo ? "Regenerar" : "Generar"}</Button>}
              title="API key"
              description={cfg.apiKeyPrefijo ? "La key actual deja de funcionar de inmediato." : "El ERP la envía en la cabecera Authorization: Bearer …"}
              confirmLabel="Generar"
              onConfirm={async () => {
                try {
                  const k = await generarApiKey();
                  setRevelado({ titulo: "API key", valor: k, nota: "Cópiala ahora: no se vuelve a mostrar. Envíala como Authorization: Bearer <key>." });
                  onCambio();
                } catch (err) {
                  toast.error(apiErrorMessage(err));
                }
              }}
            />
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">Endpoints:</p>
            <code className="block break-all rounded bg-muted px-2 py-1">POST {API_BASE}/integraciones/erp/entrada/pagos</code>
            <code className="block break-all rounded bg-muted px-2 py-1">POST {API_BASE}/integraciones/erp/entrada/acuse</code>
            <p className="text-muted-foreground">Formatos, firma y ejemplos: guía de integración ERP (docs/INTEGRACION-ERP.md).</p>
          </div>
        </Card>
      </div>

      <Dialog open={!!revelado} onOpenChange={(o) => !o && setRevelado(null)}>
        {revelado && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{revelado.titulo}</DialogTitle>
              <DialogDescription>{revelado.nota}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-muted px-3 py-2 text-sm">{revelado.valor}</code>
              <Button size="icon" variant="outline" aria-label="Copiar" onClick={() => copiar(revelado.valor)}><Copy className="h-4 w-4" /></Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

// ------------------------------------------------------------------- Mapeos

function Mapeos() {
  const { data, loading, reload } = useApiData(fetchMapeos);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const k = (tipo: string, v: string) => `${tipo}|${v}`;
  const cambios = Object.entries(edit);

  async function guardar() {
    setGuardando(true);
    try {
      await guardarMapeos(cambios.map(([key, valorErp]) => {
        const [tipo, valorLocal] = key.split("|");
        return { tipo: tipo as "CENTRO_COSTO" | "CATEGORIA", valorLocal, valorErp };
      }));
      toast.success("Mapeos guardados", { description: "Los documentos nuevos ya los incluyen; reintenta los pendientes para actualizarlos." });
      setEdit({});
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  if (loading && !data) return <TableSkeleton />;
  const tabla = (titulo: string, desc: string, tipo: "CENTRO_COSTO" | "CATEGORIA", filas: Mapeo[], col: string) => (
    <Card className="p-5">
      <h2 className="font-semibold">{titulo}</h2>
      <p className="mb-3 text-sm text-muted-foreground">{desc}</p>
      {filas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay {tipo === "CENTRO_COSTO" ? "centros de costo" : "categorías"}.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr><th className="px-3 py-2 text-left font-medium">En Procurex</th><th className="px-3 py-2 text-left font-medium">{col}</th></tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const key = k(tipo, f.valorLocal);
                const valor = edit[key] ?? f.valorErp;
                return (
                  <tr key={key} className="border-t border-border">
                    <td className="px-3 py-2">
                      {tipo === "CENTRO_COSTO" ? <><span className="font-medium">{f.valorLocal}</span> <span className="text-muted-foreground">{f.nombre}</span></> : f.nombre}
                      {!f.activo && <span className="ml-1 text-xs text-muted-foreground">(inactivo)</span>}
                    </td>
                    <td className="px-3 py-2">
                      <Input className={cn("h-8 max-w-48", !valor && "border-dashed")} value={valor} maxLength={60} placeholder="Sin mapear" aria-label={`${col} para ${f.nombre}`} onChange={(e) => setEdit((m) => ({ ...m, [key]: e.target.value }))} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {tabla("Centros de costo", "El código que tiene cada centro en tu contabilidad.", "CENTRO_COSTO", data?.centros ?? [], "Código en el ERP")}
        {tabla("Categorías → cuenta contable", "La cuenta de gasto o inventario donde se causa cada categoría de compra.", "CATEGORIA", data?.categorias ?? [], "Cuenta contable")}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={guardar} disabled={cambios.length === 0 || guardando}>{guardando ? "Guardando..." : `Guardar ${cambios.length || ""} cambio(s)`}</Button>
        <p className="text-xs text-muted-foreground">Los proveedores se identifican por su NIT, que cada uno registra en su perfil.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------- Sincronización

function Sincronizacion({ onCambio }: { onCambio: () => void }) {
  const [estado, setEstado] = useState<"" | EstadoEventoErp>("");
  const [tipo, setTipo] = useState<"" | TipoEventoErp>("");
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApiData(() => fetchEventos({ estado: estado || undefined, tipo: tipo || undefined, page }), [estado, tipo, page]);
  const [detalle, setDetalle] = useState<(EventoErp & { payload: unknown }) | null>(null);

  async function accion(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast.success(ok);
      reload();
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <select aria-label="Estado" className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={estado} onChange={(e) => { setEstado(e.target.value as EstadoEventoErp | ""); setPage(1); }}>
          <option value="">Todos los estados</option>
          {(Object.keys(ESTADO_EVENTO_LABEL) as EstadoEventoErp[]).map((e) => <option key={e} value={e}>{ESTADO_EVENTO_LABEL[e]}</option>)}
        </select>
        <select aria-label="Tipo" className="rounded-md border border-input bg-white px-3 py-2 text-sm" value={tipo} onChange={(e) => { setTipo(e.target.value as TipoEventoErp | ""); setPage(1); }}>
          <option value="">Todos los documentos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{TIPO_EVENTO_LABEL[t]}</option>)}
        </select>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={reload}><RefreshCw className="h-4 w-4" /> Actualizar</Button>
      </div>
      {loading && !data ? (
        <TableSkeleton />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} title="Sin documentos en esta vista" description="Con la integración activa, cada orden firmada, recepción, factura aprobada y pago aparece aquí con su estado." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Documento</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium">En el ERP</th>
                <th className="p-3 font-medium">Última novedad</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.id} className="border-t border-border align-top">
                  <td className="p-3">
                    <button className="text-left font-medium text-primary hover:underline" onClick={async () => setDetalle(await fetchEvento(e.id))}>{e.referencia}</button>
                    <p className="text-xs text-muted-foreground">{TIPO_EVENTO_LABEL[e.tipo]}{e.version > 1 ? ` · versión ${e.version}` : ""}</p>
                  </td>
                  <td className="p-3"><EstadoErpBadge estado={e.estado} /></td>
                  <td className="p-3">{e.idExterno ? <code className="text-xs">{e.idExterno}</code> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="max-w-md p-3 text-xs">
                    {e.estado === "ENVIADO" && e.enviadoAt && <span className="text-muted-foreground">Sincronizado {new Date(e.enviadoAt).toLocaleString("es-CO")}</span>}
                    {e.estado === "PENDIENTE" && <span className="text-muted-foreground">En cola</span>}
                    {e.ultimoError && (e.estado === "ERROR" || e.estado === "FALLIDO") && (
                      <span className="text-destructive">
                        {e.ultimoError}
                        <span className="block text-muted-foreground">
                          {e.intentos} intento(s){e.estado === "ERROR" ? ` · próximo ${new Date(e.proximoIntento).toLocaleString("es-CO")}` : " · sin más reintentos automáticos"}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {e.estado !== "ENVIADO" && e.estado !== "DESCARTADO" && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => accion(() => reintentarEvento(e.id), "Reintentado")}>Reintentar</Button>
                        <ConfirmDialog
                          trigger={<Button size="sm" variant="ghost">Descartar</Button>}
                          title="Descartar"
                          description={`"${e.referencia}" deja de enviarse al ERP (por ejemplo, porque ya lo registraste a mano). Si el documento cambia, vuelve a la cola.`}
                          confirmLabel="Descartar"
                          onConfirm={() => accion(() => descartarEvento(e.id), "Descartado")}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.total > 0 && <PaginationBar page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} label="documentos" />}

      <Dialog open={!!detalle} onOpenChange={(o) => !o && setDetalle(null)}>
        {detalle && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{detalle.referencia}</DialogTitle>
              <DialogDescription>{TIPO_EVENTO_LABEL[detalle.tipo]} · versión {detalle.version} · lo que recibe el ERP en "datos"</DialogDescription>
            </DialogHeader>
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">{JSON.stringify(detalle.payload, null, 2)}</pre>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
