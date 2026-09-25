import type { Moneda } from "@/lib/moneda";

/** Row-level dataset from GET /analitica/cfo — see the backend service for how each row is built. */
export interface ProcesoFila {
  id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  prioridad: "NORMAL" | "ALTA" | "URGENTE";
  estado: string;
  moneda: Moneda;
  presupuesto: number;
  creado: string;
  cierreLicitacion: string;
  aprobado: string | null;
  rechazos: number;
  centroCostoId: string | null;
  centroCosto: string | null;
  unidadId: string | null;
  unidad: string | null;
  solicitante: string;
  invitados: number;
  ofertas: number;
  mejorOferta: number | null;
  negociado: boolean;
  negociacionInicial: number | null;
  negociacionFinal: number | null;
  proveedorAdjudicado: string | null;
  precioFinal: number | null;
  firmado: string | null;
}

export interface ContratoFila {
  id: string;
  codigo: string;
  tipo: "CONTRATO" | "PO" | "ADDENDUM";
  requerimientoId: string | null;
  contratoPadreId: string | null;
  proveedor: string;
  categoria: string;
  monto: number;
  moneda: Moneda;
  firmado: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: string;
  centroCostoId: string | null;
  centroCosto: string | null;
  unidadId: string | null;
  unidad: string | null;
}

export interface PagoFila {
  id: string;
  contrato: string;
  proveedor: string;
  categoria: string;
  centroCostoId: string | null;
  monto: number;
  moneda: Moneda;
  emision: string;
  pactada: string;
  estado: "PENDIENTE" | "PAGADO" | "VENCIDO";
}

export interface HitoFila {
  proveedor: string;
  categoria: string;
  centroCostoId: string | null;
  comprometido: string;
  real: string | null;
  estado: "COMPLETADO" | "EN_RIESGO" | "ATRASADO" | "PENDIENTE";
}

export interface EvaluacionFila {
  proveedor: string;
  categoria: string;
  centroCostoId: string | null;
  puntaje: number;
  calidad: number;
  plazos: number;
  servicio: number;
  hse: number;
  planMejora: boolean;
  fecha: string;
}

export interface EjecucionCentro {
  centroCostoId: string;
  codigo: string;
  nombre: string;
  unidad: string | null;
  activo: boolean;
  moneda: Moneda | null;
  ejecucion: { presupuesto: number; comprometido: number; enProceso: number; disponible: number; porcentajeUsado: number } | null;
}

export interface DatosCfo {
  empresa: string;
  moneda: Moneda;
  pais: string;
  desde: string;
  hasta: string;
  desdeAnterior: string;
  generadoEn: string;
  truncado: boolean;
  procesos: ProcesoFila[];
  contratos: ContratoFila[];
  pagos: PagoFila[];
  hitos: HitoFila[];
  evaluaciones: EvaluacionFila[];
  presupuestos: { anio: number; centros: EjecucionCentro[] }[];
}

export interface FiltrosCfo {
  unidadId?: string;
  centroCostoId?: string;
  categoria?: string;
}
