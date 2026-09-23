export type EstadoReq =
  | "borrador"
  | "pendiente_aprobacion"
  | "en_licitacion"
  | "en_negociacion"
  | "adjudicado"
  | "en_cumplimiento"
  | "cerrado";

import type { Moneda } from "@/lib/moneda";

export interface Requerimiento {
  id: string;
  /** Human-readable sequential code (REQ-0001, ...) — show this, not `id`. */
  codigo: string;
  titulo: string;
  categoria: string;
  estado: EstadoReq;
  montoEstimado: number;
  moneda: Moneda;
  fechaLimite: string;
  progreso: number;
  proveedoresInvitados: number;
  ofertasRecibidas: number;
  solicitante: string;
  /** Defaults to "acme" when omitted — most seed data predates multi-tenant support. */
  companyId?: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  iniciales: string;
  categorias: string[];
  score: number;
  ubicacion: string;
  sitioWeb: string | null;
  certificaciones: string[];
  procesosGanados: number;
  entregasATiempo: number;
  disputas: number;
  color: string;
  /** 0-100 average of every client's performance evaluations; null until the first one. */
  desempenoPromedio: number | null;
  evaluacionesCount: number;
  /** The proveedor's own pitch from its vitrina. */
  descripcion?: string | null;
}

export interface Contrato {
  id: string;
  /** Human-readable sequential code (CTO-0001 / PO-0001 / ADD-0001) — show this, not `id`. */
  codigo: string;
  tipo: "Contrato" | "PO" | "Addendum";
  proveedor: string;
  categoria: string;
  monto: number;
  moneda: Moneda;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: "Activo" | "Por vencer" | "Vencido" | "En renovación";
  /** Defaults to "acme" when omitted — most seed data predates multi-tenant support. */
  companyId?: string;
  /** Set when the company attached their own PO/contract file — otherwise downloads use the Procurex template. */
  archivoNombre?: string | null;
  /** POs issued under this contract, when it's a Contrato Marco. */
  hijas?: { id: string; monto: number; estado: string }[];
  /** Days after milestone completion the contract's payments fall due. */
  condicionesPagoDias?: number;
}

export interface Aprobacion {
  id: string;
  tipo: "Salida a licitación" | "Adjudicación" | "Excepción de presupuesto";
  descripcion: string;
  solicitante: string;
  monto: number;
  moneda: Moneda;
  fecha: string;
  urgente: boolean;
  pasoActual?: number;
  totalPasos?: number;
}

export interface Disputa {
  id: string;
  poReferencia: string;
  proveedor: string;
  severidad: "Baja" | "Media" | "Alta";
  estado: "Abierta" | "En mediación" | "Resuelta";
  diasAbierta: number;
  mediador: string;
}
