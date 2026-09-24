import { m } from "framer-motion";
import { Crown, TrendingUp, ShieldCheck } from "lucide-react";
import { AnimatedCounter } from "./Reveal";

const rows = [
  { pos: 1, label: "CloudSphere Technologies", price: "$48.200", color: "oklch(0.46 0.14 246)" },
  { pos: 2, label: "NovaTech Consulting", price: "$49.850", color: "oklch(0.62 0.12 195)" },
  { pos: 3, label: "AuditTrust Asociados", price: "$51.100", color: "oklch(0.5 0.05 240)" },
];

export function LandingHeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0">
      <div className="absolute -inset-x-10 -inset-y-16 -z-10 bg-primary/[0.07] blur-3xl" />

      <m.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/[0.08]"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <span className="text-xs font-medium text-muted-foreground">Subasta en vivo · Ronda 2</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            En vivo
          </span>
        </div>
        <div className="mt-4 space-y-2.5">
          {rows.map((r, i) => (
            <m.div
              key={r.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
              className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: r.color }}
              >
                {r.pos}
              </span>
              <span className="flex-1 truncate text-sm font-medium">{r.label}</span>
              <span className="font-mono text-sm">{r.price}</span>
              {r.pos === 1 && <Crown className="h-4 w-4 shrink-0 text-warning" />}
            </m.div>
          ))}
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 0.9, duration: 0.5 },
          scale: { delay: 0.9, duration: 0.5 },
          y: { delay: 1.4, duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute -bottom-8 -left-8 z-20 w-52 rounded-xl border border-border bg-card p-4 shadow-xl shadow-primary/10 sm:-left-14"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="mt-2.5 text-2xl font-bold text-foreground">
          <AnimatedCounter value={42} suffix="%" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Ahorro vs. presupuesto</p>
      </m.div>

      <m.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{
          opacity: { delay: 1.1, duration: 0.5 },
          scale: { delay: 1.1, duration: 0.5 },
          y: { delay: 1.6, duration: 5.5, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute -right-4 -top-6 z-20 flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-2 pr-4 shadow-lg shadow-primary/10 sm:-right-10"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-medium text-foreground">OFAC/SDN verificado</span>
      </m.div>
    </div>
  );
}
