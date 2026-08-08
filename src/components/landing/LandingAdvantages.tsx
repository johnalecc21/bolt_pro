import { TrendingUp, ShieldCheck, Users2, Rocket, Lock, Eye } from "lucide-react";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const advantages = [
  {
    icon: TrendingUp,
    title: "Ahorro certificado y medible",
    description: "Cada negociación queda registrada con su línea base y ahorro real, listo para auditoría del CFO.",
    big: true,
  },
  {
    icon: ShieldCheck,
    title: "Compliance real, no simulado",
    description: "OCR y verificación OFAC/SDN contra datos reales, no una animación de carga.",
  },
  {
    icon: Users2,
    title: "Expertos humanos, human-in-the-loop",
    description: "Cada caso en zona gris pasa por revisión de nuestro equipo de compliance antes de avanzar.",
  },
  {
    icon: Rocket,
    title: "Implementación en días",
    description: "Sin integraciones eternas: tu equipo empieza a operar en la plataforma en cuestión de días.",
  },
  {
    icon: Lock,
    title: "Seguridad de nivel empresarial",
    description: "RBAC granular por rol y portal, autenticación con 2FA real y bitácora de auditoría de cada acción.",
  },
  {
    icon: Eye,
    title: "Trazabilidad de punta a punta",
    description: "De la solicitud a la firma, cada aprobación, comentario y cambio de estado queda registrado.",
  },
];

export function LandingAdvantages() {
  return (
    <section id="ventajas" className="mx-auto max-w-7xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-primary">Ventajas</span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Por qué los equipos de compras eligen ProcureOS</h2>
      </Reveal>

      <StaggerGroup className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {advantages.map((a) => (
          <motion.div
            key={a.title}
            variants={staggerItem}
            className={cn(
              "group rounded-2xl border border-border p-7 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
              a.big && "sm:col-span-2 lg:col-span-1 lg:row-span-2 gradient-brand text-white",
            )}
          >
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              a.big ? "bg-white/15" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors",
            )}>
              <a.icon className="h-5 w-5" />
            </div>
            <h3 className={cn("mt-5 text-lg font-semibold", a.big && "text-white")}>{a.title}</h3>
            <p className={cn("mt-2 text-sm", a.big ? "text-white/75" : "text-muted-foreground")}>{a.description}</p>
          </motion.div>
        ))}
      </StaggerGroup>
    </section>
  );
}
