import { useParams } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/TableSkeleton";
import { FichaContrato } from "@/components/contratos/FichaContrato";
import { useApiData } from "@/hooks/useApiData";
import { fetchMiFichaContrato } from "@/lib/api/contratos";

export function MiContratoDetalle() {
  const { id = "" } = useParams();
  const { data, loading, error, reload } = useApiData(() => fetchMiFichaContrato(id), [id]);
  if (loading && !data) return <div className="p-6"><CardGridSkeleton count={3} /></div>;
  if (!data || error) return <div className="p-6"><EmptyState icon={FileQuestion} title="Contrato no encontrado" /></div>;
  return <FichaContrato ficha={data} portal="proveedor" onCambio={reload} />;
}
