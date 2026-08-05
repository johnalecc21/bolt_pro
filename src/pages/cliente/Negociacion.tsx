import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, Eye, Handshake, Crown, Clock, Check, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const formatos = [
  { id: "subasta", title: "Subasta Inversa", icon: Gavel, desc: "Los proveedores ven su posición relativa en tiempo real y mejoran su oferta.", pros: "Mejor precio", cons: "Guerra de precios" },
  { id: "ciegas", title: "Ofertas Ciegas", icon: Eye, desc: "Cada proveedor presenta una única mejora sin ver el ranking.", pros: "Protege márgenes", cons: "Menor presión" },
  { id: "bilateral", title: "Negociación Bilateral", icon: Handshake, desc: "El consultor negocia 1 a 1 con los finalistas.", pros: "Relación a largo plazo", cons: "Más lento" },
];

const leaderboard = [
  { pos: 1, proveedor: "NovaTech", monto: 162000, cambio: -6000 },
  { pos: 2, proveedor: "CloudSphere", monto: 168000, cambio: -4000 },
  { pos: 3, proveedor: "AuditTrust", monto: 185000, cambio: -10000 },
];

export function Negociacion() {
  const [formato, setFormato] = useState("subasta");
  const [activa, setActiva] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Ronda de Negociación</h1>
        <p className="text-sm text-muted-foreground">RFP-2024-0032 · Segunda ronda</p>
      </div>

      {!activa ? (
        <>
          {/* Format selector */}
          <div>
            <h2 className="mb-3 text-sm font-medium">Selecciona el formato de negociación</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {formatos.map((f) => (
                <Card
                  key={f.id}
                  onClick={() => setFormato(f.id)}
                  className={cn(
                    "cursor-pointer p-5 transition-all hover:shadow-lg hover:-translate-y-0.5",
                    formato === f.id ? "ring-2 ring-primary bg-primary/5" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", formato === f.id ? "gradient-brand text-white" : "bg-muted text-muted-foreground")}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{f.desc}</p>
                  <div className="mt-3 flex gap-2 text-xs">
                    <span className="rounded-md bg-success/10 px-2 py-0.5 text-success">✓ {f.pros}</span>
                    <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-destructive">✗ {f.cons}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Config */}
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Configuración</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ventana de tiempo</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>30 minutos</option>
                  <option>1 hora</option>
                  <option>2 horas</option>
                  <option>24 horas</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Proveedores incluidos</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>3 finalistas</option>
                  <option>Todos los ofertantes</option>
                </select>
              </div>
            </div>
          </Card>

          <Button onClick={() => setActiva(true)} className="gradient-brand text-white">
            <Gavel className="mr-2 h-4 w-4" /> Iniciar ronda de negociación
          </Button>
        </>
      ) : (
        <>
          {/* Live view */}
          <Card className="overflow-hidden">
            <div className="gradient-hero p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Tiempo restante</p>
                  <p className="text-3xl font-bold">14:32</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                  </span>
                  <span className="text-sm font-medium">EN VIVO</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Leaderboard */}
          <div>
            <h2 className="mb-3 font-semibold">Leaderboard en vivo</h2>
            <div className="space-y-3">
              {leaderboard.map((item) => (
                <Card key={item.proveedor} className={cn("p-4 transition-all", item.pos === 1 && "ring-2 ring-warning")}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg",
                      item.pos === 1 ? "bg-warning/20 text-warning-foreground" :
                      item.pos === 2 ? "bg-muted text-muted-foreground" :
                      "bg-orange-900/20 text-orange-700"
                    )}>
                      {item.pos === 1 ? <Crown className="h-6 w-6" /> : `${item.pos}°`}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.proveedor}</p>
                      <p className="text-sm text-muted-foreground">Oferta actual: ${item.monto.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center gap-1 text-sm font-semibold text-success">
                        <TrendingUp className="h-3.5 w-3.5 rotate-180" /> -${Math.abs(item.cambio).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">vs. ronda 1</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Consultant */}
          <Card className="border-warning/30 bg-warning/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">AC</div>
              <div className="flex-1">
                <p className="text-sm font-medium">Recomendación de la consultora</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  NovaTech ya mejoró $6K. El margen de mejora restante es marginal (1-2%). Sugiero cerrar la ronda ahora para no dañar la relación con el proveedor.
                </p>
              </div>
              <Button onClick={() => setActiva(false)} className="gradient-success text-white">
                <Check className="mr-2 h-4 w-4" /> Cerrar ronda
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
