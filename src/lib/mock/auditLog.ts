import { useSyncExternalStore } from "react";

export interface AuditEntry {
  id: string;
  usuario: string;
  accion: string;
  detalle: string;
  motivo?: string;
  fecha: string;
}

let entries: AuditEntry[] = [
  { id: "AUD-0001", usuario: "Ana Consultora", accion: "Homologación aprobada", detalle: "NovaTech Consulting", fecha: "2026-08-01 09:12" },
  { id: "AUD-0002", usuario: "Carlos Méndez", accion: "Adjudicación aprobada", detalle: "RFP-2024-0030 → CleanPro Services", fecha: "2026-08-03 14:40" },
  { id: "AUD-0003", usuario: "Laura Torres", accion: "Excepción de presupuesto rechazada", detalle: "RFP-2024-0028", motivo: "Excede el 10% permitido sin justificación adicional", fecha: "2026-08-04 11:05" },
];

let idCounter = entries.length;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function logAudit(entry: Omit<AuditEntry, "id" | "fecha">) {
  idCounter += 1;
  const now = new Date();
  const fecha = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
  entries = [{ id: `AUD-${String(idCounter).padStart(4, "0")}`, fecha, ...entry }, ...entries];
  emit();
}

export function subscribeAuditLog(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAuditLogSnapshot() {
  return entries;
}

export function useAuditLog(): AuditEntry[] {
  return useSyncExternalStore(subscribeAuditLog, getAuditLogSnapshot);
}
