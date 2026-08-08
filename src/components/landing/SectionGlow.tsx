export function SectionGlow({ variant = "default" }: { variant?: "default" | "reverse" }) {
  const flip = variant === "reverse";

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: [
          `radial-gradient(ellipse 60% 55% at ${flip ? "88% 0%" : "12% 0%"}, oklch(0.55 0.13 195 / 0.11), transparent 65%)`,
          `radial-gradient(ellipse 55% 55% at ${flip ? "6% 45%" : "94% 45%"}, oklch(0.5 0.16 246 / 0.08), transparent 65%)`,
          `radial-gradient(ellipse 55% 50% at ${flip ? "72% 100%" : "28% 100%"}, oklch(0.45 0.14 225 / 0.07), transparent 65%)`,
        ].join(", "),
      }}
    />
  );
}
