import { m } from "framer-motion";
import { Reveal, StaggerGroup, staggerItem, AnimatedCounter } from "./Reveal";

// What the product actually does on every process — no invented customer
// logos or savings figures until there are real, verifiable ones to show.
const controles = [
  "OFAC / SDN",
  "Lista consolidada ONU",
  "Procuraduría",
  "Contraloría",
  "Policía Nacional",
  "SARLAFT",
  "OCR de documentos",
  "Bitácora auditable",
];

const stats = [
  { value: 3, suffix: "", label: "Portales: comprador, proveedor y equipo interno" },
  { value: 13, suffix: "", label: "Documentos evaluados en la homologación" },
  { value: 6, suffix: "", label: "Monedas de la región soportadas" },
  { value: 100, suffix: "%", label: "Decisiones registradas en auditoría" },
];

export function LandingTrustBar() {
  const loop = [...controles, ...controles];
  return (
    <section className="border-y border-border bg-muted/40 py-14">
      <div className="mx-auto max-w-5xl px-6">
        <StaggerGroup className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <m.div key={s.label} variants={staggerItem} className="flex flex-col items-center gap-1 text-center">
              <span className="text-3xl font-bold text-foreground sm:text-4xl">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </m.div>
          ))}
        </StaggerGroup>
      </div>

      <Reveal className="mx-auto mt-14 max-w-3xl px-6 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Controles incluidos en cada homologación
        </p>
      </Reveal>
      <div className="relative mt-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-muted/40 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-muted/40 to-transparent" />
        <m.div
          className="flex w-max gap-12"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {loop.map((name, i) => (
            <span key={`${name}-${i}`} className="whitespace-nowrap text-lg font-semibold text-muted-foreground">
              {name}
            </span>
          ))}
        </m.div>
      </div>
    </section>
  );
}
