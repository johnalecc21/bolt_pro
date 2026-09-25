import { useMemo, useRef } from "react";
import { m, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function BlurText({
  text,
  className,
  delay = 60,
  highlightFrom,
  highlightClassName = "text-primary",
}: {
  text: string;
  className?: string;
  delay?: number;
  highlightFrom?: number;
  /** Color of the highlighted words (defaults to the brand primary). */
  highlightClassName?: string;
}) {
  const words = useMemo(() => text.split(" "), [text]);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span ref={ref} className={cn("inline-flex flex-wrap", className)}>
      {words.map((word, i) => (
        <m.span
          key={i}
          className={cn(
            "inline-block will-change-[filter,transform,opacity]",
            highlightFrom !== undefined &&
              i >= highlightFrom &&
              highlightClassName,
          )}
          initial={{ filter: "blur(10px)", opacity: 0, y: 14 }}
          animate={inView ? { filter: "blur(0px)", opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.5,
            delay: (i * delay) / 1000,
            ease: easeOut,
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </m.span>
      ))}
    </span>
  );
}
