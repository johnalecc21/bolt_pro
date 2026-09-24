import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, FilterX, Info, Loader2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { KpiTile } from "@/components/analitica/KpiTile";
import { GraficaGrupos } from "@/components/analitica/GraficaGrupos";
import { TablaSeccion } from "@/components/analitica/TablaSeccion";
import { Hallazgos } from "@/components/analitica/Hallazgos";
import { Embudo } from "@/components/analitica/Embudo";
import { useApiData } from "@/hooks/useApiData";
import { fetchDatosProveedor } from "@/lib/api/analiticaProveedor";
import { apiErrorMessage } from "@/lib/api/http";
import {
  agrupar,
  embudo,
  filtrar,
  METRICAS_PROVEEDOR,
  monedaPrincipal,
  opcionesFiltro,
  rangos,
  type DimensionProveedor,
  type MetricaProveedor,
} from "@/lib/analitica-proveedor/agregador";
import { construirInformeProveedor, documentoPdfProveedor } from "@/lib/analitica-proveedor/informe";
import { descargarSeccionCsv, generarExcel, generarPdf, textoCelda } from "@/lib/analitica/exportar";
import { PRESETS, rangoPreset, type PresetPeriodo } from "@/lib/analitica/periodo";
import { formatPct } from "@/lib/analitica/formato";
import { formatMoneyCompact, type Moneda } from "@/lib/moneda";

const select = "h-9 rounded-md border border-input bg-white px-3 text-sm dark:bg-transparent";

export function MiDesempeno() {
  const [preset, setPreset] = useState<PresetPeriodo>("12m");
  const [periodo, setPeriodo] = useState(() => rangoPreset("12m"));
  const [custom, setCustom] = useState(periodo);
  const [moneda, setMoneda] = useState<Moneda | null>(null);
  const [cliente, setCliente] = useState<string | undefined>();
  const [categoria, setCategoria] = useState<string | undefined>();
  const [exportando, setExportando] = useState<"pdf" | "excel" | null>(null);

  const { data: datos, loading, error } = useApiData(() => fetchDatosProveedor(periodo.desde, periodo.hasta), [periodo.desde, periodo.hasta]);

  const vista = useMemo(() => {
    if (!datos) return null;
    const m = moneda ?? monedaPrincipal(datos);
    const filtros = { moneda: m, cliente, categoria };
    const { actual } = rangos(datos);
    const d = filtrar(datos, filtros);
    const etiquetas = [cliente && `Cliente: ${cliente}`, categoria && `Categoría: ${categoria}`].filter(Boolean) as string[];
    const informe = construirInformeProveedor(datos, filtros, etiquetas);
    return { m, d, actual, informe, opciones: opcionesFiltro(datos), etapas: embudo(d, actual) };
  }, [datos, moneda, cliente, categoria]);

  function cambiarPreset(p: PresetPeriodo) {
    setPreset(p);
    if (p !== "personalizado") {
      const r = rangoPreset(p);
      setPeriodo(r);
      setCustom(r);
    }
  }

  async function exportar(tipo: "pdf" | "excel") {
    if (!vista) return;
    setExportando(tipo);
    try {
      const inf = vista.informe;
      if (tipo === "pdf") await generarPdf(documentoPdfProveedor(inf));
      else
        await generarExcel({
          titulo: "Informe de desempeño comercial",
          portada: [
            inf.proveedor,
            `Período: ${inf.periodo.desde} a ${inf.periodo.hasta} · montos en ${inf.moneda}`,
            `Comparado con: ${inf.periodo.desdeAnterior} a ${inf.periodo.desde}`,
            `Filtros: ${inf.filtros.length ? inf.filtros.join(" · ") : "ninguno"}`,
            `Generado: ${new Date(inf.generadoEn).toLocaleString("es-CO")}`,
          ],
          notas: inf.notas,
          secciones: inf.secciones,
          archivo: `mi-desempeno_${inf.periodo.desde}_${inf.periodo.hasta}.xlsx`,
        });
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo generar el archivo."));
    } finally {
      setExportando(null);
    }
  }

  const g = (m: MetricaProveedor, dim: DimensionProveedor) => (vista ? agrupar(vista.d, m, dim, vista.actual) : []);
  const val = (m: MetricaProveedor) => {
    const def = METRICAS_PROVEEDOR[m];
    return {
      etiqueta: def.etiqueta,
      formatear: (v: number, compacto: boolean) => textoCelda(v, def.formato, vista?.m ?? "USD", compacto),
      sumable: def.formato === "moneda" || def.formato === "entero",
    };
  };
  const sec = (id: string) => vista!.informe.secciones.find((s) => s.id === id)!;
  const csv = (id: string) => descargarSeccionCsv(sec(id), `${datos?.desde}_${datos?.hasta}`);
  const k = vista?.informe.kpis;
  const kp = vista?.informe.kpisAnterior;
  const cob = vista?.informe.cobros;
  const m = vista?.m ?? "USD";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mi desempeño</h1>
          <p className="text-sm text-muted-foreground">
            Ventas, competitividad, cumplimiento y cobros{datos && ` · ${datos.desde} a ${datos.hasta} · montos en ${m}`}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2" disabled={!vista || !!exportando}>
              {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exportando ? "Generando..." : "Exportar"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportar("pdf")}>
              <FileText className="mr-2 h-4 w-4" /> Informe (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportar("excel")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Datos completos (Excel)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="flex flex-row flex-wrap items-end gap-3 p-4">
        <div className="space-y-1">
          <label htmlFor="p-periodo" className="block text-xs font-medium text-muted-foreground">Período</label>
          <select id="p-periodo" className={select} value={preset} onChange={(e) => cambiarPreset(e.target.value as PresetPeriodo)}>
            {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.etiqueta}</option>)}
            <option value="personalizado">Personalizado…</option>
          </select>
        </div>
        {preset === "personalizado" && (
          <>
            <div className="space-y-1">
              <label htmlFor="p-desde" className="block text-xs font-medium text-muted-foreground">Desde</label>
              <Input id="p-desde" type="date" className="h-9 w-40" value={custom.desde} max={custom.hasta} onChange={(e) => setCustom((c) => ({ ...c, desde: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label htmlFor="p-hasta" className="block text-xs font-medium text-muted-foreground">Hasta</label>
              <Input id="p-hasta" type="date" className="h-9 w-40" value={custom.hasta} min={custom.desde} onChange={(e) => setCustom((c) => ({ ...c, hasta: e.target.value }))} />
            </div>
            <Button variant="outline" className="h-9" onClick={() => setPeriodo(custom)} disabled={!custom.desde || !custom.hasta || custom.desde > custom.hasta}>
              Aplicar
            </Button>
          </>
        )}
        {(vista?.opciones.monedas.length ?? 0) > 1 && (
          <div className="space-y-1">
            <label htmlFor="p-moneda" className="block text-xs font-medium text-muted-foreground">Moneda</label>
            <select id="p-moneda" className={select} value={m} onChange={(e) => setMoneda(e.target.value as Moneda)}>
              {vista!.opciones.monedas.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
        )}
        <div className="space-y-1">
          <label htmlFor="p-cliente" className="block text-xs font-medium text-muted-foreground">Cliente</label>
          <select id="p-cliente" className={select} value={cliente ?? ""} onChange={(e) => setCliente(e.target.value || undefined)}>
            <option value="">Todos</option>
            {vista?.opciones.clientes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="p-cat" className="block text-xs font-medium text-muted-foreground">Categoría</label>
          <select id="p-cat" className={select} value={categoria ?? ""} onChange={(e) => setCategoria(e.target.value || undefined)}>
            <option value="">Todas</option>
            {vista?.opciones.categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(cliente || categoria) && (
          <Button variant="ghost" className="h-9 gap-1.5" onClick={() => { setCliente(undefined); setCategoria(undefined); }}>
            <FilterX className="h-4 w-4" /> Limpiar
          </Button>
        )}
      </Card>

      {error && !datos ? (
        <Card className="p-6"><EmptyState icon={Info} title="No se pudo cargar tu desempeño" description={error} /></Card>
      ) : !vista || !k || !kp || !cob ? (
        <TableSkeleton rows={6} />
      ) : (
        <div className={loading ? "space-y-6 opacity-60 transition-opacity" : "space-y-6"}>
          <Tabs defaultValue="resumen" className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="ventas">Ventas</TabsTrigger>
                <TabsTrigger value="competitividad">Competitividad</TabsTrigger>
                <TabsTrigger value="cumplimiento">Cumplimiento</TabsTrigger>
                <TabsTrigger value="cobros">Cobros</TabsTrigger>
                <TabsTrigger value="detalle">Detalle</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="resumen" className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiTile titulo="Monto adjudicado" valor={formatMoneyCompact(k.adjudicado, m)} detalle={`${k.contratos} contrato(s) con ${k.clientesActivos} cliente(s)`} actual={k.adjudicado} anterior={kp.adjudicado} />
                <KpiTile titulo="Tasa de éxito" valor={formatPct(k.tasaExito, 0)} detalle={`${k.ganados} ganado(s) de ${k.ganados + k.perdidos} decidido(s)`} actual={k.tasaExito} anterior={kp.tasaExito} />
                <KpiTile titulo="Tasa de respuesta" valor={formatPct(k.tasaRespuesta, 0)} detalle={`${k.ofertasEnviadas} oferta(s) a ${k.invitaciones} invitación(es)`} actual={k.tasaRespuesta} anterior={kp.tasaRespuesta} />
                <KpiTile titulo="Brecha con el adjudicado" valor={formatPct(k.brechaPromedio)} detalle={k.posicionPromedio != null ? `Posición promedio ${textoCelda(k.posicionPromedio, "decimal", m)} en lo perdido` : "Solo donde el comprador lo comparte"} actual={k.brechaPromedio} anterior={kp.brechaPromedio} subirEsBueno={false} />
                <KpiTile titulo="Entrega a tiempo" valor={formatPct(k.entregaATiempo, 0)} detalle="Hitos cumplidos en la fecha pactada" actual={k.entregaATiempo} anterior={kp.entregaATiempo} />
                <KpiTile titulo="Evaluación promedio" valor={k.evaluacionPromedio != null ? `${Math.round(k.evaluacionPromedio)}/100` : "—"} detalle="Calidad, plazos, servicio y HSE" actual={k.evaluacionPromedio} anterior={kp.evaluacionPromedio} />
                <KpiTile titulo="Por cobrar" valor={formatMoneyCompact(cob.porCobrar, m)} detalle={`Vencido ${formatMoneyCompact(cob.vencido, m)} · próximos 30 días ${formatMoneyCompact(cob.proximos30, m)}`} actual={null} anterior={null} nota="A hoy" />
                <KpiTile titulo="Visitas a tu vitrina" valor={vista.informe.visitasVitrina.toLocaleString("es-CO")} detalle="Compradores que vieron tu perfil público" actual={null} anterior={null} nota="Total acumulado" />
              </div>
              <Hallazgos insights={vista.informe.insights} />
              <div className="grid gap-4 lg:grid-cols-2">
                <GraficaGrupos titulo="Monto adjudicado por mes" grupos={g("adjudicado", "mes")} valor={val("adjudicado")} moneda={m} dimension="Mes" />
                <Embudo etapas={vista.etapas} titulo="Embudo de invitaciones" descripcion="Invitaciones del período y hasta dónde llegaron." vacio="No recibiste invitaciones en este período." />
              </div>
            </TabsContent>

            <TabsContent value="ventas" className="space-y-4">
              <GraficaGrupos titulo="Monto adjudicado por mes" grupos={g("adjudicado", "mes")} valor={val("adjudicado")} moneda={m} dimension="Mes" />
              <div className="grid gap-4 lg:grid-cols-2">
                <GraficaGrupos titulo="Adjudicado por cliente" grupos={g("adjudicado", "cliente")} valor={val("adjudicado")} moneda={m} tipo="barrasHorizontales" dimension="Cliente" />
                <GraficaGrupos titulo="Adjudicado por categoría" grupos={g("adjudicado", "categoria")} valor={val("adjudicado")} moneda={m} tipo="barrasHorizontales" dimension="Categoría" />
                <GraficaGrupos titulo="Invitaciones por mes" grupos={g("invitaciones", "mes")} valor={val("invitaciones")} moneda={m} dimension="Mes" />
                <GraficaGrupos titulo="Procesos ganados por mes" grupos={g("ganados", "mes")} valor={val("ganados")} moneda={m} dimension="Mes" />
              </div>
              <TablaSeccion seccion={sec("clientes")} moneda={m} onExportarCsv={csv} />
              <TablaSeccion seccion={sec("categorias")} moneda={m} onExportarCsv={csv} />
              <TablaSeccion seccion={sec("mensual")} moneda={m} onExportarCsv={csv} />
            </TabsContent>

            <TabsContent value="competitividad" className="space-y-4">
              <div className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  Tu posición y la brecha con el precio adjudicado solo se muestran cuando el comprador decide compartirlas. Nunca verás el nombre del
                  ganador ni los precios de otros proveedores, y ellos tampoco verán los tuyos.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <GraficaGrupos titulo="Tasa de éxito por cliente" grupos={g("tasaExito", "cliente")} valor={val("tasaExito")} moneda={m} tipo="barrasHorizontales" dimension="Cliente" />
                <GraficaGrupos titulo="Tasa de éxito por categoría" grupos={g("tasaExito", "categoria")} valor={val("tasaExito")} moneda={m} tipo="barrasHorizontales" dimension="Categoría" />
                <GraficaGrupos titulo="Brecha promedio por categoría" descripcion="En lo perdido: cuánto por encima del adjudicado quedó tu precio" grupos={g("brechaPromedio", "categoria")} valor={val("brechaPromedio")} moneda={m} tipo="barrasHorizontales" dimension="Categoría" />
                <Embudo etapas={vista.etapas} titulo="Embudo de invitaciones" descripcion="Invitaciones del período y hasta dónde llegaron." vacio="No recibiste invitaciones en este período." />
              </div>
              <TablaSeccion seccion={sec("competitividad")} moneda={m} onExportarCsv={csv} buscable />
            </TabsContent>

            <TabsContent value="cumplimiento" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiTile titulo="Entrega a tiempo" valor={formatPct(k.entregaATiempo, 0)} actual={k.entregaATiempo} anterior={kp.entregaATiempo} />
                <KpiTile titulo="Evaluación promedio" valor={k.evaluacionPromedio != null ? `${Math.round(k.evaluacionPromedio)}/100` : "—"} actual={k.evaluacionPromedio} anterior={kp.evaluacionPromedio} />
                <KpiTile titulo="Contratos vigentes" valor={String(cob.contratosVigentes)} detalle={`${formatMoneyCompact(cob.montoVigente, m)} en ejecución`} actual={null} anterior={null} nota="A hoy" />
              </div>
              <GraficaGrupos titulo="Evaluación promedio por cliente" grupos={g("evaluacion", "cliente")} valor={val("evaluacion")} moneda={m} tipo="barrasHorizontales" dimension="Cliente" />
              <TablaSeccion seccion={sec("evaluaciones")} moneda={m} onExportarCsv={csv} />
              <TablaSeccion seccion={sec("vencimientos")} moneda={m} onExportarCsv={csv} />
            </TabsContent>

            <TabsContent value="cobros" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiTile titulo="Por cobrar" valor={formatMoneyCompact(cob.porCobrar, m)} actual={null} anterior={null} nota="A hoy" />
                <KpiTile titulo="Vencido" valor={formatMoneyCompact(cob.vencido, m)} detalle={`${cob.nVencidos} pago(s)`} actual={null} anterior={null} nota="A hoy" />
                <KpiTile titulo="Vence en 30 días" valor={formatMoneyCompact(cob.proximos30, m)} actual={null} anterior={null} nota="A hoy" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <GraficaGrupos titulo="Por cobrar por mes de vencimiento" grupos={g("porCobrar", "mes")} valor={val("porCobrar")} moneda={m} dimension="Mes" />
                <GraficaGrupos titulo="Por cobrar por cliente" grupos={g("porCobrar", "cliente")} valor={val("porCobrar")} moneda={m} tipo="barrasHorizontales" dimension="Cliente" />
              </div>
              <TablaSeccion seccion={sec("cobros")} moneda={m} onExportarCsv={csv} buscable />
            </TabsContent>

            <TabsContent value="detalle" className="space-y-4">
              <TablaSeccion seccion={sec("procesos")} moneda={m} onExportarCsv={csv} buscable maxFilas={500} />
              <p className="text-xs text-muted-foreground">{vista.informe.notas.join(" ")}</p>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
