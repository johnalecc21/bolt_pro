import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { TrendingUp, ShieldCheck, Users2, Rocket, Lock, Eye, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "./Reveal";
import { SectionGlow } from "./SectionGlow";
import { cn } from "@/lib/utils";

export function LandingAdvantages() {
  return (
    <section id="ventajas" className="relative overflow-hidden py-28">
      <SectionGlow variant="reverse" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Por qué los equipos de compras eligen Procurex</h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3 md:[grid-auto-rows:minmax(200px,auto)]">
          <SavingsCell />
          <ComplianceCell />
          <ExpertsCell />
          <SecurityCell />
          <SpeedCell />
          <TraceabilityCell />
        </div>
      </div>
    </section>
  );
}

function CellShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border p-7 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function SavingsCell() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduceMotion = useReducedMotion();
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    let start: number | null = null;
    function step(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / 1400, 1);
      setPct(Math.floor((1 - Math.pow(1 - progress, 3)) * 42));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <CellShell className="gradient-brand md:col-span-2 md:row-span-2 border-none text-white">
      <div ref={ref} className="flex h-full flex-col justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <div className="text-5xl font-bold tabular-nums">+{pct}%</div>
          <h3 className="mt-3 text-lg font-semibold">Ahorro certificado y medible</h3>
          <p className="mt-2 max-w-sm text-sm text-white/75">
            Cada negociación queda registrada con su línea base y ahorro real, listo para auditoría del CFO.
          </p>
          <svg viewBox="0 0 280 60" className="mt-6 w-full max-w-xs" fill="none">
            <motion.path
              d="M2 48 C 40 44, 60 50, 90 36 S 150 18, 180 22 S 230 8, 278 4"
              stroke="white"
              strokeOpacity="0.85"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={reduceMotion ? { duration: 0 } : { duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </svg>
        </div>
      </div>
    </CellShell>
  );
}

function ComplianceCell() {
  return (
    <CellShell>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">Compliance real, no simulado</h3>
      <p className="mt-2 text-sm text-muted-foreground">OCR y verificación OFAC/SDN contra datos reales.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1 border-success/40 text-success">
          <CheckCircle2 className="h-3 w-3" /> OFAC/SDN
        </Badge>
        <Badge variant="outline" className="gap-1 border-success/40 text-success">
          <CheckCircle2 className="h-3 w-3" /> OCR
        </Badge>
      </div>
    </CellShell>
  );
}

function ExpertsCell() {
  return (
    <CellShell>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Users2 className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">Expertos humanos, human-in-the-loop</h3>
      <p className="mt-2 text-sm text-muted-foreground">Cada caso en zona gris pasa por revisión de nuestro equipo antes de avanzar.</p>
    </CellShell>
  );
}

function SecurityCell() {
  const roles = [
    { label: "Comprador", active: false },
    { label: "Aprobador CFO", active: true },
    { label: "Admin Cliente", active: false },
  ];
  return (
    <CellShell className="md:col-span-2">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="mt-5 text-lg font-semibold">Seguridad de nivel empresarial</h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">RBAC granular por rol y portal, 2FA real y bitácora de auditoría.</p>
        </div>
        <div className="hidden shrink-0 flex-col gap-2 sm:flex">
          {roles.map((r) => (
            <div
              key={r.label}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium",
                r.active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
              )}
            >
              {r.label}
            </div>
          ))}
        </div>
      </div>
    </CellShell>
  );
}

function SpeedCell() {
  return (
    <CellShell>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Rocket className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">Implementación en días</h3>
      <p className="mt-2 text-sm text-muted-foreground">Sin integraciones eternas: tu equipo opera en cuestión de días.</p>
    </CellShell>
  );
}

function TraceabilityCell() {
  const events = [
    { time: "09:14", text: "Requerimiento aprobado por Aprobador CFO" },
    { time: "11:02", text: "Oferta seleccionada, adjudicación iniciada" },
    { time: "11:03", text: "Contrato firmado electrónicamente" },
  ];
  return (
    <CellShell className="md:col-span-3">
      <div className="flex items-start gap-6">
        <div className="shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Eye className="h-5 w-5" />
          </div>
          <h3 className="mt-5 text-lg font-semibold">Trazabilidad de punta a punta</h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">De la solicitud a la firma, cada acción queda registrada.</p>
        </div>
        <div className="flex-1 space-y-3 border-l border-border pl-6">
          {events.map((e) => (
            <div key={e.text} className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {e.time}
              </span>
              <span className="text-foreground">{e.text}</span>
            </div>
          ))}
        </div>
      </div>
    </CellShell>
  );
}
