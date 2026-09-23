import { useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api/http";

export interface Notificacion {
  id: string;
  tipo: "aprobacion" | "oferta" | "contrato" | "negociacion" | "proveedor" | "disputa";
  titulo: string;
  desc: string;
  tiempo: string;
  leida: boolean;
  link: string | null;
}

interface ApiNotificacion {
  id: string;
  tipo: string;
  titulo: string;
  desc: string;
  leida: boolean;
  createdAt: string;
  link: string | null;
}

function toNotificacion(n: ApiNotificacion): Notificacion {
  return {
    id: n.id,
    tipo: n.tipo.toLowerCase() as Notificacion["tipo"],
    titulo: n.titulo,
    desc: n.desc,
    tiempo: new Date(n.createdAt).toLocaleString(),
    leida: n.leida,
    link: n.link,
  };
}

interface ApiNotificacionesFeed {
  items: ApiNotificacion[];
  unreadCount: number;
}

async function fetchNotificaciones(): Promise<{ items: Notificacion[]; unreadCount: number }> {
  const { data } = await api.get<ApiNotificacionesFeed>("/notificaciones");
  return { items: data.items.map(toNotificacion), unreadCount: data.unreadCount };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  // Tracked separately from the (capped) list so the badge stays correct
  // even when there are more unread notifications than the feed returns.
  const [unread, setUnread] = useState(0);

  const reload = useCallback(() => {
    fetchNotificaciones()
      .then(({ items, unreadCount }) => {
        setNotifications(items);
        setUnread(unreadCount);
      })
      .catch((err) => console.error(apiErrorMessage(err)));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.leida) setUnread((u) => Math.max(0, u - 1));
      return prev.map((n) => (n.id === id ? { ...n, leida: true } : n));
    });
    api.post(`/notificaciones/${id}/leer`).catch(() => reload());
  }, [reload]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    setUnread(0);
    api.post("/notificaciones/leer-todas").catch(() => reload());
  }, [reload]);

  return { notifications, unread, markAsRead, markAllAsRead };
}

export interface PreferenciasCorreo {
  recibirCorreos: boolean;
  /** False when the platform has no email provider configured yet. */
  correoHabilitado: boolean;
}

export async function fetchPreferenciasCorreo(): Promise<PreferenciasCorreo> {
  const { data } = await api.get<PreferenciasCorreo>("/notificaciones/preferencias");
  return data;
}

export async function guardarPreferenciasCorreo(recibirCorreos: boolean): Promise<PreferenciasCorreo> {
  const { data } = await api.put<PreferenciasCorreo>("/notificaciones/preferencias", { recibirCorreos });
  return data;
}
