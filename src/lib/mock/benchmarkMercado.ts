export interface BenchmarkEntry {
  categoria: string;
  region: string;
  precioPromedio: number;
  muestras: number;
  outlier: boolean;
}

export const benchmarkMercado: BenchmarkEntry[] = [
  { categoria: "TI · Cloud", region: "LATAM", precioPromedio: 172000, muestras: 34, outlier: false },
  { categoria: "Materia Prima · Embalaje", region: "LATAM", precioPromedio: 26500, muestras: 58, outlier: false },
  { categoria: "Servicios Generales · Limpieza", region: "Colombia", precioPromedio: 61000, muestras: 22, outlier: false },
  { categoria: "Logística · Flota", region: "LATAM", precioPromedio: 305000, muestras: 19, outlier: false },
  { categoria: "TI · Consultoría", region: "LATAM", precioPromedio: 138000, muestras: 12, outlier: true },
];
