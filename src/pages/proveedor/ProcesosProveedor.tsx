import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Incrustado } from "@/components/layout/Incrustado";
import { InvitacionesProveedor } from "@/pages/proveedor/InvitacionesProveedor";
import { OportunidadesRed } from "@/pages/proveedor/OportunidadesRed";
import { MisOfertasList } from "@/pages/proveedor/CargaOferta";
import { HistorialProveedor } from "@/pages/proveedor/HistorialProveedor";

const VISTAS = [
  { clave: "nuevos", label: "Nuevos", ayuda: "Invitaciones sin responder y procesos abiertos en la red." },
  { clave: "participando", label: "Participando", ayuda: "Ofertas en preparación o enviadas, y subastas en vivo." },
  { clave: "terminados", label: "Terminados", ayuda: "Procesos ganados y perdidos, con la retroalimentación del comprador." },
] as const;

type Vista = (typeof VISTAS)[number]["clave"];

/**
 * Every process the supplier can take part in, by where it stands:
 * new (invited or open in the network), participating, or finished.
 * Replaces the separate Invitaciones, Red, Mis ofertas, Subasta and
 * Historial screens.
 */
export function ProcesosProveedor() {
  const [params, setParams] = useSearchParams();
  const vista: Vista = VISTAS.some((v) => v.clave === params.get("vista")) ? (params.get("vista") as Vista) : "nuevos";
  const actual = VISTAS.find((v) => v.clave === vista)!;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Procesos</h1>
        <p className="text-sm text-muted-foreground">{actual.ayuda}</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Estado de los procesos">
        {VISTAS.map((v) => (
          <button
            key={v.clave}
            type="button"
            aria-current={vista === v.clave ? "page" : undefined}
            onClick={() => setParams(v.clave === "nuevos" ? {} : { vista: v.clave }, { replace: true })}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              vista === v.clave ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <Incrustado>
        {vista === "nuevos" && (
          <div className="space-y-10">
            <InvitacionesProveedor />
            <OportunidadesRed />
          </div>
        )}
        {vista === "participando" && <MisOfertasList />}
        {vista === "terminados" && <HistorialProveedor />}
      </Incrustado>
    </div>
  );
}
