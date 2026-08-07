import { useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api/http";

export interface Notificacion {
  id: string;
  tipo: "aprobacion" | "oferta" | "contrato" | "negociacion" | "proveedor" | "disputa";
  titulo: string;
  desc: string;
  tiempo: string;
  leida: boolean;
}

interface ApiNotificacion {
  id: string;
  tipo: string;
  titulo: string;
  desc: string;
  leida: boolean;
  createdAt: string;
}

function toNotificacion(n: ApiNotificacion): Notificacion {
  return {
    id: n.id,
    tipo: n.tipo.toLowerCase() as Notificacion["tipo"],
    titulo: n.titulo,
    desc: n.desc,
    tiempo: new Date(n.createdAt).toLocaleString(),
    leida: n.leida,
  };
}

async function fetchNotificaciones(): Promise<Notificacion[]> {
  const { data } = await api.get<ApiNotificacion[]>("/notificaciones");
  return data.map(toNotificacion);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notificacion[]>([]);

  const reload = useCallback(() => {
    fetchNotificaciones().then(setNotifications).catch((err) => console.error(apiErrorMessage(err)));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    api.post(`/notificaciones/${id}/leer`).catch(() => reload());
  }, [reload]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    api.post("/notificaciones/leer-todas").catch(() => reload());
  }, [reload]);

  return { notifications, markAsRead, markAllAsRead };
}
