import { createContext, useContext, type ReactNode } from "react";

/**
 * True when a page is shown inside another one (a tab of the purchase
 * process, of Contratos, of the supplier's Procesos or Mi empresa): the host
 * already shows the title and the padding, so the page skips its own.
 */
const IncrustadoContext = createContext(false);

export function Incrustado({ children }: { children: ReactNode }) {
  return <IncrustadoContext.Provider value={true}>{children}</IncrustadoContext.Provider>;
}

export function useIncrustado(): boolean {
  return useContext(IncrustadoContext);
}
