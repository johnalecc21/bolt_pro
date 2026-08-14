import { Link } from "react-router-dom";
import { Building2, Truck, Users2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";
import { motion } from "framer-motion";

const portals = [
  {
    icon: Building2,
    title: "Portal Cliente",
    description: "Gestiona todo el ciclo de compras de tu empresa: requerimientos, licitaciones, negociación y contratos.",
    to: "/cliente/login",
  },
  {
    icon: Truck,
    title: "Portal Proveedores",
    description: "Homologa tu empresa, recibe invitaciones a licitar, cotiza y da seguimiento a tus procesos.",
    to: "/proveedor/login",
  },
  {
    icon: Users2,
    title: "Panel Interno",
    description: "Herramientas de consultoría, compliance y soporte human-in-the-loop para el equipo de Procurex.",
    to: "/interno/login",
  },
];

export function LandingPortals() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">Acceso a la plataforma</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Elige tu portal para comenzar</h2>
        </Reveal>

        <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-3">
          {portals.map((p) => (
            <motion.div key={p.title} variants={staggerItem}>
              <Link to={p.to} className="group block h-full">
                <Card className="flex h-full flex-col items-start gap-4 p-7 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                  <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary">
                    Ingresar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Card>
              </Link>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
