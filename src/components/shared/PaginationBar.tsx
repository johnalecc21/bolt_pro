import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Previous/next footer for server-paginated lists. Hidden when everything fits in one page. */
export function PaginationBar({
  page,
  totalPages,
  total,
  onPage,
  label = "registros",
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-border p-3 text-sm text-muted-foreground">
      <span>Página {page} de {totalPages} · {total.toLocaleString("es-CO")} {label}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Siguiente <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
