import logoFull from "@/assets/procurex-logo.png";
import logoIcon from "@/assets/icon-procurex.png";

/** Full "ProcureX" wordmark. Has dark navy text — only use on light backgrounds. */
export function LogoFull({ className }: { className?: string }) {
  return <img src={logoFull} alt="Procurex" className={className} />;
}

/** Icon mark alone. Has a dark navy half — only use on light backgrounds (or wrap in a light chip on dark ones). */
export function LogoIcon({ className }: { className?: string }) {
  return <img src={logoIcon} alt="Procurex" className={className} />;
}
