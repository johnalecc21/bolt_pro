import type { ContratoFila, DatosCfo, ProcesoFila } from "../tipos";

export const AHORA = new Date(2026, 5, 20).getTime(); // 20 jun 2026

export function proceso(id: string, extra: Partial<ProcesoFila> = {}): ProcesoFila {
  return {
    id,
    codigo: id.toUpperCase(),
    titulo: id,
    categoria: "TI",
    prioridad: "NORMAL",
    estado: "EN_CUMPLIMIENTO",
    moneda: "COP",
    presupuesto: 1000,
    creado: new Date(2026, 2, 1).toISOString(),
    cierreLicitacion: new Date(2026, 2, 10).toISOString(),
    aprobado: new Date(2026, 2, 2).toISOString(),
    rechazos: 0,
    centroCostoId: "cc1",
    centroCosto: "CC1 — Operación",
    unidadId: "u1",
    unidad: "Planta",
    solicitante: "Carlos",
    invitados: 3,
    ofertas: 3,
    mejorOferta: 900,
    negociado: false,
    negociacionInicial: null,
    negociacionFinal: null,
    proveedorAdjudicado: "Prov A",
    precioFinal: 800,
    firmado: new Date(2026, 2, 11).toISOString(),
    ...extra,
  };
}

export function contrato(id: string, extra: Partial<ContratoFila> = {}): ContratoFila {
  return {
    id,
    codigo: id,
    tipo: "PO",
    requerimientoId: null,
    contratoPadreId: null,
    proveedor: "Prov A",
    categoria: "TI",
    monto: 800,
    moneda: "COP",
    firmado: new Date(2026, 2, 11).toISOString(),
    vigenciaInicio: new Date(2026, 2, 11).toISOString(),
    vigenciaFin: new Date(2027, 2, 11).toISOString(),
    estado: "ACTIVO",
    centroCostoId: "cc1",
    centroCosto: "CC1 — Operación",
    unidadId: "u1",
    unidad: "Planta",
    ...extra,
  };
}

export function datos(): DatosCfo {
  return {
    empresa: "Acme",
    moneda: "COP",
    pais: "CO",
    desde: "2026-01-01",
    hasta: "2026-06-30",
    desdeAnterior: "2025-07-02",
    generadoEn: new Date(AHORA).toISOString(),
    truncado: false,
    procesos: [
      proceso("r1"),
      proceso("r2", {
        categoria: "Servicios",
        presupuesto: 2000,
        precioFinal: 1500,
        proveedorAdjudicado: "Prov B",
        prioridad: "URGENTE",
        negociado: true,
        negociacionInicial: 1700,
        negociacionFinal: 1500,
        ofertas: 1,
        creado: new Date(2026, 3, 1).toISOString(),
        firmado: new Date(2026, 4, 1).toISOString(),
        centroCostoId: "cc2",
        centroCosto: "CC2 — Logística",
        unidadId: "u2",
        unidad: "Puerto",
      }),
      proceso("r3", { precioFinal: null, firmado: null, estado: "EN_LICITACION", ofertas: 0, rechazos: 1 }),
      // Previous period: signed in 2025
      proceso("r0", { creado: new Date(2025, 8, 1).toISOString(), firmado: new Date(2025, 9, 1).toISOString(), presupuesto: 1000, precioFinal: 950 }),
      // Other currency: must never be summed with COP
      proceso("rx", { moneda: "USD", presupuesto: 100, precioFinal: 50 }),
    ],
    contratos: [
      contrato("c1", { requerimientoId: "r1" }),
      contrato("c2", { requerimientoId: "r2", proveedor: "Prov B", categoria: "Servicios", monto: 1500, firmado: new Date(2026, 4, 1).toISOString(), centroCostoId: "cc2", centroCosto: "CC2 — Logística", unidadId: "u2", unidad: "Puerto", vigenciaFin: new Date(2026, 7, 1).toISOString() }),
      contrato("c2-po", { contratoPadreId: "c2", proveedor: "Prov B", monto: 500 }), // PO under marco: not added again
      contrato("c0", { firmado: new Date(2025, 9, 1).toISOString(), monto: 950 }),
      contrato("cx", { moneda: "USD", monto: 50 }),
    ],
    pagos: [
      { id: "p1", contrato: "c1", proveedor: "Prov A", categoria: "TI", centroCostoId: "cc1", monto: 400, moneda: "COP", emision: new Date(2026, 3, 1).toISOString(), pactada: new Date(2026, 4, 1).toISOString(), estado: "PENDIENTE" },
      { id: "p2", contrato: "c2", proveedor: "Prov B", categoria: "Servicios", centroCostoId: "cc2", monto: 300, moneda: "COP", emision: new Date(2026, 5, 1).toISOString(), pactada: new Date(2026, 5, 30).toISOString(), estado: "PENDIENTE" },
      { id: "p3", contrato: "c1", proveedor: "Prov A", categoria: "TI", centroCostoId: "cc1", monto: 999, moneda: "COP", emision: new Date(2026, 1, 1).toISOString(), pactada: new Date(2026, 2, 1).toISOString(), estado: "PAGADO" },
    ],
    hitos: [
      { proveedor: "Prov A", categoria: "TI", centroCostoId: "cc1", comprometido: new Date(2026, 3, 1).toISOString(), real: new Date(2026, 2, 30).toISOString(), estado: "COMPLETADO" },
      { proveedor: "Prov B", categoria: "Servicios", centroCostoId: "cc2", comprometido: new Date(2026, 3, 1).toISOString(), real: new Date(2026, 3, 5).toISOString(), estado: "COMPLETADO" },
      { proveedor: "Prov B", categoria: "Servicios", centroCostoId: "cc2", comprometido: new Date(2026, 8, 1).toISOString(), real: null, estado: "PENDIENTE" },
    ],
    evaluaciones: [
      { proveedor: "Prov A", categoria: "TI", centroCostoId: "cc1", puntaje: 90, calidad: 5, plazos: 4, servicio: 5, hse: 4, planMejora: false, fecha: new Date(2026, 4, 1).toISOString() },
      { proveedor: "Prov B", categoria: "Servicios", centroCostoId: "cc2", puntaje: 50, calidad: 2, plazos: 3, servicio: 3, hse: 2, planMejora: true, fecha: new Date(2026, 4, 2).toISOString() },
    ],
    presupuestos: [
      {
        anio: 2026,
        centros: [
          { centroCostoId: "cc1", codigo: "CC1", nombre: "Operación", unidad: "Planta", activo: true, moneda: "COP", ejecucion: { presupuesto: 1000, comprometido: 950, enProceso: 0, disponible: 50, porcentajeUsado: 95 } },
          { centroCostoId: "cc2", codigo: "CC2", nombre: "Logística", unidad: "Puerto", activo: true, moneda: "COP", ejecucion: { presupuesto: 1000, comprometido: 1500, enProceso: 0, disponible: -500, porcentajeUsado: 150 } },
        ],
      },
    ],
  };
}

