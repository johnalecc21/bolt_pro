import { useParams } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { FichaContrato } from "@/components/contratos/FichaContrato";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchFichaContrato } from "@/lib/api/contratos";

export function ContratoDetalle() {
  const { id = "" } = useParams();
  const { currentUser } = useAuth();
  const { data, loading, error, reload } = useApiData(() => fetchFichaContrato(id), [id]);
  const rol = currentUser?.role;
  if (loading && !data) return <div className="p-6"><CardGridSkeleton count={3} /></div>;
  if (!data || error) return <div className="p-6"><EmptyState icon={FileQuestion} title="Contrato no encontrado" description="Puede que no exista o que pertenezca a otra empresa." /></div>;
  return (
    <FichaContrato
      ficha={data}
      portal="cliente"
      puedeGestionar={rol === "comprador" || rol === "admin_cliente"}
      puedeDecidir={rol === "admin_cliente" || rol === "aprobador_cfo"}
      onCambio={reload}
    />
  );
}
