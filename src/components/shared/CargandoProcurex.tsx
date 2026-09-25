import { cn } from "@/lib/utils";
import animado from "@/assets/procurex-loader.webp";
import animadoOscuro from "@/assets/procurex-loader-oscuro.webp";
import estatico from "@/assets/procurex-loader-estatico.webp";
import estaticoOscuro from "@/assets/procurex-loader-estatico-oscuro.webp";

const TAMANOS = { sm: "h-10 w-10", md: "h-16 w-16", lg: "h-24 w-24" } as const;

interface Props {
  /** What is loading, read by screen readers and shown under the logo when `mostrarTexto`. */
  texto?: string;
  mostrarTexto?: boolean;
  tamano?: keyof typeof TAMANOS;
  /** Centers it in a tall area (a whole page or route). */
  pagina?: boolean;
  className?: string;
}

/**
 * The animated Procurex logo used wherever a page or panel is loading.
 * Dark mode swaps in the version with the light lower chevron; with reduced
 * motion it shows a still frame.
 */
export function CargandoProcurex({ texto = "Cargando", mostrarTexto = false, tamano = "md", pagina = false, className }: Props) {
  const img = (src: string, quieto: string, clase: string) => (
    <picture className={clase}>
      <source srcSet={quieto} media="(prefers-reduced-motion: reduce)" />
      <img src={src} alt="" className={cn(TAMANOS[tamano], "select-none")} draggable={false} />
    </picture>
  );
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-2", pagina ? "min-h-[60vh] p-6" : "py-10", className)}
    >
      {img(animado, estatico, "dark:hidden")}
      {img(animadoOscuro, estaticoOscuro, "hidden dark:block")}
      <span className={mostrarTexto ? "text-sm text-muted-foreground" : "sr-only"}>{texto}</span>
    </div>
  );
}
