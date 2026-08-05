import { useSyncExternalStore } from "react";

export interface Puja {
  proveedorId: string;
  proveedor: string;
  montoInicial: number;
  monto: number;
}

export interface AuctionState {
  requerimientoId: string;
  status: "inactiva" | "activa" | "cerrada";
  deadlineMs: number;
  pujas: Puja[];
}

let state: AuctionState = {
  requerimientoId: "RFP-2024-0032",
  status: "inactiva",
  deadlineMs: 0,
  pujas: [
    { proveedorId: "P-010", proveedor: "NovaTech Consulting", montoInicial: 168000, monto: 168000 },
    { proveedorId: "P-001", proveedor: "CloudSphere Technologies", montoInicial: 172000, monto: 172000 },
    { proveedorId: "P-007", proveedor: "AuditTrust Asociados", montoInicial: 195000, monto: 195000 },
  ],
};

let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function emit() {
  state = { ...state, pujas: [...state.pujas] };
  listeners.forEach((l) => l());
}

export function subscribeAuction(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAuctionSnapshot(): AuctionState {
  return state;
}

export function useAuction(): AuctionState {
  return useSyncExternalStore(subscribeAuction, getAuctionSnapshot);
}

export function getRanking(pujas: Puja[] = state.pujas): Puja[] {
  return [...pujas].sort((a, b) => a.monto - b.monto);
}

export function startAuction(durationMs = 15 * 60 * 1000, requerimientoId?: string, pujasIniciales?: Puja[]) {
  if (state.status === "activa") return;
  state = {
    requerimientoId: requerimientoId ?? state.requerimientoId,
    pujas: pujasIniciales ?? state.pujas,
    status: "activa",
    deadlineMs: Date.now() + durationMs,
  };
  emit();
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (state.status !== "activa") return;
    const idx = Math.floor(Math.random() * state.pujas.length);
    const nudge = Math.round((500 + Math.random() * 2500) / 100) * 100;
    state.pujas[idx] = { ...state.pujas[idx], monto: Math.max(1000, state.pujas[idx].monto - nudge) };
    emit();
  }, 5000);
}

export function submitBid(proveedorId: string, monto: number) {
  const idx = state.pujas.findIndex((p) => p.proveedorId === proveedorId);
  if (idx === -1) return;
  state.pujas[idx] = { ...state.pujas[idx], monto };
  emit();
}

export function closeAuction() {
  state = { ...state, status: "cerrada" };
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  emit();
}

export function resetAuction() {
  state = {
    ...state,
    status: "inactiva",
    pujas: state.pujas.map((p) => ({ ...p, monto: p.montoInicial })),
  };
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  emit();
}
