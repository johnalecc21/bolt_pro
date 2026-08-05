import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, AlertTriangle, Download, Settings, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ofertasComparativo } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const criterios = [
  { key: "precio", label: "Precio total", prefix: "$", suffix: "" },
  { key: "plazo", label: "Plazo de entrega", prefix: "", suffix: " días" },
  { key: "calidad", label: "Calidad / Score", prefix: "", suffix: "" },
  { key: "pago", label: "Condiciones de pago", prefix: "", suffix: " días" },
];

export function CuadroComparativo() {
  const sorted = [...ofertasComparativo].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const minPrecio = Math.min(...ofertasComparativo.map((o) => o.precio));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuadro Comparativo de Ofertas</h1>
          <p className="text-sm text-muted-foreground">Comparativo generado automáticamente · RFP-2024-0032</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      {/* Ranking */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {sorted.slice(0, 3).map((o, i) => (
          <Card key={o.proveedor} className={cn(
            "relative overflow-hidden p-5",
            i === 0 && "ring-2 ring-primary"
          )}>
            {i === 0 && (
              <div className="absolute right-0 top-0 rounded-bl-lg gradient-brand px-3 py-1 text-xs font-bold text-white">
                MEJOR VALOR
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm",
                i === 0 ? "bg-warning/20 text-warning-foreground" :
                i === 1 ? "bg-muted text-muted-foreground" :
                "bg-orange-900/20 text-orange-700"
              )}>
                {i === 0 ? "1°" : i === 1 ? "2°" : "3°"}
              </div>
              <div>
                <p className="font-semibold text-sm">{o.proveedor}</p>
                <p className="text-xs text-muted-foreground">Score: {o.score}/100</p>
              </div>
              {i === 0 && <Trophy className="ml-auto h-5 w-5 text-warning" />}
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Precio</span><span className="font-medium">${o.precio.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plazo</span><span className="font-medium">{o.plazo} días</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pago</span><span className="font-medium">{o.pago} días</span></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Criterio</th>
                {ofertasComparativo.map((o) => (
                  <th key={o.proveedor} className="p-4 text-left text-sm font-medium">
                    {o.proveedor}
                    {o.proveedor === winner.proveedor && <Badge className="ml-2 bg-primary/10 text-primary text-[10px]">Ganador</Badge>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criterios.map((c) => {
                const values = ofertasComparativo.map((o) => o[c.key as keyof typeof o] as number);
                const best = c.key === "precio" || c.key === "plazo" || c.key === "pago" ? Math.min(...values) : Math.max(...values);
                return (
                  <tr key={c.key} className="border-b border-border">
                    <td className="p-4 text-sm font-medium">{c.label}</td>
                    {ofertasComparativo.map((o) => {
                      const val = o[c.key as keyof typeof o] as number;
                      const isBest = val === best;
                      const isAnomaly = c.key === "precio" && val > minPrecio * 1.2;
                      return (
                        <td key={o.proveedor} className={cn("p-4 text-sm", isBest && "bg-success/10 font-semibold text-success")}>
                          <span className="flex items-center gap-1">
                            {c.prefix}{val.toLocaleString()}{c.suffix}
                            {isAnomaly && (
                              <span title="Oferta atípica — 20% sobre el mínimo">
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                              </span>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="border-b border-border bg-muted/30">
                <td className="p-4 text-sm font-bold">Score Total</td>
                {ofertasComparativo.map((o) => (
                  <td key={o.proveedor} className={cn("p-4 text-lg font-bold", o.proveedor === winner.proveedor && "text-primary")}>
                    {o.score}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Benchmark */}
      <div className="rounded-lg bg-info/10 p-4 text-sm text-info">
        <strong>Benchmark de mercado:</strong> El precio de referencia para esta categoría en los últimos 6 meses es <strong>$172,000</strong> (promedio LATAM). La oferta de {winner.proveedor} está <strong className="text-success">2% por debajo</strong> del benchmark.
      </div>

      {/* Consultant Note */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">AC</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Ana Consultora</p>
              <Badge variant="secondary" className="text-[10px]">Consultora de sourcing</Badge>
              <span className="text-xs text-muted-foreground">Hace 1 h</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {winner.proveedor} ofrece el mejor balance precio-calidad. Su score de homologación (94) y 97% de entregas a tiempo refuerzan la recomendación. Sugiero proceder a adjudicación directa sin ronda de negociación — el margen de mejora es marginal.
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Link to="/cliente/negociacion">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" /> Iniciar negociación
          </Button>
        </Link>
        <Link to="/cliente/adjudicacion">
          <Button className="gradient-brand text-white gap-2">
            <ArrowRight className="h-4 w-4" /> Adjudicar directamente
          </Button>
        </Link>
      </div>
    </div>
  );
}
