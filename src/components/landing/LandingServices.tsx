import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  Gavel,
  ClipboardList,
  LineChart,
  Scale,
  FileCheck2,
  ShieldAlert,
  Crown,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "./Reveal";
import { FloatingOrbs } from "./FloatingOrbs";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 5200;

const services = [
  {
    key: "homologacion",
    icon: ShieldCheck,
    title: "Homologación y compliance",
    description: "Cada documento se lee y se cruza contra la lista OFAC/SDN de sanciones, en vivo.",
  },
  {
    key: "negociacion",
    icon: Gavel,
    title: "Negociación en vivo",
    description: "Leaderboard en tiempo real para tu equipo, posición anónima para cada proveedor.",
  },
  {
    key: "aprobaciones",
    icon: ClipboardList,
    title: "Aprobaciones inteligentes",
    description: "La matriz enruta cada requerimiento al aprobador correcto según monto y categoría.",
  },
  {
    key: "auditoria",
    icon: LineChart,
    title: "Auditoría de ahorro",
    description: "Ahorro certificado contra la línea base, listo para el reporte del CFO.",
  },
  {
    key: "disputas",
    icon: Scale,
    title: "Mediación de disputas",
    description: "Canal formal con seguimiento y soporte human-in-the-loop de nuestro equipo.",
  },
];

export function LandingServices() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % services.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reduceMotion, active]);

  function select(i: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setActive(i);
  }

  return (
    <section id="servicios" className="relative overflow-hidden py-28">
      <FloatingOrbs />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Todo el ciclo de compras, en un solo lugar</h2>
          <p className="mt-4 text-muted-foreground">Módulos diseñados para trabajar juntos, no herramientas aisladas.</p>
        </Reveal>

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-stretch">
          <div className="flex flex-col gap-2">
            {services.map((s, i) => (
              <button
                key={s.key}
                onClick={() => select(i)}
                className={cn(
                  "group relative flex items-start gap-4 rounded-xl px-4 py-4 text-left transition-colors",
                  active === i ? "bg-primary/5" : "hover:bg-muted/60",
                )}
              >
                {active === i && (
                  <m.div
                    layoutId="service-active-indicator"
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    active === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  <s.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className={cn("text-sm font-semibold transition-colors", active === i ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                    {s.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/[0.06]">
            {services.map((s, i) => (
              <div
                key={s.key}
                aria-hidden={active !== i}
                className={cn(
                  "absolute inset-0 transition-opacity duration-300 ease-out",
                  active === i ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                {s.key === "homologacion" && <HomologacionPreview />}
                {s.key === "negociacion" && <NegociacionPreview />}
                {s.key === "aprobaciones" && <AprobacionesPreview />}
                {s.key === "auditoria" && <AuditoriaPreview />}
                {s.key === "disputas" && <DisputasPreview />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col p-7">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted" />
          <span className="h-2 w-2 rounded-full bg-muted" />
          <span className="h-2 w-2 rounded-full bg-muted" />
        </div>
      </div>
      <div className="flex-1 pt-5">{children}</div>
    </div>
  );
}

function HomologacionPreview() {
  const docs = [
    { name: "RUT / NIT", state: "Validado" as const },
    { name: "Estados financieros", state: "Alerta OCR" as const },
    { name: "Certificado ISO 27001", state: "Validado" as const },
  ];
  return (
    <PreviewShell label="Homologación · Storage Test SAS">
      <div className="space-y-2.5">
        {docs.map((d, i) => (
          <m.div
            key={d.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
            className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5"
          >
            <span className="flex items-center gap-2.5 text-sm">
              <FileCheck2 className={cn("h-4 w-4", d.state === "Validado" ? "text-success" : "text-warning")} />
              {d.name}
            </span>
            <Badge variant={d.state === "Validado" ? "default" : "outline"} className={d.state !== "Validado" ? "border-warning/40 text-warning-foreground" : ""}>
              {d.state}
            </Badge>
          </m.div>
        ))}
      </div>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-6 flex items-center gap-2.5 rounded-lg bg-success/5 px-3.5 py-3 text-sm text-success"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
        Sin coincidencias en la lista OFAC/SDN
      </m.div>
    </PreviewShell>
  );
}

function NegociacionPreview() {
  const rows = [
    { pos: 1, label: "Proveedor A", price: "$48.200", color: "oklch(0.46 0.14 246)" },
    { pos: 2, label: "Proveedor B", price: "$49.850", color: "oklch(0.62 0.12 195)" },
    { pos: 3, label: "Proveedor C", price: "$51.100", color: "oklch(0.5 0.05 240)" },
  ];
  return (
    <PreviewShell label="Subasta en vivo · Ronda 2">
      <div className="mb-5 flex items-center gap-2 text-xs font-medium text-success">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        En vivo · cierra en 04:12
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <m.div
            key={r.label}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.35 }}
            className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: r.color }}
            >
              {r.pos}
            </span>
            <span className="flex-1 text-sm font-medium">{r.label}</span>
            <span className="font-mono text-sm">{r.price}</span>
            {r.pos === 1 && <Crown className="h-4 w-4 text-warning" />}
          </m.div>
        ))}
      </div>
    </PreviewShell>
  );
}

function AprobacionesPreview() {
  const steps = ["Comprador", "Aprobador", "CFO"];
  return (
    <PreviewShell label="Requerimiento REQ-0248 · $84.500">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <m.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.35, duration: 0.35 }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            >
              {i + 1}
            </m.div>
            {i < steps.length - 1 && (
              <m.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                style={{ originX: 0 }}
                transition={{ delay: 0.45 + i * 0.35, duration: 0.35 }}
                className="h-0.5 flex-1 bg-primary/40"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        {steps.map((s) => (
          <span key={s} className="w-9 text-center">{s}</span>
        ))}
      </div>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="mt-7 rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-sm text-muted-foreground"
      >
        Enrutado automáticamente a <span className="font-medium text-foreground">Aprobador CFO</span> por superar el umbral de categoría.
      </m.div>
    </PreviewShell>
  );
}

function AuditoriaPreview() {
  const bars = [38, 52, 44, 61, 58, 71];
  return (
    <PreviewShell label="Auditoría de ahorro · Últimos 6 meses">
      <div className="text-3xl font-bold text-primary">
        $142.800 <span className="text-sm font-normal text-muted-foreground">ahorrados vs. línea base</span>
      </div>
      <div className="mt-8 flex h-32 items-end gap-3">
        {bars.map((h, i) => (
          <m.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 rounded-t-md bg-gradient-to-t from-primary/70 to-primary"
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
        <ArrowUpRight className="h-3.5 w-3.5" /> +18% frente al trimestre anterior
      </div>
    </PreviewShell>
  );
}

function DisputasPreview() {
  return (
    <PreviewShell label="Disputa DSP-0031 · Retraso en entrega">
      <div className="space-y-3">
        {[
          { from: "Proveedor", text: "El retraso fue por un paro de transporte en la vía.", icon: MessageSquare },
          { from: "Compliance", text: "Solicitamos evidencia documental del hecho.", icon: ShieldAlert },
        ].map((msg, i) => (
          <m.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.15, duration: 0.4 }}
            className="flex gap-3 rounded-lg border border-border px-3.5 py-3"
          >
            <msg.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{msg.from}</p>
              <p className="mt-0.5 text-sm">{msg.text}</p>
            </div>
          </m.div>
        ))}
      </div>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-5"
      >
        <Badge variant="outline" className="border-info/40 text-info">En mediación</Badge>
      </m.div>
    </PreviewShell>
  );
}
