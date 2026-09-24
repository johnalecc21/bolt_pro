import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { GraficaGrupos } from "@/components/analitica/GraficaGrupos";
import { agrupar, DIMENSIONES, dimensionesDe, METRICAS, type DatosFiltrados, type Dimension, type Metrica, type Rango } from "@/lib/analitica/agregador";
import { crearGrafica, eliminarGrafica, fetchGraficas, type GraficaGuardada, type TipoGrafica } from "@/lib/api/analitica";
import { apiErrorMessage } from "@/lib/api/http";
import { useApiData } from "@/hooks/useApiData";
import { LineChart } from "lucide-react";

const TIPOS: Record<TipoGrafica, string> = {
  barras: "Barras",
  barrasHorizontales: "Barras horizontales",
  lineas: "Líneas",
  area: "Área",
};

const esTiempo = (d: Dimension) => d === "mes" || d === "trimestre";

/** Any metric × any dimension, saved per user (server-side) and recomputed with the current filters. */
export function MisGraficas({ d, rango }: { d: DatosFiltrados; rango: Rango }) {
  const { data: graficas, loading, reload } = useApiData(fetchGraficas);
  const [open, setOpen] = useState(false);
  const [metrica, setMetrica] = useState<Metrica>("gasto");
  const [dimension, setDimension] = useState<Dimension>("proveedor");
  const [tipo, setTipo] = useState<TipoGrafica>("barrasHorizontales");
  const [titulo, setTitulo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const dims = dimensionesDe(metrica);
  const tiposValidos: TipoGrafica[] = esTiempo(dimension) ? ["barras", "lineas", "area"] : ["barras", "barrasHorizontales"];
  const tipoEfectivo = tiposValidos.includes(tipo) ? tipo : tiposValidos[0];
  const tituloSugerido = `${METRICAS[metrica].etiqueta} por ${DIMENSIONES[dimension].toLowerCase()}`;

  async function guardar() {
    setGuardando(true);
    try {
      await crearGrafica({ titulo: titulo.trim() || tituloSugerido, metrica, dimension, tipo: tipoEfectivo });
      toast.success("Gráfica guardada");
      setOpen(false);
      setTitulo("");
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo guardar la gráfica."));
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(g: GraficaGuardada) {
    try {
      await eliminarGrafica(g.id);
      reload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "No se pudo eliminar."));
    }
  }

  const select = "h-9 w-full rounded-md border border-input bg-white px-3 text-sm dark:bg-transparent";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Arma tus propias gráficas cruzando cualquier indicador con cualquier dimensión. Se guardan en tu cuenta y siguen los filtros de arriba.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nueva gráfica</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Nueva gráfica</DialogTitle>
              <DialogDescription>Elige qué medir, cómo agruparlo y el tipo de gráfica. La vista previa usa los filtros actuales.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="g-metrica">Indicador</Label>
                <select id="g-metrica" className={select} value={metrica} onChange={(e) => {
                  const m = e.target.value as Metrica;
                  setMetrica(m);
                  if (!dimensionesDe(m).includes(dimension)) setDimension("mes");
                }}>
                  {(Object.keys(METRICAS) as Metrica[]).map((m) => <option key={m} value={m}>{METRICAS[m].etiqueta}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-dim">Agrupar por</Label>
                <select id="g-dim" className={select} value={dimension} onChange={(e) => setDimension(e.target.value as Dimension)}>
                  {dims.map((dm) => <option key={dm} value={dm}>{DIMENSIONES[dm]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-tipo">Tipo</Label>
                <select id="g-tipo" className={select} value={tipoEfectivo} onChange={(e) => setTipo(e.target.value as TipoGrafica)}>
                  {tiposValidos.map((t) => <option key={t} value={t}>{TIPOS[t]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="g-titulo">Título</Label>
                <Input id="g-titulo" placeholder={tituloSugerido} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} />
              </div>
            </div>
            <GraficaGrupos
              titulo={titulo.trim() || tituloSugerido}
              grupos={agrupar(d, metrica, dimension, rango)}
              metrica={metrica}
              moneda={d.moneda}
              tipo={tipoEfectivo}
              dimension={DIMENSIONES[dimension]}
              alto={220}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar gráfica"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? null : !graficas?.length ? (
        <Card className="p-6">
          <EmptyState icon={LineChart} title="Aún no tienes gráficas propias" description="Crea una con “Nueva gráfica”: por ejemplo, ahorro % por solicitante o pagos pendientes por proveedor." />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {graficas.map((g) => (
            <GraficaGrupos
              key={g.id}
              titulo={g.titulo}
              descripcion={`${METRICAS[g.metrica]?.etiqueta ?? g.metrica} · ${DIMENSIONES[g.dimension] ?? g.dimension}`}
              grupos={agrupar(d, g.metrica, g.dimension, rango)}
              metrica={g.metrica}
              moneda={d.moneda}
              tipo={g.tipo}
              dimension={DIMENSIONES[g.dimension] ?? g.dimension}
              acciones={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => borrar(g)} aria-label={`Eliminar ${g.titulo}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
