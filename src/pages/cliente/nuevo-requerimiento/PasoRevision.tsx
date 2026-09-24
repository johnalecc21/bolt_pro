import { formatMoney, type Moneda } from "@/lib/moneda";

interface Criterios {
  precio: number;
  tiempo: number;
  calidad: number;
  pago: number;
}

interface PasoRevisionProps {
  titulo: string;
  descripcion: string;
  categoria: string;
  presupuesto: string;
  moneda: Moneda;
  fechaLimite: string;
  criterios: Criterios;
  proveedoresSeleccionados: string[];
}

export function PasoRevision({ titulo, descripcion, categoria, presupuesto, moneda, fechaLimite, criterios, proveedoresSeleccionados }: PasoRevisionProps) {
  const filas: [string, string][] = [
    ["Título", titulo || "(sin definir)"],
    ["Descripción", descripcion || "(sin definir)"],
    ["Categoría", categoria],
    ["Prioridad", "Normal"],
    ["Presupuesto", presupuesto ? formatMoney(Number(presupuesto), moneda) : "(sin definir)"],
    ["Fecha requerida", fechaLimite || "(sin definir)"],
    ["Criterios", `Precio ${criterios.precio}% · Tiempo ${criterios.tiempo}% · Calidad ${criterios.calidad}% · Pago ${criterios.pago}%`],
    ["Proveedores preseleccionados", String(proveedoresSeleccionados.length)],
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Revisión final</h2>
      <div className="space-y-3 rounded-lg border border-border p-4">
        {filas.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm gap-4">
            <span className="shrink-0 text-muted-foreground">{k}</span>
            <span className="font-medium text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
