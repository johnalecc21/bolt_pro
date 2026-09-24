import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, FilterX, Info, Loader2 } from "lucide-react";
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
import { PresupuestoCentros } from "@/components/analitica/PresupuestoCentros";
import { MisGraficas } from "@/components/analitica/MisGraficas";
import { useApiData } from "@/hooks/useApiData";
import { fetchDatosCfo } from "@/lib/api/analitica";
import {
  agrupar,
  concentracion,
  DIMENSIONES,
  embudo,
  excluidosPorMoneda,
  exposicion,
  filtrar,
  kpis,
  opcionesFiltro,
  presupuestoDelAnio,
  rangos,
  type Dimension,
  type Metrica,
} from "@/lib/analitica/agregador";
import { construirInforme } from "@/lib/analitica/informe";
import { exportarCsv, exportarExcel, exportarPdf } from "@/lib/analitica/exportar";
import { formatoValor, formatPct } from "@/lib/analitica/formato";
import { PRESETS, rangoPreset, type PresetPeriodo } from "@/lib/analitica/periodo";
import type { FiltrosCfo } from "@/lib/analitica/tipos";
import { formatMoney, formatMoneyCompact } from "@/lib/moneda";
import { apiErrorMessage } from "@/lib/api/http";

const select = "h-9 rounded-md border border-input bg-white px-3 text-sm dark:bg-transparent";

export function AnaliticaCFO() {
  const [preset, setPreset] = useState<PresetPeriodo>("6m");
  const [periodo, setPeriodo] = useState(() => rangoPreset("6m"));
  const [custom, setCustom] = useState(periodo);
  const [filtros, setFiltros] = useState<FiltrosCfo>({});
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);

  const { data: datos, loading, error } = useApiData(() => fetchDatosCfo(periodo.desde, periodo.hasta), [periodo.desde, periodo.hasta]);

  const vista = useMemo(() => {
    if (!datos) return null;
    const { actual, anterior } = rangos(datos);
    const d = filtrar(datos, filtros);
    const opciones = opcionesFiltro(datos);
    const etiquetas = [
      filtros.unidadId && `Unidad: ${opciones.unidades.find((u) => u.id === filtros.unidadId)?.nombre ?? ""}`,
      filtros.centroCostoId && `Centro: ${opciones.centros.find((c) => c.id === filtros.centroCostoId)?.nombre ?? ""}`,
      filtros.categoria && `Categoría: ${filtros.categoria}`,
    ].filter(Boolean) as string[];
    const anio = Number(datos.hasta.slice(0, 4));
    return {
      actual,
      anterior,
      d,
      opciones,
      anio,
      k: kpis(d, actual),
      kPrev: kpis(d, anterior),
      expo: exposicion(d),
      conc: concentracion(d, actual),
      excl: excluidosPorMoneda(d, actual),
      centros: presupuestoDelAnio(datos, filtros, anio),
      etapas: embudo(d, actual),
      informe: construirInforme(datos, filtros, etiquetas),
    };
  }, [datos, filtros]);

  function cambiarPreset(p: PresetPeriodo) {
    setPreset(p);
    if (p !== "personalizado") {
      const r = rangoPreset(p);
      setPeriodo(r);
      setCustom(r);
    }
  }

  async function exportar(tipo: "excel" | "pdf") {
    if (!vista) return;
    setExportando(tipo);
    try {
      if (tipo === "excel") await exportarExcel(vista.informe);
      else await exportarPdf(vista.informe);
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo generar el archivo."));
    } finally {
      setExportando(null);
    }
  }

  const g = (metrica: Metrica, dim: Dimension) => (vista ? agrupar(vista.d, metrica, dim, vista.actual) : []);
  const moneda = datos?.moneda ?? "USD";
  const hayFiltros = !!(filtros.unidadId || filtros.centroCostoId || filtros.categoria);
  const centrosVisibles = vista?.opciones.centros.filter((c) => !filtros.unidadId || c.unidadId === filtros.unidadId) ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analítica CFO</h1>
          <p className="text-sm text-muted-foreground">
            Gasto, ahorro, eficiencia, proveedores, presupuesto y pagos
            {datos && ` · ${datos.desde} a ${datos.hasta} · montos en ${datos.moneda}`}
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
              <FileText className="mr-2 h-4 w-4" /> Informe ejecutivo (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportar("excel")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Datos completos (Excel)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* One filter row scopes everything below it: KPIs, charts, tables and exports. */}
      <Card className="flex flex-row flex-wrap items-end gap-3 p-4">
        <div className="space-y-1">
          <label htmlFor="f-periodo" className="block text-xs font-medium text-muted-foreground">Período</label>
          <select id="f-periodo" className={select} value={preset} onChange={(e) => cambiarPreset(e.target.value as PresetPeriodo)}>
            {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.etiqueta}</option>)}
            <option value="personalizado">Personalizado…</option>
          </select>
        </div>
        {preset === "personalizado" && (
          <>
            <div className="space-y-1">
              <label htmlFor="f-desde" className="block text-xs font-medium text-muted-foreground">Desde</label>
              <Input id="f-desde" type="date" className="h-9 w-40" value={custom.desde} max={custom.hasta} onChange={(e) => setCustom((c) => ({ ...c, desde: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label htmlFor="f-hasta" className="block text-xs font-medium text-muted-foreground">Hasta</label>
              <Input id="f-hasta" type="date" className="h-9 w-40" value={custom.hasta} min={custom.desde} onChange={(e) => setCustom((c) => ({ ...c, hasta: e.target.value }))} />
            </div>
            <Button variant="outline" className="h-9" onClick={() => setPeriodo(custom)} disabled={!custom.desde || !custom.hasta || custom.desde > custom.hasta}>
              Aplicar
            </Button>
          </>
        )}
        <div className="space-y-1">
          <label htmlFor="f-unidad" className="block text-xs font-medium text-muted-foreground">Unidad de negocio</label>
          <select id="f-unidad" className={select} value={filtros.unidadId ?? ""} onChange={(e) => setFiltros((f) => ({ ...f, unidadId: e.target.value || undefined, centroCostoId: undefined }))}>
            <option value="">Todas</option>
            {vista?.opciones.unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="f-centro" className="block text-xs font-medium text-muted-foreground">Centro de costo</label>
          <select id="f-centro" className={select} value={filtros.centroCostoId ?? ""} onChange={(e) => setFiltros((f) => ({ ...f, centroCostoId: e.target.value || undefined }))}>
            <option value="">Todos</option>
            {centrosVisibles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="f-cat" className="block text-xs font-medium text-muted-foreground">Categoría</label>
          <select id="f-cat" className={select} value={filtros.categoria ?? ""} onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value || undefined }))}>
            <option value="">Todas</option>
            {vista?.opciones.categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {hayFiltros && (
          <Button variant="ghost" className="h-9 gap-1.5" onClick={() => setFiltros({})}>
            <FilterX className="h-4 w-4" /> Limpiar
          </Button>
        )}
      </Card>

      {error && !datos ? (
        <Card className="p-6"><EmptyState icon={Info} title="No se pudo cargar la analítica" description={error} /></Card>
      ) : !vista ? (
        <TableSkeleton rows={6} />
      ) : (
        // Refetches keep the previous render (dimmed) instead of flashing a skeleton.
        <div className={loading ? "space-y-6 opacity-60 transition-opacity" : "space-y-6"}>
          {(vista.excl.contratos > 0 || datos!.truncado) && (
            <div className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="space-y-1">
                {vista.excl.contratos > 0 && (
                  <p>
                    {vista.excl.contratos} contrato(s) en otra moneda no se suman a los montos en {moneda}:{" "}
                    {vista.excl.porMoneda.map((x) => formatMoney(x.monto, x.moneda)).join(", ")}.
                  </p>
                )}
                {datos!.truncado && <p>El período tiene más de 5.000 registros; se analizan los más recientes. Acota el período para verlo completo.</p>}
              </div>
            </div>
          )}

          <Tabs defaultValue="resumen" className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="gasto">Gasto</TabsTrigger>
                <TabsTrigger value="ahorro">Ahorro</TabsTrigger>
                <TabsTrigger value="eficiencia">Eficiencia</TabsTrigger>
                <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
                <TabsTrigger value="presupuesto">Presupuesto</TabsTrigger>
                <TabsTrigger value="pagos">Pagos</TabsTrigger>
                <TabsTrigger value="graficas">Mis gráficas</TabsTrigger>
                <TabsTrigger value="detalle">Detalle</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="resumen" className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiTile titulo="Gasto comprometido" valor={formatMoneyCompact(vista.k.gasto, moneda)} detalle={`${vista.k.contratos} contrato(s) · ${vista.k.proveedoresActivos} proveedor(es)`} actual={vista.k.gasto} anterior={vista.kPrev.gasto} subirEsBueno={false} />
                <KpiTile titulo="Ahorro vs. presupuesto" valor={formatMoneyCompact(vista.k.ahorro, moneda)} detalle={`${formatPct(vista.k.ahorroPct)} sobre ${formatMoneyCompact(vista.k.presupuestoAdjudicado, moneda)} presupuestados`} actual={vista.k.ahorro} anterior={vista.kPrev.ahorro} />
                <KpiTile titulo="Ahorro por negociación" valor={formatMoneyCompact(vista.k.ahorroNegociacion, moneda)} detalle={`${formatPct(vista.k.tasaNegociacion, 0)} de los procesos se negoció`} actual={vista.k.ahorroNegociacion} anterior={vista.kPrev.ahorroNegociacion} />
                <KpiTile titulo="Procesos adjudicados" valor={String(vista.k.procesosAdjudicados)} detalle={`${vista.k.procesosCreados} creado(s) en el período`} actual={vista.k.procesosAdjudicados} anterior={vista.kPrev.procesosAdjudicados} />
                <KpiTile titulo="Ciclo promedio" valor={vista.k.cicloDias != null ? `${formatoValor("cicloDias", vista.k.cicloDias, moneda)} días` : "—"} detalle={vista.k.cicloMediana != null ? `Mediana ${formatoValor("cicloDias", vista.k.cicloMediana, moneda)} días, de la solicitud al contrato` : "De la solicitud al contrato"} actual={vista.k.cicloDias} anterior={vista.kPrev.cicloDias} subirEsBueno={false} />
                <KpiTile titulo="Ofertas por proceso" valor={formatoValor("ofertasPromedio", vista.k.ofertasPromedio, moneda)} detalle="Competencia en lo adjudicado" actual={vista.k.ofertasPromedio} anterior={vista.kPrev.ofertasPromedio} />
                <KpiTile titulo="Entrega a tiempo" valor={formatPct(vista.k.entregaATiempo, 0)} detalle={vista.k.desempenoPromedio != null ? `Desempeño promedio ${vista.k.desempenoPromedio.toFixed(0)}/100` : "Hitos cumplidos en la fecha pactada"} actual={vista.k.entregaATiempo} anterior={vista.kPrev.entregaATiempo} />
                <KpiTile titulo="Pagos vencidos" valor={formatMoneyCompact(vista.expo.pagosVencidos, moneda)} detalle={`${vista.expo.nPagosVencidos} pago(s) · ${formatMoneyCompact(vista.expo.pagosPendientes, moneda)} por pagar en total`} actual={null} anterior={null} nota="A hoy" />
              </div>
              <Hallazgos insights={vista.informe.insights} />
              <div className="grid gap-4 lg:grid-cols-2">
                <GraficaGrupos titulo="Gasto comprometido por mes" grupos={g("gasto", "mes")} metrica="gasto" moneda={moneda} dimension="Mes" />
                <GraficaGrupos titulo="Ahorro por mes" descripcion="Presupuesto − precio final de lo firmado" grupos={g("ahorro", "mes")} metrica="ahorro" moneda={moneda} dimension="Mes" />
              </div>
            </TabsContent>

            <TabsContent value="gasto" className="space-y-4">
              <GraficaGrupos titulo="Gasto comprometido por mes" grupos={g("gasto", "mes")} metrica="gasto" moneda={moneda} dimension="Mes" />
              <div className="grid gap-4 lg:grid-cols-2">
                <GraficaGrupos titulo="Por categoría" grupos={g("gasto", "categoria")} metrica="gasto" moneda={moneda} tipo="barrasHorizontales" dimension="Categoría" />
                <GraficaGrupos titulo="Por centro de costo" grupos={g("gasto", "centroCosto")} metrica="gasto" moneda={moneda} tipo="barrasHorizontales" dimension="Centro de costo" />
                <GraficaGrupos titulo="Por unidad de negocio" grupos={g("gasto", "unidad")} metrica="gasto" moneda={moneda} tipo="barrasHorizontales" dimension="Unidad" />
                <GraficaGrupos titulo="Por trimestre" grupos={g("gasto", "trimestre")} metrica="gasto" moneda={moneda} dimension="Trimestre" />
              </div>
              <TablaSeccion seccion={seccion(vista.informe, "categorias")} informe={vista.informe} onExportarCsv={(id) => exportarCsv(vista.informe, id)} />
              <TablaSeccion seccion={seccion(vista.informe, "vencimientos")} informe={vista.informe} onExportarCsv={(id) => exportarCsv(vista.informe, id)} />
            </TabsContent>

            <TabsContent value="ahorro" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiTile titulo="Ahorro total" valor={formatMoneyCompact(vista.k.ahorro, moneda)} actual={vista.k.ahorro} anterior={vista.kPrev.ahorro} />
                <KpiTile titulo="Ahorro %" valor={formatPct(vista.k.ahorroPct)} actual={vista.k.ahorroPct} anterior={vista.kPrev.ahorroPct} />
                <KpiTile titulo="Por negociación en vivo" valor={formatMoneyCompact(vista.k.ahorroNegociacion, moneda)} actual={vista.k.ahorroNegociacion} anterior={vista.kPrev.ahorroNegociacion} />
              </div>
              <GraficaGrupos titulo="Ahorro por mes" grupos={g("ahorro", "mes")} metrica="ahorro" moneda={moneda} tipo="area" dimension="Mes" />
              <div className="grid gap-4 lg:grid-cols-2">
                <GraficaGrupos titulo="Ahorro % por categoría" grupos={g("ahorroPct", "categoria")} metrica="ahorroPct" moneda={moneda} tipo="barrasHorizontales" dimension="Categoría" />
                <GraficaGrupos titulo="Ahorro por solicitante" grupos={g("ahorro", "solicitante")} metrica="ahorro" moneda={moneda} tipo="barrasHorizontales" dimension="Solicitante" />
                <GraficaGrupos titulo="Ahorro por negociación, por categoría" grupos={g("ahorroNegociacion", "categoria")} metrica="ahorroNegociacion" moneda={moneda} tipo="barrasHorizontales" dimension="Categoría" />
                <GraficaGrupos titulo="Ahorro % por centro de costo" grupos={g("ahorroPct", "centroCosto")} metrica="ahorroPct" moneda={moneda} tipo="barrasHorizontales" dimension="Centro de costo" />
              </div>
              <TablaSeccion seccion={seccion(vista.informe, "mensual")} informe={vista.informe} onExportarCsv={(id) => exportarCsv(vista.informe, id)} />
            </TabsContent>

            <TabsContent value="eficiencia" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Embudo etapas={vista.etapas} />
                <GraficaGrupos titulo="Procesos creados por mes" grupos={g("procesosCreados", "mes")} metrica="procesosCreados" moneda={moneda} dimension="Mes" />
                <GraficaGrupos titulo="Ciclo promedio por categoría" descripcion="Días de la solicitud al contrato" grupos={g("cicloDias", "categoria")} metrica="cicloDias" moneda={moneda} tipo="barrasHorizontales" dimension="Categoría" />
                <GraficaGrupos titulo="Ofertas por proceso, por categoría" descripcion="Menos de 2 = poca competencia" grupos={g("ofertasPromedio", "categoria")} metrica="ofertasPromedio" moneda={moneda} tipo="barrasHorizontales" dimension="Categoría" />
                <GraficaGrupos titulo="Ciclo promedio por prioridad" grupos={g("cicloDias", "prioridad")} metrica="cicloDias" moneda={moneda} dimension="Prioridad" />
                <GraficaGrupos titulo="Procesos adjudicados por solicitante" grupos={g("procesosAdjudicados", "solicitante")} metrica="procesosAdjudicados" moneda={moneda} tipo="barrasHorizontales" dimension="Solicitante" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiTile titulo="Procesos con rechazo" valor={formatPct(vista.k.tasaRechazo, 0)} detalle="Devueltos al menos una vez por el aprobador" actual={vista.k.tasaRechazo} anterior={vista.kPrev.tasaRechazo} subirEsBueno={false} />
                <KpiTile titulo="Procesos negociados" valor={formatPct(vista.k.tasaNegociacion, 0)} actual={vista.k.tasaNegociacion} anterior={vista.kPrev.tasaNegociacion} />
                <KpiTile titulo="Entrega a tiempo" valor={formatPct(vista.k.entregaATiempo, 0)} actual={vista.k.entregaATiempo} anterior={vista.kPrev.entregaATiempo} />
              </div>
            </TabsContent>

            <TabsContent value="proveedores" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiTile titulo="Concentración (HHI)" valor={vista.conc.hhi.toLocaleString("es-CO")} detalle={`Dependencia ${vista.conc.nivel} · <1.500 baja, >2.500 alta`} actual={null} anterior={null} nota="Sobre el gasto del período" />
                <KpiTile titulo="Proveedor principal" valor={vista.conc.top1 ? formatPct(vista.conc.top1.share, 0) : "—"} detalle={vista.conc.top1?.nombre ?? "Sin gasto en el período"} actual={null} anterior={null} nota="Participación en el gasto" />
                <KpiTile titulo="Top 5 proveedores" valor={formatPct(vista.conc.top5Share, 0)} detalle="Del gasto comprometido" actual={null} anterior={null} nota="Participación en el gasto" />
                <KpiTile titulo="Proveedores con contrato" valor={String(vista.k.proveedoresActivos)} actual={vista.k.proveedoresActivos} anterior={vista.kPrev.proveedoresActivos} />
              </div>
              <GraficaGrupos titulo="Gasto por proveedor" grupos={g("gasto", "proveedor")} metrica="gasto" moneda={moneda} tipo="barrasHorizontales" dimension="Proveedor" />
              <TablaSeccion seccion={seccion(vista.informe, "proveedores")} informe={vista.informe} onExportarCsv={(id) => exportarCsv(vista.informe, id)} buscable />
            </TabsContent>

            <TabsContent value="presupuesto" className="space-y-4">
              <PresupuestoCentros centros={vista.centros} anio={vista.anio} />
              <TablaSeccion seccion={seccion(vista.informe, "centros")} informe={vista.informe} onExportarCsv={(id) => exportarCsv(vista.informe, id)} />
            </TabsContent>

            <TabsContent value="pagos" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiTile titulo="Por pagar" valor={formatMoneyCompact(vista.expo.pagosPendientes, moneda)} actual={null} anterior={null} nota="A hoy" />
                <KpiTile titulo="Vencidos" valor={formatMoneyCompact(vista.expo.pagosVencidos, moneda)} detalle={`${vista.expo.nPagosVencidos} pago(s)`} actual={null} anterior={null} nota="A hoy" />
                <KpiTile titulo="Vencen en 30 días" valor={formatMoneyCompact(vista.expo.pagosProximos30, moneda)} actual={null} anterior={null} nota="A hoy" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <GraficaGrupos titulo="Pagos pendientes por mes de vencimiento" grupos={g("pagosPendientes", "mes")} metrica="pagosPendientes" moneda={moneda} dimension="Mes" />
                <GraficaGrupos titulo="Pagos pendientes por proveedor" grupos={g("pagosPendientes", "proveedor")} metrica="pagosPendientes" moneda={moneda} tipo="barrasHorizontales" dimension="Proveedor" />
              </div>
              <TablaSeccion seccion={seccion(vista.informe, "pagos")} informe={vista.informe} onExportarCsv={(id) => exportarCsv(vista.informe, id)} buscable />
            </TabsContent>

            <TabsContent value="graficas">
              <MisGraficas d={vista.d} rango={vista.actual} />
            </TabsContent>

            <TabsContent value="detalle" className="space-y-4">
              <TablaSeccion seccion={seccion(vista.informe, "procesos")} informe={vista.informe} onExportarCsv={(id) => exportarCsv(vista.informe, id)} buscable maxFilas={500} />
              <p className="text-xs text-muted-foreground">
                {vista.informe.notas.join(" ")} Dimensiones disponibles para tus gráficas: {Object.values(DIMENSIONES).join(", ").toLowerCase()}.
              </p>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            Las variaciones comparan con {datos!.desdeAnterior} a {datos!.desde} (mismo número de días). Montos en {moneda}.
          </p>
        </div>
      )}
    </div>
  );
}

function seccion(informe: ReturnType<typeof construirInforme>, id: string) {
  return informe.secciones.find((s) => s.id === id)!;
}
