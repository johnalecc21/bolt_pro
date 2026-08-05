import { useSyncExternalStore } from "react";

export type EstadoHomologacion = "en_revision" | "aprobado" | "rechazado" | "zona_gris";

export interface DocumentoHomologacion {
  nombre: string;
  estado: "pendiente" | "subido" | "validado" | "vencido";
  vigencia?: string;
}

export interface RegistroHomologacion {
  proveedorId: string;
  proveedor: string;
  estado: EstadoHomologacion;
  score: number;
  documentos: DocumentoHomologacion[];
  alertas: string[];
  fechaSolicitud: string;
  proximaRevalidacion: string;
}

let registros: RegistroHomologacion[] = [
  {
    proveedorId: "P-001", proveedor: "CloudSphere Technologies", estado: "aprobado", score: 94,
    documentos: [
      { nombre: "RUT / NIT", estado: "validado" },
      { nombre: "Estados financieros", estado: "validado" },
      { nombre: "Certificado ISO 27001", estado: "validado", vigencia: "2025-03-01" },
      { nombre: "Referencias comerciales", estado: "validado" },
    ],
    alertas: [], fechaSolicitud: "2024-02-10", proximaRevalidacion: "2025-02-10",
  },
  {
    proveedorId: "P-011", proveedor: "PrimeBuild Constructora", estado: "zona_gris", score: 62,
    documentos: [
      { nombre: "RUT / NIT", estado: "validado" },
      { nombre: "Estados financieros", estado: "validado" },
      { nombre: "Certificado ISO 9001", estado: "vencido", vigencia: "2024-03-01" },
      { nombre: "Referencias comerciales", estado: "subido" },
    ],
    alertas: ["Certificación ISO 9001 vencida", "Litigio menor reportado en registro público"],
    fechaSolicitud: "2024-07-28", proximaRevalidacion: "2025-01-28",
  },
  {
    proveedorId: "P-006", proveedor: "TalentHub Solutions", estado: "zona_gris", score: 71,
    documentos: [
      { nombre: "RUT / NIT", estado: "validado" },
      { nombre: "Estados financieros", estado: "subido" },
      { nombre: "Certificado ISO 9001", estado: "validado" },
      { nombre: "Referencias comerciales", estado: "pendiente" },
    ],
    alertas: ["Antigüedad menor a 2 años"],
    fechaSolicitud: "2024-07-30", proximaRevalidacion: "2025-01-30",
  },
];

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

export function subscribeHomologacion(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
export function getHomologacionSnapshot() { return registros; }
export function useHomologacionRegistros(): RegistroHomologacion[] {
  return useSyncExternalStore(subscribeHomologacion, getHomologacionSnapshot);
}
export function useHomologacionRegistro(proveedorId: string): RegistroHomologacion | undefined {
  const all = useHomologacionRegistros();
  return all.find((r) => r.proveedorId === proveedorId);
}

export function submitHomologacion(proveedorId: string, proveedor: string, documentos: DocumentoHomologacion[]) {
  const idx = registros.findIndex((r) => r.proveedorId === proveedorId);
  const nuevo: RegistroHomologacion = {
    proveedorId, proveedor, estado: "en_revision", score: 0, documentos,
    alertas: [], fechaSolicitud: new Date().toISOString().slice(0, 10), proximaRevalidacion: "—",
  };
  if (idx === -1) registros = [nuevo, ...registros];
  else registros = registros.map((r, i) => i === idx ? nuevo : r);
  emit();
}

export function resolverHomologacion(proveedorId: string, estado: "aprobado" | "rechazado", score: number, motivo?: string) {
  registros = registros.map((r) => r.proveedorId === proveedorId
    ? { ...r, estado, score, proximaRevalidacion: "2025-08-01", alertas: motivo ? [...r.alertas, motivo] : r.alertas }
    : r);
  emit();
}
