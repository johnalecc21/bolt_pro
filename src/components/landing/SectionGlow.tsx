export function SectionGlow({ variant = "default" }: { variant?: "default" | "reverse" }) {
  const positions =
    variant === "default"
      ? { a: "left-[-8%] top-[-10%]", b: "right-[-6%] top-[35%]", c: "left-[20%] bottom-[-15%]" }
      : { a: "right-[-8%] top-[-10%]", b: "left-[-6%] top-[30%]", c: "right-[15%] bottom-[-15%]" };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute ${positions.a} h-[26rem] w-[26rem] rounded-full bg-[oklch(0.55_0.13_246)]/[0.07] blur-3xl`} />
      <div className={`absolute ${positions.b} h-[22rem] w-[22rem] rounded-full bg-[oklch(0.62_0.12_195)]/[0.06] blur-3xl`} />
      <div className={`absolute ${positions.c} h-[20rem] w-[20rem] rounded-full bg-[oklch(0.5_0.14_225)]/[0.05] blur-3xl`} />
    </div>
  );
}
