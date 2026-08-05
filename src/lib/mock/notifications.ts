import { useSyncExternalStore } from "react";
import { notificaciones as seedNotificaciones } from "@/lib/mockData";

export interface Notificacion {
  id: number;
  tipo: "aprobacion" | "oferta" | "contrato" | "negociacion" | "proveedor" | "disputa";
  titulo: string;
  desc: string;
  tiempo: string;
  leida: boolean;
}

let entries: Notificacion[] = seedNotificaciones as Notificacion[];

let idCounter = entries.length;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function addNotification(entry: Omit<Notificacion, "id" | "tiempo" | "leida">) {
  idCounter += 1;
  entries = [{ id: idCounter, tiempo: "Ahora", leida: false, ...entry }, ...entries];
  emit();
}

export function markAsRead(id: number) {
  entries = entries.map((n) => (n.id === id ? { ...n, leida: true } : n));
  emit();
}

export function markAllAsRead() {
  entries = entries.map((n) => ({ ...n, leida: true }));
  emit();
}

export function subscribeNotifications(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getNotificationsSnapshot() {
  return entries;
}

export function useNotifications(): Notificacion[] {
  return useSyncExternalStore(subscribeNotifications, getNotificationsSnapshot);
}
