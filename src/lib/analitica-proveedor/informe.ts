import { formatMoney, formatMoneyCompact, type Moneda } from "@/lib/moneda";
import { variacion } from "@/lib/analitica/agregador";
import type { Insight } from "@/lib/analitica/insights";
import type { Celda, Seccion, TipoColumna } from "@/lib/analitica/informe";
import { textoCelda, type DocumentoPdf } from "@/lib/analitica/exportar";
import {
  agrupar,
  cobros,
  decididos,
  embudo,
  filtrar,
  invitacionesDelPeriodo,
  kpis,
  perdidosSinDetalle,
  rangos,
  type CobrosProveedor,
  type KpisProveedor,
} from "./agregador";
import type { DatosProveedor, FiltrosProveedor } from "./tipos";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const RESULTADO: Record<string, string> = {
  ganado: "Ganado",
  perdido: "Perdido",
  seleccionado: "Seleccionado (pendiente de firma)",
  pendiente: "En curso",
  sin_oferta: "Sin oferta",
};

export interface InformeProveedor {
  proveedor: string;
  moneda: Moneda;
  periodo: { desde: string; hasta: string; desdeAnterior: string };
  filtros: string[];
  generadoEn: string;
  visitasVitrina: number;
  kpis: KpisProveedor;
  kpisAnterior: KpisProveedor;
  cobros: CobrosProveedor;
  insights: Insight[];
  secciones: Seccion[];
  notas: string[];
}

export function construirInformeProveedor(datos: DatosProveedor, f: FiltrosProveedor, etiquetasFiltro: string[] = [], ahora = Date.now()): InformeProveedor {
  const { actual, anterior } = rangos(datos);
  const d = filtrar(datos, f);
  const k = kpis(d, actual, ahora);
  const kPrev = kpis(d, anterior, ahora);
  const cob = cobros(d, ahora);
  const m = f.moneda;
  const insights: Insight[] = [];

  if (cob.nVencidos) {
    insights.push({
      nivel: "critico",
      titulo: `${cob.nVencidos} pago(s) vencido(s) por cobrar: ${formatMoney(cob.vencido, m)}`,
      detalle: "Contacta al cliente para confirmar la fecha de pago.",
      enlace: { to: "/proveedor/pagos", texto: "Ver pagos" },
    });
  }
  const planMejora = [...new Set(d.evaluaciones.filter((e) => e.planMejora && new Date(e.fecha).getTime() >= actual.desde).map((e) => e.cliente))];
  if (planMejora.length) {
    insights.push({
      nivel: "critico",
      titulo: `Evaluación bajo 60/100 con ${planMejora.join(", ")}`,
      detalle: "Tu cliente espera un plan de mejora; las evaluaciones bajas reducen tu score y tus invitaciones futuras.",
      enlace: { to: "/proveedor/historial", texto: "Ver evaluaciones" },
    });
  }
  if (k.entregaATiempo != null && k.entregaATiempo < 0.8) {
    insights.push({
      nivel: "atencion",
      titulo: `Entregaste a tiempo el ${pct(k.entregaATiempo)} de los hitos`,
      detalle: "Los hitos atrasados retrasan tus pagos y bajan tu evaluación de plazos.",
      enlace: { to: "/proveedor/contratos", texto: "Ver contratos" },
    });
  }
  if (k.tasaRespuesta != null && k.invitaciones >= 3 && k.tasaRespuesta < 0.5) {
    insights.push({
      nivel: "atencion",
      titulo: `Respondiste el ${pct(k.tasaRespuesta)} de las invitaciones`,
      detalle: "Declinar o no responder reduce las invitaciones que recibes de ese cliente.",
      enlace: { to: "/proveedor/invitaciones", texto: "Ver invitaciones" },
    });
  }
  if (k.brechaPromedio != null && k.brechaPromedio > 0.05) {
    insights.push({
      nivel: "atencion",
      titulo: `En lo que perdiste, tu precio final estuvo en promedio ${pct(k.brechaPromedio)} sobre el adjudicado`,
      detalle: "Solo cuenta los procesos cuyos compradores comparten esta información. La adjudicación también pondera plazo, calidad y condiciones de pago.",
    });
  }
  const sinDetalle = perdidosSinDetalle(d, actual).length;
  if (sinDetalle) {
    insights.push({
      nivel: "info",
      titulo: `${sinDetalle} proceso(s) perdido(s) sin detalle de competitividad`,
      detalle: "Esos compradores no comparten tu posición ni la brecha con el adjudicado.",
    });
  }
  const porCliente = agrupar(d, "adjudicado", "cliente", actual);
  const totalAdj = porCliente.reduce((s, g) => s + g.valor, 0);
  if (porCliente.length > 1 && totalAdj > 0 && porCliente[0].valor / totalAdj > 0.5) {
    insights.push({
      nivel: "info",
      titulo: `${porCliente[0].etiqueta} representa el ${pct(porCliente[0].valor / totalAdj)} de lo adjudicado`,
      detalle: "Depender de un solo cliente aumenta el riesgo comercial; considera diversificar.",
    });
  }
  if (cob.porVencer.length) {
    insights.push({
      nivel: "info",
      titulo: `${cob.porVencer.length} contrato(s) vencen en los próximos 90 días`,
      detalle: "Buen momento para proponer la renovación antes de que el cliente vuelva a licitar.",
      enlace: { to: "/proveedor/contratos", texto: "Ver contratos" },
    });
  }
  const cambioExito = variacion(k.tasaExito, kPrev.tasaExito);
  if (cambioExito != null && Math.abs(cambioExito) >= 0.1) {
    insights.push({
      nivel: cambioExito > 0 ? "positivo" : "atencion",
      titulo: `Tu tasa de éxito ${cambioExito > 0 ? "mejoró" : "bajó"}: ${pct(k.tasaExito ?? 0)} vs. ${pct(kPrev.tasaExito ?? 0)}`,
      detalle: "Comparado con el período anterior de igual duración.",
    });
  }
  const orden = { critico: 0, atencion: 1, positivo: 2, info: 3 } as const;
  insights.sort((a, b) => orden[a.nivel] - orden[b.nivel]);

  const tipos: TipoColumna[] = [];
  const fila = (titulo: string, tipo: TipoColumna, a: number | null, b: number | null): Celda[] => {
    tipos.push(tipo);
    return [titulo, a, b, variacion(a, b)];
  };

  const mesAdj = agrupar(d, "adjudicado", "mes", actual);
  const mesInv = agrupar(d, "invitaciones", "mes", actual);
  const mesOf = agrupar(d, "ofertasEnviadas", "mes", actual);
  const mesGan = agrupar(d, "ganados", "mes", actual);
  const exitoCliente = new Map(agrupar(d, "tasaExito", "cliente", actual).map((g) => [g.clave, g.valor]));
  const evalCliente = new Map(agrupar(d, "evaluacion", "cliente", actual).map((g) => [g.clave, g.valor]));
  const contratosCliente = new Map(agrupar(d, "contratos", "cliente", actual).map((g) => [g.clave, g.valor]));
  const clientes = new Set([...porCliente.map((g) => g.clave), ...exitoCliente.keys()]);
  const porCategoria = agrupar(d, "adjudicado", "categoria", actual);
  const exitoCategoria = new Map(agrupar(d, "tasaExito", "categoria", actual).map((g) => [g.clave, g.valor]));
  const categorias = new Set([...porCategoria.map((g) => g.clave), ...exitoCategoria.keys()]);

  const procesosPeriodo = new Map<string, (typeof d.procesos)[number]>();
  for (const p of [...invitacionesDelPeriodo(d, actual), ...decididos(d, actual)]) procesosPeriodo.set(p.requerimientoId, p);

  const secciones: Seccion[] = [
    {
      id: "resumen",
      titulo: "Resumen",
      descripcion: `Período ${datos.desde} a ${datos.hasta} frente a ${datos.desdeAnterior} a ${datos.desde}.`,
      columnas: [
        { titulo: "Indicador", tipo: "texto" },
        { titulo: "Período", tipo: "decimal" },
        { titulo: "Período anterior", tipo: "decimal" },
        { titulo: "Variación", tipo: "pct" },
      ],
      filas: [
        fila(`Monto adjudicado (${m})`, "moneda", k.adjudicado, kPrev.adjudicado),
        fila("Contratos firmados", "entero", k.contratos, kPrev.contratos),
        fila("Invitaciones recibidas", "entero", k.invitaciones, kPrev.invitaciones),
        fila("Ofertas enviadas", "entero", k.ofertasEnviadas, kPrev.ofertasEnviadas),
        fila("Tasa de respuesta", "pct", k.tasaRespuesta, kPrev.tasaRespuesta),
        fila("Procesos ganados", "entero", k.ganados, kPrev.ganados),
        fila("Procesos perdidos", "entero", k.perdidos, kPrev.perdidos),
        fila("Tasa de éxito", "pct", k.tasaExito, kPrev.tasaExito),
        fila("Brecha promedio con el adjudicado", "pct", k.brechaPromedio, kPrev.brechaPromedio),
        fila("Clientes con contrato", "entero", k.clientesActivos, kPrev.clientesActivos),
        fila("Entrega a tiempo", "pct", k.entregaATiempo, kPrev.entregaATiempo),
        fila("Evaluación promedio (0–100)", "decimal", k.evaluacionPromedio, kPrev.evaluacionPromedio),
      ],
      tipoPorFila: tipos,
    },
    {
      id: "mensual",
      titulo: "Evolución mensual",
      columnas: [
        { titulo: "Mes", tipo: "texto" },
        { titulo: `Adjudicado (${m})`, tipo: "moneda" },
        { titulo: "Invitaciones", tipo: "entero" },
        { titulo: "Ofertas enviadas", tipo: "entero" },
        { titulo: "Ganados", tipo: "entero" },
      ],
      filas: mesAdj.map((g, i) => [g.etiqueta, g.valor, mesInv[i]?.valor ?? 0, mesOf[i]?.valor ?? 0, mesGan[i]?.valor ?? 0]),
    },
    {
      id: "embudo",
      titulo: "Embudo de invitaciones",
      descripcion: "Invitaciones recibidas en el período y hasta dónde llegaron.",
      columnas: [
        { titulo: "Etapa", tipo: "texto" },
        { titulo: "Procesos", tipo: "entero" },
        { titulo: "% de invitaciones", tipo: "pct" },
      ],
      filas: embudo(d, actual).map((e) => [e.etapa, e.procesos, e.pct]),
    },
    {
      id: "clientes",
      titulo: "Clientes",
      columnas: [
        { titulo: "Cliente", tipo: "texto" },
        { titulo: `Adjudicado (${m})`, tipo: "moneda" },
        { titulo: "Participación", tipo: "pct" },
        { titulo: "Contratos", tipo: "entero" },
        { titulo: "Tasa de éxito", tipo: "pct" },
        { titulo: "Evaluación promedio", tipo: "decimal" },
      ],
      filas: [...clientes].map((c) => {
        const v = porCliente.find((g) => g.clave === c)?.valor ?? 0;
        return [c, v, totalAdj ? v / totalAdj : 0, contratosCliente.get(c) ?? 0, exitoCliente.get(c) ?? null, evalCliente.get(c) ?? null];
      }).sort((a, b) => (b[1] as number) - (a[1] as number)),
    },
    {
      id: "categorias",
      titulo: "Categorías",
      columnas: [
        { titulo: "Categoría", tipo: "texto" },
        { titulo: `Adjudicado (${m})`, tipo: "moneda" },
        { titulo: "Tasa de éxito", tipo: "pct" },
      ],
      filas: [...categorias].map((c) => [c, porCategoria.find((g) => g.clave === c)?.valor ?? 0, exitoCategoria.get(c) ?? null] as Celda[]).sort((a, b) => (b[1] as number) - (a[1] as number)),
    },
    {
      id: "competitividad",
      titulo: "Procesos perdidos",
      descripcion: "Posición por precio final y brecha con el precio adjudicado, cuando el comprador comparte esa información.",
      columnas: [
        { titulo: "Proceso", tipo: "texto" },
        { titulo: "Cliente", tipo: "texto" },
        { titulo: "Categoría", tipo: "texto" },
        { titulo: "Decidido", tipo: "fecha" },
        { titulo: "Moneda", tipo: "texto" },
        { titulo: "Tu precio final", tipo: "moneda" },
        { titulo: "Posición", tipo: "texto" },
        { titulo: "Brecha", tipo: "pct" },
      ],
      filas: decididos(d, actual)
        .filter((p) => p.resultado === "perdido")
        .map((p) => [
          `${p.codigo} — ${p.titulo}`,
          p.cliente,
          p.categoria,
          p.fechaResultado,
          p.moneda,
          p.miPrecioFinal,
          p.posicion != null ? `${p.posicion}° de ${p.participantes}` : "No compartido",
          p.brechaPct,
        ]),
    },
    {
      id: "cobros",
      titulo: "Pagos por cobrar",
      descripcion: "A la fecha de generación.",
      columnas: [
        { titulo: "Contrato", tipo: "texto" },
        { titulo: "Cliente", tipo: "texto" },
        { titulo: "Monto", tipo: "moneda" },
        { titulo: "Moneda", tipo: "texto" },
        { titulo: "Fecha pactada", tipo: "fecha" },
        { titulo: "Estado", tipo: "texto" },
      ],
      filas: d.pagos
        .filter((p) => p.estado !== "PAGADO")
        .map((p) => [p.contrato, p.cliente, p.monto, p.moneda, p.pactada, p.estado === "VENCIDO" || new Date(p.pactada).getTime() < ahora ? "Vencido" : "Pendiente"]),
    },
    {
      id: "vencimientos",
      titulo: "Contratos por vencer (90 días)",
      columnas: [
        { titulo: "Contrato", tipo: "texto" },
        { titulo: "Cliente", tipo: "texto" },
        { titulo: "Categoría", tipo: "texto" },
        { titulo: "Monto", tipo: "moneda" },
        { titulo: "Moneda", tipo: "texto" },
        { titulo: "Vence", tipo: "fecha" },
        { titulo: "Días", tipo: "entero" },
      ],
      filas: cob.porVencer.map((c) => [c.codigo, c.cliente, c.categoria, c.monto, c.moneda, c.vigenciaFin, c.dias]),
    },
    {
      id: "evaluaciones",
      titulo: "Evaluaciones de desempeño",
      columnas: [
        { titulo: "Fecha", tipo: "fecha" },
        { titulo: "Cliente", tipo: "texto" },
        { titulo: "Contrato", tipo: "texto" },
        { titulo: "Calidad", tipo: "entero" },
        { titulo: "Plazos", tipo: "entero" },
        { titulo: "Servicio", tipo: "entero" },
        { titulo: "HSE", tipo: "entero" },
        { titulo: "Puntaje", tipo: "entero" },
      ],
      filas: d.evaluaciones
        .filter((e) => new Date(e.fecha).getTime() >= actual.desde && new Date(e.fecha).getTime() < actual.hasta)
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((e) => [e.fecha, e.cliente, e.contrato, e.calidad, e.plazos, e.servicio, e.hse, e.puntaje]),
    },
    {
      id: "procesos",
      titulo: "Detalle de procesos",
      descripcion: "Invitaciones recibidas o procesos decididos en el período.",
      columnas: [
        { titulo: "Código", tipo: "texto" },
        { titulo: "Título", tipo: "texto" },
        { titulo: "Cliente", tipo: "texto" },
        { titulo: "Categoría", tipo: "texto" },
        { titulo: "Invitado", tipo: "fecha" },
        { titulo: "Moneda", tipo: "texto" },
        { titulo: "Tu oferta", tipo: "moneda" },
        { titulo: "Tu precio final", tipo: "moneda" },
        { titulo: "Negociado", tipo: "texto" },
        { titulo: "Resultado", tipo: "texto" },
        { titulo: "Decidido", tipo: "fecha" },
        { titulo: "Precio adjudicado", tipo: "moneda" },
      ],
      filas: [...procesosPeriodo.values()]
        .sort((a, b) => b.invitado.localeCompare(a.invitado))
        .map((p) => [
          p.codigo,
          p.titulo,
          p.cliente,
          p.categoria,
          p.invitado,
          p.moneda,
          p.miPrecio,
          p.miPrecioFinal,
          p.negociado ? "Sí" : "No",
          p.declinada && !p.ofertaEnviada ? "Declinada" : RESULTADO[p.resultado],
          p.fechaResultado,
          p.precioAdjudicado,
        ]),
    },
    {
      id: "hallazgos",
      titulo: "Hallazgos",
      columnas: [
        { titulo: "Nivel", tipo: "texto" },
        { titulo: "Hallazgo", tipo: "texto" },
        { titulo: "Detalle", tipo: "texto" },
      ],
      filas: insights.map((i) => [{ critico: "Crítico", atencion: "Atención", positivo: "Positivo", info: "Información" }[i.nivel], i.titulo, i.detalle]),
    },
  ];

  const otras = new Set([...datos.contratos, ...datos.procesos].map((r) => r.moneda).filter((x) => x !== m));
  const notas = [
    `Montos en ${m}.${otras.size ? ` Tienes actividad también en ${[...otras].join(", ")}: cámbiala en el filtro de moneda.` : ""}`,
    "Adjudicado = contratos y POs firmados en el período (las POs emitidas contra un contrato marco no se suman de nuevo). Tasa de éxito = ganados / procesos decididos en los que enviaste oferta.",
    "La posición y la brecha solo aparecen en procesos cuyo comprador decidió compartirlas; nunca se muestran el nombre del ganador ni los precios de otros proveedores.",
  ];
  if (datos.truncado) notas.push("El período tiene más de 5.000 registros: se analizaron los más recientes.");

  return {
    proveedor: datos.proveedor,
    moneda: m,
    periodo: { desde: datos.desde, hasta: datos.hasta, desdeAnterior: datos.desdeAnterior },
    filtros: etiquetasFiltro,
    generadoEn: new Date(ahora).toISOString(),
    visitasVitrina: datos.visitasVitrina,
    kpis: k,
    kpisAnterior: kPrev,
    cobros: cob,
    insights,
    secciones,
    notas,
  };
}

export function documentoPdfProveedor(inf: InformeProveedor): DocumentoPdf {
  const m = inf.moneda;
  const k = inf.kpis;
  const kp = inf.kpisAnterior;
  const sec = (id: string) => inf.secciones.find((s) => s.id === id)!;
  const mensual = sec("mensual");
  return {
    titulo: "Informe de desempeño comercial",
    linea1: `${inf.proveedor} · ${inf.periodo.desde} a ${inf.periodo.hasta} · montos en ${m}`,
    linea2: `Filtros: ${inf.filtros.length ? inf.filtros.join(" · ") : "ninguno"} · generado ${new Date(inf.generadoEn).toLocaleString("es-CO")}`,
    pie: `${inf.proveedor} · Mi desempeño en Procurex`,
    archivo: `mi-desempeno_${inf.periodo.desde}_${inf.periodo.hasta}.pdf`,
    moneda: m,
    tarjetas: [
      { t: "Monto adjudicado", v: formatMoneyCompact(k.adjudicado, m), a: k.adjudicado, b: kp.adjudicado, subirEsBueno: true },
      { t: "Procesos ganados", v: `${k.ganados} de ${k.ganados + k.perdidos}`, a: k.ganados, b: kp.ganados, subirEsBueno: true },
      { t: "Tasa de éxito", v: textoCelda(k.tasaExito, "pct", m), a: k.tasaExito, b: kp.tasaExito, subirEsBueno: true },
      { t: "Tasa de respuesta", v: textoCelda(k.tasaRespuesta, "pct", m), a: k.tasaRespuesta, b: kp.tasaRespuesta, subirEsBueno: true },
      { t: "Brecha con el adjudicado", v: textoCelda(k.brechaPromedio, "pct", m), a: k.brechaPromedio, b: kp.brechaPromedio, subirEsBueno: false },
      { t: "Entrega a tiempo", v: textoCelda(k.entregaATiempo, "pct", m), a: k.entregaATiempo, b: kp.entregaATiempo, subirEsBueno: true },
      { t: "Evaluación promedio", v: k.evaluacionPromedio != null ? `${Math.round(k.evaluacionPromedio)}/100` : "—", a: k.evaluacionPromedio, b: kp.evaluacionPromedio, subirEsBueno: true },
      { t: "Por cobrar", v: formatMoneyCompact(inf.cobros.porCobrar, m), a: null, b: null, subirEsBueno: true, nota: `A hoy · vencido ${formatMoneyCompact(inf.cobros.vencido, m)}` },
    ],
    hallazgos: inf.insights,
    graficas: [
      { titulo: "Monto adjudicado por mes", tipo: "vertical", datos: mensual.filas.map((f) => [String(f[0]), Number(f[1] ?? 0)]), formato: "moneda" },
      { titulo: "Ofertas enviadas por mes", tipo: "vertical", datos: mensual.filas.map((f) => [String(f[0]), Number(f[3] ?? 0)]), formato: "entero" },
      { titulo: "Adjudicado por cliente", tipo: "horizontal", datos: sec("clientes").filas.slice(0, 8).map((f) => [String(f[0]), Number(f[1] ?? 0)]), formato: "moneda" },
    ],
    tablas: (
      [
        ["embudo", 10],
        ["clientes", 20],
        ["categorias", 20],
        ["competitividad", 25],
        ["cobros", 25],
        ["vencimientos", 20],
        ["evaluaciones", 20],
      ] as [string, number][]
    ).map(([id, limite]) => ({ seccion: sec(id), limite })),
    notas: inf.notas,
  };
}
