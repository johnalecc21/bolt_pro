import { useAuth } from "@/lib/auth/AuthContext";
import type { Moneda } from "@/lib/moneda";

/** The active company's default currency — USD until the API reports one. */
export function useMonedaBase(): Moneda {
  const { activeCompany } = useAuth();
  return activeCompany?.monedaBase ?? "USD";
}
