export interface OfertaEstructurada {
  requerimientoId: string;
  precioUnitario: number;
  precioTotal: number;
  plazoEntregaDias: number;
  condicionesPagoDias: number;
  garantiaMeses: number;
  vigenciaOfertaDias: number;
  enviada: boolean;
}

export const ofertaEnCurso: OfertaEstructurada = {
  requerimientoId: "RFP-2024-0040",
  precioUnitario: 0,
  precioTotal: 0,
  plazoEntregaDias: 30,
  condicionesPagoDias: 30,
  garantiaMeses: 12,
  vigenciaOfertaDias: 30,
  enviada: false,
};

export const preguntasRFP = [
  { autor: "Proveedor anónimo", pregunta: "¿El alcance incluye soporte post-implementación?", respuesta: "Sí, 3 meses de soporte incluidos." },
];
