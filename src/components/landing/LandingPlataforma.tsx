import { useState, type ReactNode } from "react";
import { m } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDot,
  ClipboardList,
  Clock,
  Download,
  FileSignature,
  FileText,
  Gavel,
  MessageSquare,
  Network,
  Receipt,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

interface Etapa {
  id: string;
  icon: typeof ClipboardList;
  titulo: string;
  resumen: string;
  puntos: string[];
  vista: () => ReactNode;
}

const etapas: Etapa[] = [
  {
    id: "requerimiento",
    icon: ClipboardList,
    titulo: "Requerimiento y aprobación",
    resumen:
      "El área que necesita algo lo pide con ítems, cantidades y presupuesto.",
    puntos: [
      "Requerimiento por ítems, con especificaciones, adjuntos y presupuesto",
      "Matriz de aprobación por monto y categoría: cada solicitud llega al aprobador que corresponde",
      "Rechazo con comentarios y reenvío corregido, sin empezar de cero",
      "Prioridad y fechas límite visibles para compras desde el primer día",
    ],
    vista: VistaRequerimiento,
  },
  {
    id: "convocatoria",
    icon: Network,
    titulo: "Convocatoria",
    resumen:
      "Invitas a tus proveedores o abres el proceso a toda la red homologada.",
    puntos: [
      "Invita a proveedores homologados de la categoría o a tu lista corta",
      "Abre la convocatoria a la red y recibe ofertas de proveedores que no conocías",
      "Preguntas y respuestas dentro del proceso, visibles para todos los oferentes",
      "Tablero en vivo: quién vio la invitación, quién ya ofertó y cuánto falta para el cierre",
    ],
    vista: VistaConvocatoria,
  },
  {
    id: "comparativo",
    icon: Gavel,
    titulo: "Comparativo y negociación",
    resumen: "Todas las ofertas en el mismo formato, comparadas ítem por ítem.",
    puntos: [
      "Ofertas estructuradas: precio por ítem, plazo de entrega, condiciones de pago y garantía",
      "Cuadro comparativo automático que resalta la mejor opción de cada ítem",
      "Rondas de negociación o subasta inversa en vivo",
      "Cada proveedor solo ve su posición, nunca los precios de los demás",
    ],
    vista: VistaComparativo,
  },
  {
    id: "adjudicacion",
    icon: FileSignature,
    titulo: "Adjudicación y contrato",
    resumen: "Adjudicas a uno o a varios proveedores y el contrato sale listo.",
    puntos: [
      "Adjudicación por ítems a distintos proveedores en el mismo proceso",
      "Revisión legal obligatoria cuando el monto supera el umbral",
      "Contratos y órdenes de compra generados con tus plantillas y tu marca, en PDF",
      "Contratos marco con saldo disponible, órdenes de compra y versiones",
    ],
    vista: VistaAdjudicacion,
  },
  {
    id: "ejecucion",
    icon: Truck,
    titulo: "Entregas y pagos",
    resumen:
      "Sigues lo que se entrega y lo que se paga, conectado a tu contabilidad.",
    puntos: [
      "Hitos y entregas del contrato, con alertas antes de cada vencimiento",
      "Facturas del proveedor y registro de pagos contra cada orden",
      "Envío a tu ERP por archivo o webhook firmado, y conector nativo con Siigo",
      "El proveedor ve el estado de sus facturas y pagos en su portal",
    ],
    vista: VistaEjecucion,
  },
  {
    id: "analitica",
    icon: BarChart3,
    titulo: "Evaluación y analítica",
    resumen: "Cierras el ciclo midiendo al proveedor y el ahorro real.",
    puntos: [
      "Evaluación de desempeño del proveedor al cierre de cada contrato",
      "Ahorro contra el presupuesto aprobado, por categoría, centro de costo y proveedor",
      "Analítica para el CFO con gráficas guardadas y exportación a Excel y PDF",
      "El proveedor recibe retroalimentación para mejorar en el siguiente proceso",
    ],
    vista: VistaAnalitica,
  },
];

export function LandingPlataforma() {
  const [activa, setActiva] = useState(0);
  const etapa = etapas[activa];

  return (
    <section
      id="plataforma"
      className="relative border-y border-border bg-muted/40 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            La plataforma
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Cada etapa de la compra, resuelta en detalle
          </h2>
          <p className="mt-4 text-muted-foreground">
            Seis etapas conectadas: lo que se decide en una alimenta la
            siguiente, sin volver a digitar nada ni perder el rastro.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div
            role="tablist"
            aria-label="Etapas de la compra"
            aria-orientation="vertical"
            className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {etapas.map((e, i) => (
              <button
                key={e.id}
                id={`etapa-${e.id}`}
                type="button"
                role="tab"
                aria-selected={activa === i}
                aria-controls="panel-etapa"
                onClick={() => setActiva(i)}
                className={cn(
                  "group flex shrink-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors lg:w-full",
                  activa === i
                    ? "border-primary/30 bg-card shadow-md shadow-primary/[0.08]"
                    : "border-transparent hover:bg-card/70",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                    activa === i
                      ? "gradient-brand text-white"
                      : "bg-card text-muted-foreground ring-1 ring-border group-hover:text-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block whitespace-nowrap text-sm font-semibold lg:whitespace-normal",
                      activa !== i && "text-foreground/80",
                    )}
                  >
                    {e.titulo}
                  </span>
                  <span className="hidden text-xs text-muted-foreground lg:block">
                    {e.resumen}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div
            id="panel-etapa"
            role="tabpanel"
            aria-labelledby={`etapa-${etapa.id}`}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/[0.06]"
          >
            <m.div
              key={etapa.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <etapa.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Etapa {activa + 1} de {etapas.length}
                  </p>
                </div>
                <h3 className="mt-4 text-2xl font-bold tracking-tight">
                  {etapa.titulo}
                </h3>
                <p className="mt-2 text-muted-foreground">{etapa.resumen}</p>
                <ul className="mt-6 space-y-3">
                  {etapa.puntos.map((p) => (
                    <li key={p} className="flex gap-3 text-sm">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                {activa < etapas.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setActiva(activa + 1)}
                    className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    Siguiente: {etapas[activa + 1].titulo}{" "}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div
                aria-hidden="true"
                className="min-w-0 rounded-xl border border-border bg-background/60 p-4 sm:p-5"
              >
                <etapa.vista />
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Illustrations: what each stage looks like in the platform ---------- */

function Titulo({
  children,
  extra,
}: {
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <p className="text-xs font-semibold text-muted-foreground">{children}</p>
      {extra}
    </div>
  );
}

function Pastilla({
  children,
  tono = "muted",
}: {
  children: ReactNode;
  tono?: "muted" | "success" | "warning" | "info" | "primary";
}) {
  const tonos = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    info: "bg-info/10 text-info",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold",
        tonos[tono],
      )}
    >
      {children}
    </span>
  );
}

function VistaRequerimiento() {
  const items = [
    { d: 'Portátil 14" 16 GB', c: "40 u" },
    { d: "Base refrigerante", c: "40 u" },
    { d: "Garantía extendida 3 años", c: "40 u" },
  ];
  const cadena = [
    { rol: "Solicitante", estado: "Enviado", ok: true },
    { rol: "Jefe de área", estado: "Aprobado", ok: true },
    { rol: "CFO", estado: "Pendiente", ok: false },
  ];
  return (
    <div className="space-y-4">
      <div>
        <Titulo
          extra={<Pastilla tono="warning">Pendiente de aprobación</Pastilla>}
        >
          REQ-0248 · Tecnología
        </Titulo>
        <div className="divide-y divide-border rounded-lg border border-border bg-card text-xs">
          {items.map((i) => (
            <div key={i.d} className="flex justify-between gap-2 px-3 py-2">
              <span className="truncate">{i.d}</span>
              <span className="text-muted-foreground">{i.c}</span>
            </div>
          ))}
          <div className="flex justify-between px-3 py-2 font-semibold">
            <span>Presupuesto</span>
            <span className="font-mono">$186.000.000</span>
          </div>
        </div>
      </div>
      <div>
        <Titulo>Ruta de aprobación</Titulo>
        <div className="flex items-center">
          {cadena.map((p, i) => (
            <div key={p.rol} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1 text-center">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    p.ok
                      ? "bg-success text-white"
                      : "border-2 border-warning bg-card text-warning",
                  )}
                >
                  {p.ok ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="text-[11px] font-medium">{p.rol}</span>
                <span className="text-[10px] text-muted-foreground">
                  {p.estado}
                </span>
              </div>
              {i < cadena.length - 1 && (
                <span
                  className={cn(
                    "mx-1 mb-8 h-0.5 flex-1",
                    p.ok ? "bg-success/50" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 rounded-md bg-muted/70 px-2.5 py-2 text-[11px] text-muted-foreground">
          Supera $150.000.000 en Tecnología: la matriz exige aprobación del CFO.
        </p>
      </div>
    </div>
  );
}

function VistaConvocatoria() {
  const embudo = [
    { l: "Invitados", n: 8, w: "100%" },
    { l: "Vieron la invitación", n: 6, w: "75%" },
    { l: "Enviaron oferta", n: 4, w: "50%" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <Titulo extra={<Pastilla tono="info">Cierra en 2 d 4 h</Pastilla>}>
          Tablero en vivo
        </Titulo>
        <div className="space-y-2">
          {embudo.map((e) => (
            <div key={e.l}>
              <div className="flex justify-between text-[11px]">
                <span>{e.l}</span>
                <span className="font-semibold tabular-nums">{e.n}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full gradient-brand"
                  style={{ width: e.w }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-border bg-card p-2.5">
          <Users className="h-4 w-4 text-primary" />
          <p className="mt-1.5 font-semibold">5 de tu lista corta</p>
          <p className="text-muted-foreground">Invitados directamente</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <Network className="h-4 w-4 text-primary" />
          <p className="mt-1.5 font-semibold">3 desde la red</p>
          <p className="text-muted-foreground">Se unieron por categoría</p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3 text-[11px]">
        <p className="flex items-center gap-1.5 font-semibold">
          <MessageSquare className="h-3.5 w-3.5 text-primary" /> ¿Se acepta
          entrega en dos despachos?
        </p>
        <p className="mt-1 text-muted-foreground">
          Sí, siempre que el segundo llegue antes del 30 de noviembre.
        </p>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Respuesta visible para todos los oferentes
        </p>
      </div>
    </div>
  );
}

function VistaComparativo() {
  const filas = [
    {
      item: 'Portátil 14"',
      p: ["3.720.000", "3.890.000", "3.810.000"],
      mejor: 0,
    },
    { item: "Base refrigerante", p: ["95.000", "82.000", "99.000"], mejor: 1 },
    { item: "Garantía 3 años", p: ["260.000", "240.000", "310.000"], mejor: 1 },
  ];
  return (
    <div className="space-y-4">
      <div>
        <Titulo extra={<Pastilla tono="primary">Por ítem</Pastilla>}>
          Cuadro comparativo · precio unitario
        </Titulo>
        <div className="overflow-hidden rounded-lg border border-border bg-card text-[11px]">
          <div className="grid grid-cols-[1.3fr_repeat(3,1fr)] gap-1 border-b border-border bg-muted/60 px-2.5 py-2 font-semibold">
            <span>Ítem</span>
            <span className="text-right">Andinos</span>
            <span className="text-right">TecnoRed</span>
            <span className="text-right">Pacífico</span>
          </div>
          {filas.map((f) => (
            <div
              key={f.item}
              className="grid grid-cols-[1.3fr_repeat(3,1fr)] gap-1 border-b border-border px-2.5 py-2 last:border-0"
            >
              <span className="truncate">{f.item}</span>
              {f.p.map((p, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-right font-mono",
                    i === f.mejor &&
                      "rounded bg-success/10 font-semibold text-success",
                  )}
                >
                  {p}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Subasta inversa · ronda 2
          </span>
          <span className="font-mono text-muted-foreground">04:12</span>
        </div>
        <div className="mt-2.5 rounded-md bg-muted/70 px-2.5 py-2 text-[11px]">
          <p className="text-muted-foreground">Lo que ve el proveedor</p>
          <p className="mt-0.5 font-semibold">
            Tu posición: 2.º de 4 · mejora tu oferta para liderar
          </p>
        </div>
      </div>
    </div>
  );
}

function VistaAdjudicacion() {
  return (
    <div className="space-y-4">
      <div>
        <Titulo extra={<Pastilla tono="success">Revisión legal ✓</Pastilla>}>
          Adjudicación por ítems
        </Titulo>
        <div className="space-y-2 text-[11px]">
          {[
            { p: "Suministros Andinos", i: "Portátiles", v: "$148.800.000" },
            { p: "TecnoRed Colombia", i: "Bases y garantía", v: "$12.880.000" },
          ].map((a) => (
            <div
              key={a.p}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <CircleDot className="h-3.5 w-3.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.p}</p>
                <p className="text-muted-foreground">{a.i}</p>
              </div>
              <span className="font-mono">{a.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex h-14 w-11 shrink-0 flex-col justify-between rounded border border-border bg-background p-1.5">
          <span className="h-1.5 w-5 rounded-sm gradient-brand" />
          <span className="h-0.5 w-full rounded bg-border" />
          <span className="h-0.5 w-full rounded bg-border" />
          <span className="h-0.5 w-2/3 rounded bg-border" />
        </div>
        <div className="min-w-0 text-[11px]">
          <p className="flex items-center gap-1.5 font-semibold">
            <FileText className="h-3.5 w-3.5 text-primary" /> CT-0112 · Contrato
            de suministro.pdf
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Generado con tu plantilla y tu marca al confirmar la adjudicación.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3 text-[11px]">
        <div className="flex justify-between">
          <span className="font-semibold">Contrato marco · Papelería 2026</span>
          <span className="text-muted-foreground">3 órdenes</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div className="h-2 w-[32%] rounded-full gradient-brand" />
        </div>
        <p className="mt-1 text-muted-foreground">
          Saldo disponible $340.000.000 de $500.000.000
        </p>
      </div>
    </div>
  );
}

function VistaEjecucion() {
  const hitos = [
    { t: "Entrega 1 · 20 portátiles", e: "Recibida", tono: "success" as const },
    { t: "Entrega 2 · 20 portátiles", e: "En tránsito", tono: "info" as const },
    { t: "Factura FE-2231", e: "Aprobada", tono: "success" as const },
    { t: "Pago de $74.400.000", e: "Programado", tono: "warning" as const },
  ];
  return (
    <div className="space-y-4">
      <div>
        <Titulo>Seguimiento del contrato CT-0112</Titulo>
        <ol className="relative space-y-2.5 border-l border-border pl-4">
          {hitos.map((h) => (
            <li
              key={h.t}
              className="relative flex items-center justify-between gap-2 text-[11px]"
            >
              <span
                className={cn(
                  "absolute -left-[21px] h-2.5 w-2.5 rounded-full border-2 border-card",
                  h.tono === "success"
                    ? "bg-success"
                    : h.tono === "info"
                      ? "bg-info"
                      : "bg-warning",
                )}
              />
              <span>{h.t}</span>
              <Pastilla tono={h.tono}>{h.e}</Pastilla>
            </li>
          ))}
        </ol>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-border bg-card p-2.5">
          <Receipt className="h-4 w-4 text-primary" />
          <p className="mt-1.5 font-semibold">Siigo</p>
          <p className="text-muted-foreground">
            Factura de compra y egreso creados
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <Download className="h-4 w-4 text-primary" />
          <p className="mt-1.5 font-semibold">Tu ERP</p>
          <p className="text-muted-foreground">Webhook firmado entregado</p>
        </div>
      </div>
    </div>
  );
}

function VistaAnalitica() {
  const barras = [
    { c: "Tecnología", v: 82 },
    { c: "Servicios", v: 58 },
    { c: "Logística", v: 41 },
    { c: "Papelería", v: 24 },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] text-muted-foreground">
            Ahorro vs. presupuesto
          </p>
          <p className="text-xl font-bold text-success">11,8 %</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] text-muted-foreground">Procesos cerrados</p>
          <p className="text-xl font-bold">37</p>
        </div>
      </div>
      <div>
        <Titulo extra={<Pastilla>Excel · PDF</Pastilla>}>
          Ahorro por categoría (millones)
        </Titulo>
        <div className="space-y-1.5">
          {barras.map((b) => (
            <div key={b.c} className="flex items-center gap-2 text-[11px]">
              <span className="w-20 shrink-0 text-muted-foreground">{b.c}</span>
              <div className="h-2.5 flex-1 rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full gradient-brand"
                  style={{ width: `${b.v}%` }}
                />
              </div>
              <span className="w-6 text-right font-mono">{b.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3 text-[11px]">
        <p className="font-semibold">Evaluación · Suministros Andinos</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {[
            ["Calidad", "4,6"],
            ["Plazos", "4,2"],
            ["Servicio", "4,8"],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-muted-foreground">{l}</p>
              <p className="flex items-center gap-1 font-semibold">
                <Star className="h-3 w-3 fill-warning text-warning" /> {v}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
