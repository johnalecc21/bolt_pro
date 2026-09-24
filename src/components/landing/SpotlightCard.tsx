import { useRef, type ReactNode, type MouseEvent } from "react";
import { m, useMotionValue, useMotionTemplate } from "framer-motion";
import { cn } from "@/lib/utils";

export function SpotlightCard({
  children,
  className,
  spotlightColor = "var(--primary)",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useMotionValue(0);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const background = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, color-mix(in oklab, ${spotlightColor} 16%, transparent), transparent 75%)`;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => opacity.set(1)}
      onMouseLeave={() => opacity.set(0)}
      className={cn("group relative overflow-hidden", className)}
    >
      <m.div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
        style={{ background, opacity }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
