import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, StaggerGroup, staggerItem } from "./Reveal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SectionGlow } from "./SectionGlow";

const plans = [
  {
    name: "Starter",
    price: "Desde US$490",
    period: "/mes",
    description: "Para equipos de compras que están dando el salto a un proceso digital.",
    features: [
      "Hasta 15 requerimientos activos",
      "Matriz de aprobación básica",
      "Homologación con OCR + OFAC",
      "1 portal de proveedores",
      "Soporte por correo",
    ],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "Desde US$1,290",
    period: "/mes",
    description: "El plan más elegido por equipos de compras con múltiples categorías activas.",
    features: [
      "Requerimientos ilimitados",
      "Negociación y subastas en vivo",
      "Matriz de aprobación avanzada",
      "Auditoría de ahorro para CFO",
      "Soporte prioritario + consultor asignado",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Personalizado",
    period: "",
    description: "Para operaciones multi-país con necesidades específicas de compliance.",
    features: [
      "Todo lo de Growth",
      "SSO empresarial y RBAC avanzado",
      "Múltiples empresas y unidades de negocio",
      "SLA dedicado y onboarding guiado",
      "Integración con tu ERP",
    ],
    highlighted: false,
  },
];

export function LandingPricing() {
  return (
    <section id="precios" className="relative overflow-hidden bg-muted/30 py-28">
      <SectionGlow />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">Precios</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Un plan para cada etapa de tu operación</h2>
          <p className="mt-4 text-muted-foreground">Sin permanencia mínima. Cambia de plan cuando tu operación lo necesite.</p>
        </Reveal>

        <StaggerGroup className="mt-16 grid gap-6 lg:grid-cols-3 lg:items-start">
          {plans.map((p) => (
            <motion.div key={p.name} variants={staggerItem}>
              <Card
                className={cn(
                  "relative flex h-full flex-col gap-6 p-8",
                  p.highlighted && "gradient-brand border-none text-white shadow-2xl shadow-primary/30 lg:-translate-y-3",
                )}
              >
                {p.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-primary hover:bg-white">Más elegido</Badge>
                )}
                <div>
                  <h3 className={cn("font-semibold", p.highlighted && "text-white")}>{p.name}</h3>
                  <p className={cn("mt-1 text-sm", p.highlighted ? "text-white/70" : "text-muted-foreground")}>{p.description}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className={cn("text-sm", p.highlighted ? "text-white/70" : "text-muted-foreground")}>{p.period}</span>
                </div>
                <ul className="flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={cn("mt-0.5 h-4 w-4 shrink-0", p.highlighted ? "text-white" : "text-primary")} />
                      <span className={p.highlighted ? "text-white/90" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={cn(
                    "w-full",
                    p.highlighted ? "bg-white text-primary hover:bg-white/90" : "gradient-brand text-white",
                  )}
                >
                  <a href="mailto:ventas@procureos.com?subject=Quiero%20una%20demo%20de%20ProcureOS">Hablar con ventas</a>
                </Button>
              </Card>
            </motion.div>
          ))}
        </StaggerGroup>

        <Reveal delay={0.2} className="mx-auto mt-10 max-w-xl text-center text-sm text-muted-foreground">
          ¿Eres proveedor y quieres ser parte de la red?{" "}
          <Link to="/proveedor/registro" className="font-medium text-primary hover:underline">
            Regístrate gratis
          </Link>
          .
        </Reveal>
      </div>
    </section>
  );
}
