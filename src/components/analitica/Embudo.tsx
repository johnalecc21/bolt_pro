import { Card } from "@/components/ui/card";
import type { EtapaEmbudo } from "@/lib/analitica/agregador";

/** Ordered stages → the validated ordinal ramp; each bar is labeled with its count and share (no hover needed). */
export function Embudo({
  etapas,
  titulo = "Embudo de procesos",
  descripcion = "Procesos creados en el período y hasta dónde llegaron.",
  vacio = "No se crearon procesos en este período.",
}: {
  etapas: EtapaEmbudo[];
  titulo?: string;
  descripcion?: string;
  vacio?: string;
}) {
  const base = etapas[0]?.procesos ?? 0;
  return (
    <Card className="gap-3 p-5">
      <div>
        <h3 className="font-semibold">{titulo}</h3>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </div>
      {base === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ol className="space-y-2">
          {etapas.map((e, i) => (
            <li key={e.etapa} className="grid grid-cols-[120px_1fr_96px] items-center gap-3 text-sm">
              <span className="text-muted-foreground">{e.etapa}</span>
              <div className="h-6 rounded-sm" style={{ background: "var(--viz-track)" }}>
                <div className="h-6 rounded-sm" style={{ width: `${Math.max(e.pct * 100, e.procesos ? 1.5 : 0)}%`, background: `var(--viz-ord-${i + 1})` }} />
              </div>
              <span className="text-right tabular-nums">
                <span className="font-medium">{e.procesos}</span>
                <span className="text-muted-foreground"> · {Math.round(e.pct * 100)}%</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
