import { ClipboardList, ShieldCheck, Gavel, PenLine, LineChart, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";
import { motion } from "framer-motion";

const services = [
  {
    icon: ClipboardList,
    title: "Requerimientos y aprobaciones",
    description: "Flujo estructurado desde la necesidad hasta la licitación, con matriz de aprobación configurable por monto y categoría.",
  },
  {
    icon: ShieldCheck,
    title: "Homologación y compliance",
    description: "Verificación real de documentos con OCR y cruce automático contra la lista OFAC/SDN de sanciones internacionales.",
  },
  {
    icon: Gavel,
    title: "Negociación y subastas en vivo",
    description: "Rondas de negociación en tiempo real con visibilidad controlada: tu equipo ve todo, cada proveedor solo su posición.",
  },
  {
    icon: PenLine,
    title: "Adjudicación y firma electrónica",
    description: "Cierre del proceso con trazabilidad total y firma electrónica integrada al flujo de adjudicación.",
  },
  {
    icon: LineChart,
    title: "Auditoría de ahorro y analítica",
    description: "Reportes para el CFO con ahorro certificado, comparativos históricos y exportación de datos en un clic.",
  },
  {
    icon: Scale,
    title: "Mediación de disputas",
    description: "Canal formal de disputas con seguimiento y soporte human-in-the-loop de nuestro equipo de consultoría.",
  },
];

export function LandingServices() {
  return (
    <section id="servicios" className="bg-muted/30 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">Servicios</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Todo el ciclo de compras, en un solo lugar</h2>
          <p className="mt-4 text-muted-foreground">Módulos diseñados para trabajar juntos, no herramientas aisladas.</p>
        </Reveal>

        <StaggerGroup className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <motion.div key={s.title} variants={staggerItem}>
              <Card className="group h-full p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </Card>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
