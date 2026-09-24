import { useMemo, useState } from "react";
import { ArrowDownUp, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { textoCelda } from "@/lib/analitica/exportar";
import type { Seccion } from "@/lib/analitica/informe";
import type { Moneda } from "@/lib/moneda";
import { cn } from "@/lib/utils";

interface Props {
  seccion: Seccion;
  moneda: Moneda;
  onExportarCsv: (id: string) => void;
  buscable?: boolean;
  maxFilas?: number;
}

/** A report section rendered as a sortable table — the same rows the Excel/CSV/PDF exports contain. */
export function TablaSeccion({ seccion, moneda, onExportarCsv, buscable = false, maxFilas = 200 }: Props) {
  const [orden, setOrden] = useState<{ col: number; asc: boolean } | null>(null);
  const [q, setQ] = useState("");

  const filas = useMemo(() => {
    let f = seccion.filas.map((fila, i) => ({ fila, i }));
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      f = f.filter(({ fila }) => fila.some((v) => typeof v === "string" && v.toLowerCase().includes(t)));
    }
    if (orden) {
      f = [...f].sort((a, b) => {
        const x = a.fila[orden.col];
        const y = b.fila[orden.col];
        if (x == null) return 1;
        if (y == null) return -1;
        const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return orden.asc ? cmp : -cmp;
      });
    }
    return f;
  }, [seccion, orden, q]);

  const tipo = (fila: number, col: number) =>
    seccion.tipoPorFila && col > 0 && col < seccion.columnas.length - 1 ? seccion.tipoPorFila[fila] : seccion.columnas[col].tipo;

  return (
    <Card className="gap-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{seccion.titulo}</h3>
          {seccion.descripcion && <p className="text-sm text-muted-foreground">{seccion.descripcion}</p>}
        </div>
        <div className="flex items-center gap-2">
          {buscable && <Input className="h-8 w-48" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Buscar en ${seccion.titulo}`} />}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onExportarCsv(seccion.id)} disabled={!seccion.filas.length}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>
      {seccion.filas.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sin registros en este período.</p>
      ) : (
        <div className="max-h-[480px] overflow-auto rounded-md border border-border">
          <table className="w-full min-w-max text-sm">
            <thead className="sticky top-0 z-10 bg-muted text-xs text-muted-foreground">
              <tr>
                {seccion.columnas.map((c, j) => (
                  <th key={c.titulo} className={cn("px-3 py-2 font-medium", c.tipo === "texto" || c.tipo === "fecha" ? "text-left" : "text-right")}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => setOrden((o) => ({ col: j, asc: o?.col === j ? !o.asc : c.tipo === "texto" }))}
                    >
                      {c.titulo}
                      <ArrowDownUp className={cn("h-3 w-3", orden?.col === j ? "opacity-100" : "opacity-30")} aria-hidden />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.slice(0, maxFilas).map(({ fila, i }) => (
                <tr key={i} className="border-t border-border hover:bg-muted/30">
                  {fila.map((v, j) => (
                    <td key={j} className={cn("whitespace-nowrap px-3 py-1.5", seccion.columnas[j].tipo === "texto" || seccion.columnas[j].tipo === "fecha" ? "" : "text-right tabular-nums")}>
                      {textoCelda(v, tipo(i, j), moneda)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filas.length > maxFilas && (
        <p className="text-xs text-muted-foreground">Mostrando {maxFilas} de {filas.length}. Descarga el CSV o el Excel para verlos todos.</p>
      )}
    </Card>
  );
}
