export interface NotificationPrefKey {
  key: string;
  label: string;
}

export const notificationTypes: NotificationPrefKey[] = [
  { key: "aprobacion", label: "Aprobaciones pendientes" },
  { key: "oferta", label: "Nuevas ofertas recibidas" },
  { key: "contrato", label: "Contratos por vencer" },
  { key: "negociacion", label: "Rondas de negociación" },
  { key: "proveedor", label: "Actividad de proveedores" },
];
