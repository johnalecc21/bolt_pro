import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

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

interface ApiPuja {
  proveedorId: string;
  proveedorNombre: string;
  montoInicial: number;
  monto: number;
}

interface ApiAuctionState {
  requerimientoId: string;
  status: "INACTIVA" | "ACTIVA" | "CERRADA";
  deadline: string | null;
  pujas: ApiPuja[];
}

function emptyState(requerimientoId: string): AuctionState {
  return { requerimientoId, status: "inactiva", deadlineMs: 0, pujas: [] };
}

function toAuctionState(raw: ApiAuctionState, requerimientoId: string): AuctionState {
  return {
    requerimientoId: raw.requerimientoId ?? requerimientoId,
    status: raw.status.toLowerCase() as AuctionState["status"],
    deadlineMs: raw.deadline ? new Date(raw.deadline).getTime() : 0,
    pujas: raw.pujas.map((p) => ({
      proveedorId: p.proveedorId,
      proveedor: p.proveedorNombre,
      montoInicial: p.montoInicial,
      monto: p.monto,
    })),
  };
}

export function getRanking(pujas: Puja[]): Puja[] {
  return [...pujas].sort((a, b) => a.monto - b.monto);
}

export function useSubasta(requerimientoId: string | undefined) {
  const [state, setState] = useState<AuctionState>(emptyState(requerimientoId ?? ""));
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!requerimientoId) return;
    let cancelled = false;
    let socket: Socket | null = null;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const token = data.session?.access_token;
      const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
      socket = io(`${baseUrl}/subasta`, { auth: { token }, transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => socket!.emit("join", { requerimientoId }));
      socket.on("state", (raw: ApiAuctionState) => setState(toAuctionState(raw, requerimientoId)));
      socket.on("error", (err: { message: string }) => toast.error(err.message));
    });

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [requerimientoId]);

  const iniciar = useCallback(
    (durationMs: number, seed: { proveedorId: string; proveedorNombre: string; monto: number }[]) => {
      socketRef.current?.emit("iniciar", { requerimientoId, durationMs, seed });
    },
    [requerimientoId],
  );

  const pujar = useCallback(
    (monto: number) => {
      socketRef.current?.emit("pujar", { requerimientoId, monto });
    },
    [requerimientoId],
  );

  const cerrar = useCallback(() => {
    socketRef.current?.emit("cerrar", { requerimientoId });
  }, [requerimientoId]);

  return { state, iniciar, pujar, cerrar };
}
