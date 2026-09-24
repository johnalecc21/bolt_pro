import type { Moneda } from "@/lib/moneda";

export type ResultadoProceso = "ganado" | "perdido" | "seleccionado" | "pendiente" | "sin_oferta";

/** One row per process the supplier was invited to (GET /analitica/proveedor). */
export interface ProcesoProveedor {
  requerimientoId: string;
  codigo: string;
  titulo: string;
  cliente: string;
  categoria: string;
  moneda: Moneda;
  invitado: string;
  cierre: string;
  declinada: boolean;
  ofertaEnviada: boolean;
  fechaOferta: string | null;
  miPrecio: number | null;
  negociado: boolean;
  miPrecioFinal: number | null;
  resultado: ResultadoProceso;
  fechaResultado: string | null;
  /** Only for processes this supplier won (or was selected for). */
  precioAdjudicado: number | null;
  /** For lost processes: whether the buyer shares rank and gap. null otherwise. */
  competenciaVisible: boolean | null;
  posicion: number | null;
  participantes: number | null;
  brechaPct: number | null;
}

export interface ContratoProveedor {
  id: string;
  codigo: string;
  contratoPadreId: string | null;
  cliente: string;
  categoria: string;
  monto: number;
  moneda: Moneda;
  firmado: string;
  vigenciaFin: string;
  estado: string;
}

export interface PagoProveedor {
  id: string;
  contrato: string;
  cliente: string;
  categoria: string;
  monto: number;
  moneda: Moneda;
  emision: string;
  pactada: string;
  estado: "PENDIENTE" | "PAGADO" | "VENCIDO";
}

export interface HitoProveedor {
  cliente: string;
  categoria: string;
  comprometido: string;
  real: string | null;
  estado: "COMPLETADO" | "EN_RIESGO" | "ATRASADO" | "PENDIENTE";
}

export interface EvaluacionProveedor {
  cliente: string;
  categoria: string;
  contrato: string;
  puntaje: number;
  calidad: number;
  plazos: number;
  servicio: number;
  hse: number;
  planMejora: boolean;
  fecha: string;
}

export interface DatosProveedor {
  proveedor: string;
  desde: string;
  hasta: string;
  desdeAnterior: string;
  generadoEn: string;
  truncado: boolean;
  visitasVitrina: number;
  procesos: ProcesoProveedor[];
  contratos: ContratoProveedor[];
  pagos: PagoProveedor[];
  hitos: HitoProveedor[];
  evaluaciones: EvaluacionProveedor[];
}

export interface FiltrosProveedor {
  moneda: Moneda;
  cliente?: string;
  categoria?: string;
}
