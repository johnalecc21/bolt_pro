import { api } from "@/lib/api/http";
import type { Moneda } from "@/lib/moneda";

export interface Oportunidad {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  cliente: string;
  moneda: Moneda;
  fechaLimite: string;
  publicado: string;
  items: number;
  participantes: number;
  deMiCategoria: boolean;
  participa: { estado: "NUEVA" | "VISTA" | "RESPONDIDA" | "VENCIDA" | "DECLINADA" } | null;
  puedeParticipar: boolean;
  motivo: string | null;
}

export async function fetchOportunidades(params: { todas?: boolean; q?: string }): Promise<{ homologado: boolean; categorias: string[]; items: Oportunidad[] }> {
  const { data } = await api.get("/red/oportunidades", { params: { todas: params.todas ? "1" : undefined, q: params.q || undefined } });
  return data;
}

export async function participar(requerimientoId: string) {
  const { data } = await api.post<{ ok: boolean; requerimientoId: string }>(`/red/oportunidades/${requerimientoId}/participar`);
  return data;
}

export async function abrirARed(requerimientoId: string, abierto: boolean): Promise<{ abiertoRed: boolean; avisados: number }> {
  const { data } = await api.patch(`/red/requerimientos/${requerimientoId}`, { abierto });
  return data;
}

export type EtapaTablero = "SIN_ABRIR" | "VIO" | "ACEPTO" | "PREPARANDO" | "OFERTA_ENVIADA" | "DECLINO";

export interface FilaTablero {
  proveedorId: string;
  proveedor: string;
  score: number;
  ubicacion: string;
  origen: "INVITACION" | "RED";
  etapa: EtapaTablero;
  invitadoAt: string;
  vistaAt: string | null;
  respondidaAt: string | null;
  borradorAt: string | null;
  enviadaAt: string | null;
  preguntas: number;
  ultimaActividad: string;
}

export interface Tablero {
  estado: string;
  fechaLimite: string;
  abiertoRed: boolean;
  publicado: string;
  ahora: string;
  resumen: { participantes: number; vieron: number; aceptaron: number; preparando: number; enviaron: number; declinaron: number; desdeRed: number; preguntas: number };
  filas: FilaTablero[];
}

export async function fetchTablero(requerimientoId: string): Promise<Tablero> {
  const { data } = await api.get<Tablero>(`/red/requerimientos/${requerimientoId}/tablero`);
  return data;
}

export interface ProveedorRed {
  id: string;
  nombre: string;
  iniciales: string;
  color: string;
  categorias: string[];
  ubicacion: string;
  descripcion: string | null;
  score: number;
  desempenoPromedio: number | null;
  evaluacionesCount: number;
  procesosGanados: number;
}

export async function fetchDirectorioPublico(params: { q?: string; categoria?: string; page?: number }): Promise<{ items: ProveedorRed[]; total: number; page: number; totalPages: number; categorias: { nombre: string; proveedores: number }[] }> {
  const { data } = await api.get("/red/publico/proveedores", { params });
  return data;
}

export async function fetchEstadisticasRed(): Promise<{ proveedoresHomologados: number; empresas: number; convocatoriasAbiertas: number }> {
  const { data } = await api.get("/red/publico/estadisticas");
  return data;
}
