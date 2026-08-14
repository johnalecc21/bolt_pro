/** Matches the backend's formatRequerimientoCodigo — keep them in sync. */
export function formatRequerimientoCodigo(numero: number): string {
  return `REQ-${numero.toString().padStart(4, "0")}`;
}

const CONTRATO_PREFIX: Record<"CONTRATO" | "PO" | "ADDENDUM", string> = {
  CONTRATO: "CTO",
  PO: "PO",
  ADDENDUM: "ADD",
};

/** Matches the backend's formatContratoCodigo — keep them in sync. */
export function formatContratoCodigo(tipo: "CONTRATO" | "PO" | "ADDENDUM", numero: number): string {
  return `${CONTRATO_PREFIX[tipo]}-${numero.toString().padStart(4, "0")}`;
}
