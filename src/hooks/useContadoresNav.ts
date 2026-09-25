import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchContadoresNav, type ContadoresNav } from "@/lib/api/navegacion";

const CADA_MS = 60_000;

/**
 * What is waiting on the user (approvals, invoices, invitations…), refreshed
 * on every navigation and once a minute. Failures just leave the last value.
 */
export function useContadoresNav(activo = true): ContadoresNav {
  const [contadores, setContadores] = useState<ContadoresNav>({});
  const { pathname } = useLocation();

  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    const cargar = () =>
      fetchContadoresNav()
        .then((c) => vivo && setContadores(c))
        .catch(() => undefined);
    void cargar();
    const t = setInterval(cargar, CADA_MS);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [pathname, activo]);

  return contadores;
}
