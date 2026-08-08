import { motion } from "framer-motion";
import { Reveal } from "./Reveal";

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

export function LandingTrustBar() {
  const loop = [...companies, ...companies];
  return (
    <section className="border-y border-border bg-muted/40 py-10">
      <Reveal className="mx-auto max-w-3xl px-6 text-center">
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
