import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, BookOpenCheck, KeyRound, Loader2, PlugZap, RefreshCw, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api/http";
import {
  fetchCatalogosSiigo, probarConexion, sincronizarPagosSiigo,
  type CambiosIntegracion, type CatalogosSiigo, type ConfigSiigo, type IntegracionErp, type OpcionSiigo,
} from "@/lib/api/integraciones";

const SELECT = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60";

type Form = Required<Omit<ConfigSiigo, "usuario">>;

function inicial(c: ConfigSiigo): Form {
  return {
    documentoCompraId: c.documentoCompraId ?? null,
    formaPagoCompraId: c.formaPagoCompraId ?? null,
    cuentaDefecto: c.cuentaDefecto ?? "",
    impuestoId: c.impuestoId ?? null,
    documentoEgresoId: c.documentoEgresoId ?? null,
    formaPagoEgresoId: c.formaPagoEgresoId ?? null,
    descuentoProntoPagoId: c.descuentoProntoPagoId ?? null,
    departamento: c.departamento ?? "11",
    ciudad: c.ciudad ?? "11001",
    responsabilidadFiscal: c.responsabilidadFiscal ?? "R-99-PN",
    pagosDesde: c.pagosDesde ?? "PROCUREX",
  };
}

/** A select over a Siigo catalog; before loading it shows the saved id. */
function SelectSiigo({
  id, label, valor, opciones, vacio, onChange, ayuda,
}: {
  id: string;
  label: string;
  valor: number | null;
  opciones: OpcionSiigo[] | undefined;
  vacio: string;
  onChange: (v: number | null) => void;
  ayuda?: string;
}) {
  const lista = opciones ?? (valor ? [{ id: valor, nombre: `Guardado (id ${valor})` }] : []);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={SELECT} value={valor ?? ""} disabled={!opciones && !valor} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
        <option value="">{opciones ? vacio : "Carga los catálogos de Siigo"}</option>
        {lista.map((o) => (
          <option key={o.id} value={o.id}>{o.codigo ? `${o.codigo} · ${o.nombre}` : o.nombre}</option>
        ))}
      </select>
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

/**
 * Native Siigo Nube connector settings: API credentials, then how invoices
 * and payments are booked, picked from the company's own Siigo catalogs.
 */
export function ConexionSiigo({ cfg, guardar, onCambio }: {
  cfg: IntegracionErp;
  guardar: (cambios: CambiosIntegracion, ok?: string) => Promise<boolean>;
  onCambio: () => void;
}) {
  const [usuario, setUsuario] = useState(cfg.siigo.usuario ?? "");
  const [accessKey, setAccessKey] = useState("");
  const [form, setForm] = useState<Form>(() => inicial(cfg.siigo));
  const [catalogos, setCatalogos] = useState<CatalogosSiigo | null>(null);
  const [cargando, setCargando] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const cambiado = JSON.stringify(form) !== JSON.stringify(inicial(cfg.siigo));
  const credCambiada = usuario.trim() !== (cfg.siigo.usuario ?? "") || accessKey.trim() !== "";

  async function guardarCredenciales() {
    const ok = await guardar(
      { siigo: { usuario: usuario.trim() }, ...(accessKey.trim() ? { siigoAccessKey: accessKey.trim() } : {}) },
      "Credenciales de Siigo guardadas",
    );
    if (ok) setAccessKey("");
  }

  async function probarYCargar() {
    setCargando(true);
    try {
      const r = await probarConexion();
      (r.ok ? toast.success : toast.error)(r.ok ? "Conectado a Siigo" : "No se pudo conectar", { description: r.mensaje });
      if (r.ok) setCatalogos(await fetchCatalogosSiigo());
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }

  async function leerPagos() {
    setLeyendo(true);
    try {
      const r = await sincronizarPagosSiigo();
      toast.success(r.pagadas ? `${r.pagadas} pago(s) registrados desde Siigo` : "Sin pagos nuevos en Siigo", {
        description: `${r.revisadas} factura(s) revisadas.${r.errores.length ? ` Errores: ${r.errores.join(" · ")}` : ""}`,
      });
      onCambio();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLeyendo(false);
    }
  }

  const descuentos = catalogos?.descuentosEgreso.filter((d) => !form.documentoEgresoId || d.documentoId === form.documentoEgresoId);

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-semibold">Credenciales de la API de Siigo</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          El usuario y la access key de la API los genera el administrador de tu cuenta de Siigo Nube. La key se guarda cifrada y no se vuelve a mostrar.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="siigo-usuario">Usuario de la API</Label>
            <Input id="siigo-usuario" value={usuario} autoComplete="off" placeholder="api@tuempresa.com" onChange={(e) => setUsuario(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="siigo-key">Access key</Label>
            <Input id="siigo-key" type="password" autoComplete="new-password" value={accessKey} placeholder={cfg.siigoTieneCredencial ? "•••••••• guardada (escribe para cambiarla)" : "Pega la access key"} onChange={(e) => setAccessKey(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={!credCambiada || !usuario.trim()} onClick={guardarCredenciales}>Guardar credenciales</Button>
          <Button className="gap-2" disabled={!cfg.siigo.usuario || !cfg.siigoTieneCredencial || cargando} onClick={probarYCargar}>
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PlugZap className="h-4 w-4" aria-hidden="true" />} Probar y cargar catálogos
          </Button>
          {cfg.ultimaPrueba && (
            <span className={cn("text-xs", cfg.ultimaPruebaOk ? "text-success" : "text-destructive")}>
              {cfg.ultimaPruebaOk ? "✓" : "✗"} {new Date(cfg.ultimaPrueba).toLocaleString("es-CO")}: {cfg.ultimaPruebaMsg}
            </span>
          )}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-semibold">Cómo se registra en Siigo</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Cada proveedor se crea como tercero (si su NIT no existe) y cada factura aprobada como factura de compra, con la cuenta de su categoría (pestaña Mapeos) o la cuenta por defecto.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectSiigo id="siigo-fc" label="Tipo de factura de compra" valor={form.documentoCompraId} opciones={catalogos?.documentosCompra} vacio="Elige el comprobante FC" onChange={(v) => set("documentoCompraId", v)} />
          <SelectSiigo id="siigo-fp" label="Forma de pago de la factura" valor={form.formaPagoCompraId} opciones={catalogos?.formasPagoCompra} vacio="Elige (p. ej. crédito proveedores)" onChange={(v) => set("formaPagoCompraId", v)} ayuda="La factura queda como cuenta por pagar con el vencimiento pactado." />
          <div className="space-y-1.5">
            <Label htmlFor="siigo-cuenta">Cuenta contable por defecto</Label>
            <Input id="siigo-cuenta" inputMode="numeric" value={form.cuentaDefecto ?? ""} maxLength={20} placeholder="p. ej. 51559501" onChange={(e) => set("cuentaDefecto", e.target.value.replace(/\D/g, ""))} />
            <p className="text-xs text-muted-foreground">Se usa cuando la categoría no tiene cuenta mapeada.</p>
          </div>
          <SelectSiigo id="siigo-iva" label="IVA de las facturas" valor={form.impuestoId} opciones={catalogos?.impuestos.map((t) => ({ id: t.id, nombre: t.nombre }))} vacio="Sin IVA (el valor no se discrimina)" onChange={(v) => set("impuestoId", v)} ayuda="El valor facturado se toma con IVA incluido y Siigo lo separa." />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="siigo-depto">Departamento (DANE)</Label>
            <Input id="siigo-depto" inputMode="numeric" value={form.departamento} maxLength={2} onChange={(e) => set("departamento", e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="siigo-ciudad">Ciudad (DANE)</Label>
            <Input id="siigo-ciudad" inputMode="numeric" value={form.ciudad} maxLength={5} onChange={(e) => set("ciudad", e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="siigo-resp">Responsabilidad fiscal</Label>
            <Input id="siigo-resp" value={form.responsabilidadFiscal} maxLength={20} onChange={(e) => set("responsabilidadFiscal", e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Ciudad y responsabilidad se usan solo al crear terceros nuevos (Bogotá 11 / 11001 por defecto); luego puedes completarlos en Siigo.</p>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-semibold">Pagos</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Dónde se registran los pagos">
          {([
            ["PROCUREX", "Los registro en Procurex", "Procurex crea el comprobante de egreso contra la factura en Siigo."],
            ["SIIGO", "Los hago en Siigo", "Procurex lee cada 10 minutos las facturas saldadas y las marca pagadas."],
          ] as const).map(([v, titulo, desc]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={form.pagosDesde === v}
              onClick={() => set("pagosDesde", v)}
              className={cn("rounded-lg border p-3 text-left text-sm transition-colors", form.pagosDesde === v ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}
            >
              <p className="font-medium">{titulo}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
        {form.pagosDesde === "PROCUREX" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectSiigo id="siigo-rp" label="Tipo de comprobante de egreso" valor={form.documentoEgresoId} opciones={catalogos?.documentosEgreso} vacio="Elige el comprobante RP" onChange={(v) => set("documentoEgresoId", v)} />
            <SelectSiigo id="siigo-banco" label="Cuenta o forma de pago del egreso" valor={form.formaPagoEgresoId} opciones={catalogos?.formasPagoEgreso} vacio="Elige el banco o caja" onChange={(v) => set("formaPagoEgresoId", v)} />
            <SelectSiigo id="siigo-desc" label="Descuento por pronto pago (opcional)" valor={form.descuentoProntoPagoId} opciones={descuentos} vacio="Sin descuento configurado" onChange={(v) => set("descuentoProntoPagoId", v)} ayuda="Sin él, un pago con descuento deja ese saldo abierto en Siigo." />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="gap-2" disabled={leyendo || !cfg.activa || cfg.modo !== "SIIGO" || cfg.siigo.pagosDesde !== "SIIGO"} onClick={leerPagos}>
              {leyendo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />} Leer pagos ahora
            </Button>
            <span className="text-xs text-muted-foreground">Disponible con la integración activa y esta opción guardada.</span>
          </div>
        )}
      </Card>

      {cfg.siigoFaltantes.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" aria-hidden="true" />
          <span>Para activar falta: {cfg.siigoFaltantes.join(", ")}.</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!cambiado} onClick={() => guardar({ siigo: { ...form, cuentaDefecto: form.cuentaDefecto || null } }, "Configuración de Siigo guardada")}>Guardar configuración</Button>
        {cambiado && <Button variant="ghost" onClick={() => setForm(inicial(cfg.siigo))}>Deshacer</Button>}
      </div>
    </div>
  );
}
