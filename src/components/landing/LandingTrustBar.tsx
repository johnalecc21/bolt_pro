import { motion } from "framer-motion";
import { Reveal, StaggerGroup, staggerItem, AnimatedCounter } from "./Reveal";

const companies = [
  "CloudSphere Technologies",
  "EcoPack Industrial",
  "LogiFleet LATAM",
  "AuditTrust Asociados",
  "NovaTech Consulting",
  "GlobalChem Supplies",
  "TalentHub Solutions",
  "SoftDesign Studio",
];

const stats = [
  { value: 42, suffix: "%", label: "Ahorro promedio certificado" },
  { value: 65, suffix: "%", label: "Menos tiempo de ciclo" },
  { value: 100, suffix: "%", label: "Trazabilidad de cada decisión" },
  { value: 24, suffix: "/7", label: "Compliance automatizado" },
];

export function LandingTrustBar() {
  const loop = [...companies, ...companies];
  return (
    <section className="border-y border-border bg-muted/40 py-14">
      <div className="mx-auto max-w-5xl px-6">
        <StaggerGroup className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <motion.div key={s.label} variants={staggerItem} className="flex flex-col items-center gap-1 text-center">
              <span className="text-3xl font-bold text-foreground sm:text-4xl">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>

      <Reveal className="mx-auto mt-14 max-w-3xl px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Con la confianza de equipos de compras en toda Latinoamérica
        </p>
      </Reveal>
      <div className="relative mt-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-muted/40 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-muted/40 to-transparent" />
        <motion.div
          className="flex w-max gap-12"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {loop.map((name, i) => (
            <span key={`${name}-${i}`} className="whitespace-nowrap text-lg font-semibold text-muted-foreground/50">
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
