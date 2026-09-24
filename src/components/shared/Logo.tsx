// Pre-sized WebP copies (~5 KB each) of the PNG masters in this folder, which
// weigh 380 KB / 92 KB and are only kept as the source artwork.
import logoFull from "@/assets/procurex-logo.webp";
import logoIcon from "@/assets/icon-procurex.webp";
import { cn } from "@/lib/utils";

/** Full "ProcureX" wordmark. Has dark navy text — only use on light backgrounds. */
export function LogoFull({ className }: { className?: string }) {
  return <img src={logoFull} alt="Procurex" width={216} height={72} decoding="async" className={cn("w-auto", className)} />;
}

/** Icon mark alone. Has a dark navy half — only use on light backgrounds (or wrap in a light chip on dark ones). */
export function LogoIcon({ className }: { className?: string }) {
  return <img src={logoIcon} alt="Procurex" width={128} height={128} decoding="async" className={cn("w-auto", className)} />;
}
