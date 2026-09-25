import { useRef } from "react";
import { m, useScroll, useTransform, useReducedMotion } from "framer-motion";

type Orb = {
  size: number;
  top: string;
  left?: string;
  right?: string;
  color: string;
  parallax: number;
};

const presets: Record<"hero" | "default" | "reverse", Orb[]> = {
  hero: [
    {
      size: 260,
      top: "-8%",
      right: "6%",
      color: "var(--primary)",
      parallax: -60,
    },
    {
      size: 180,
      top: "55%",
      left: "2%",
      color: "var(--brand-accent)",
      parallax: 40,
    },
  ],
  default: [
    {
      size: 220,
      top: "5%",
      right: "-4%",
      color: "var(--brand-accent)",
      parallax: -50,
    },
    {
      size: 160,
      top: "60%",
      left: "-3%",
      color: "var(--primary)",
      parallax: 35,
    },
  ],
  reverse: [
    {
      size: 220,
      top: "0%",
      left: "-4%",
      color: "var(--primary)",
      parallax: -50,
    },
    {
      size: 160,
      top: "65%",
      right: "-3%",
      color: "var(--brand-accent)",
      parallax: 35,
    },
  ],
};

/** Soft, on-brand blurred circles that drift as the section scrolls past —
 * the "something moves" layer, kept light/restrained (not a full-bleed wash). */
export function FloatingOrbs({
  variant = "default",
}: {
  variant?: "hero" | "default" | "reverse";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const orbs = presets[variant];

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {orbs.map((o, i) => (
        <OrbShape
          key={i}
          orb={o}
          progress={scrollYProgress}
          reduceMotion={!!reduceMotion}
        />
      ))}
    </div>
  );
}

function OrbShape({
  orb,
  progress,
  reduceMotion,
}: {
  orb: Orb;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduceMotion: boolean;
}) {
  const y = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [-orb.parallax, orb.parallax],
  );
  return (
    <m.div
      style={{
        y,
        width: orb.size,
        height: orb.size,
        top: orb.top,
        left: orb.left,
        right: orb.right,
        background: orb.color,
      }}
      className="absolute rounded-full opacity-[0.07] blur-3xl"
    />
  );
}
