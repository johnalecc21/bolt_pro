# Flujo de la Plataforma — Procurex

> Backend real: NestJS + Prisma + PostgreSQL (Supabase), con autenticación real vía Supabase Auth (incluye MFA/2FA real y login con Google). Todo lo que se crea, aprueba, oferta, adjudica o firma persiste de verdad en la base de datos — no hay datos mock detrás del flujo de negocio. `src/lib/mock/*.ts` solo conserva etiquetas y tipos compartidos (nombres de roles, tipos de notificación); ninguna pantalla muestra datos o acciones simuladas.

## Arquitectura general

Hay 3 portales independientes, cada uno con su propio login, pero comparten el mismo router, el mismo backend y la misma base de datos.

```
/                    → Landing (elige portal)
/cliente/*           → Portal Cliente (comprador)
/proveedor/*         → Portal Proveedores
/interno/*           → Panel Interno (consultores/compliance)
```

Repos: `bolt_procure` (frontend, React + Vite + TS) y `bolt_procure_backend` (API NestJS + Prisma, Postgres en Supabase).

## Autenticación (los 3 portales)

1. Escribes email/contraseña → `AuthContext` llama a `supabase.auth.signInWithPassword` (Supabase Auth real, no una lista mock).
2. Si el usuario tiene MFA (TOTP) enrolado → pantalla de código de 6 dígitos, verificada de verdad vía `supabase.auth.mfa.challengeAndVerify` (no hay código fijo de demo).
3. También existe login con Google (OAuth real vía Supabase).
4. Si el usuario tiene más de una empresa (ej. `admin@acme.com`) → selector de empresa.
5. La sesión la persiste y refresca automáticamente el SDK de Supabase (sobrevive a refrescos de página).
6. `ProtectedRoute` bloquea el portal si no perteneces a él; `RequireRole` bloquea pantallas específicas según tu rol (ej. solo Admin Cliente ve "Usuarios y Roles"), o las deja en modo solo-lectura para roles con acceso parcial (ej. Aprobador/CFO en Licitaciones).

### Usuarios demo (contraseña `demo123` para todos)

Los logins solo muestran estas credenciales si el frontend se compila con `VITE_MOSTRAR_CREDENCIALES_DEMO=true` (úsalo solo en entornos de demostración).

| Portal | Email | Rol | Notas |
|---|---|---|---|
| Cliente | `carlos@acme.com` | Comprador | Acceso estándar |
| Cliente | `admin@acme.com` | Admin Cliente | 2 empresas (Acme S.A. y TechCorp) |
| Proveedor | `contacto@cloudsphere.com` | Proveedor (CloudSphere Technologies) | |
| Interno | `ana.consultora@procureos.com` | Consultor | |
| Interno | `compliance@procureos.com` | Compliance / Ops | |

También puedes auto-registrar una empresa proveedora nueva desde `/proveedor/registro` — crea un usuario y un `ProveedorProfile` reales; el portal muestra sus propios datos (vacíos al inicio), no el escenario de ejemplo de CloudSphere.

## El flujo central: Portal Cliente (ciclo de compra completo)

Este es el corazón de la plataforma — sigue un requerimiento de principio a fin, todo persistido en Postgres:

1. **Nuevo Requerimiento** (`/cliente/requerimientos/nuevo`) — formulario de varios pasos: descripción, categoría y **prioridad** (normal/alta/urgente), presupuesto y fecha de cierre (se interpreta como el final de ese día en el país de la empresa), criterios ponderados (deben sumar 100%), shortlist de proveedores, revisión. Al enviar crea un requerimiento real; según el monto y la **Matriz de Aprobación** de la empresa, genera automáticamente la aprobación que corresponda (rol requerido, único o secuencial).
2. **Detalle del Requerimiento** — timeline del proceso, comentarios, documentos adjuntos.
3. **Bandeja de Aprobaciones** — el rol que la Matriz de Aprobación determine (Comprador, Admin Cliente o Aprobador/CFO, según el monto) aprueba o rechaza (con motivo obligatorio); solo al aprobar se envían las invitaciones a los proveedores. Si se **rechaza**, el requerimiento vuelve a **borrador** (deja de contar en el presupuesto), el solicitante recibe una notificación con el motivo y desde el detalle puede **corregir y reenviar**: se vuelve a aplicar la matriz y el control de presupuesto.
4. **Licitación en Curso** (`/cliente/licitaciones/:id`) — cuenta regresiva real hasta el cierre; **extender plazo** y **cerrar anticipadamente** cambian la fecha en el servidor, que rechaza ofertas nuevas o editadas desde el cierre; estado real de cada proveedor invitado (invitado / visto / declinó / oferta enviada, tomado de sus invitaciones y ofertas reales — no relleno), y **Preguntas y Respuestas real**: el proveedor invitado pregunta, el comprador responde, y cada lado recibe una notificación real con link directo a la pantalla correspondiente.
5. **Cuadro Comparativo** (`/cliente/licitaciones/:id/comparativo`) — ranking calculado en vivo por score ponderado sobre las ofertas reales recibidas, detecta ofertas atípicas, puedes ajustar los pesos (queda en el log de auditoría). Desde aquí decides:
   - **Negociación** (`/cliente/negociacion/:id`) — subasta inversa en vivo vía WebSocket (Socket.IO). Eliges duración (30 min a 24 h) y si entran los 3 mejores precios o todos los ofertantes; participantes y montos iniciales salen de las ofertas reales en el servidor. Iniciar la ronda cierra la licitación y pasa el proceso a *En negociación*. Cada puja se valida en la base de datos (ronda abierta, antes del plazo y mejor que la anterior). Al **cerrar la ronda** (o al vencer), se adjudica a la mejor puja con ese precio.
   - o **Adjudicar directamente** a la mejor oferta según los pesos.
   En ambos casos el precio y las condiciones los fija el servidor a partir de la oferta o de la puja final, nunca el navegador.
6. **Adjudicación** (`/cliente/adjudicacion/:id`) — confirmas al ganador (pasa a *Adjudicado* y se le notifica una vez) → si supera el umbral legal de su moneda (≈ USD 50.000: 200M COP, 1M MXN, 190K PEN, 47M CLP, 280K BRL) se bloquea hasta marcar "revisión legal" → **"Firmar y generar contrato"**: registra la firma, crea el Contrato con sus hitos, pasa el proceso a *En cumplimiento* y notifica al ganador y (según el checkbox) a los perdedores. No se puede firmar dos veces.
7. **Contratos / POs** — repositorio real de todo lo firmado. Por cada contrato puedes **descargar un PDF** (generado con la plantilla Procurex a partir de los datos reales) o **adjuntar el PO/contrato propio de la empresa** (subida real a Supabase Storage) — si adjuntas uno, la descarga entrega ese archivo en vez de la plantilla, y el proveedor ve el mismo documento adjunto desde su portal.
8. **Seguimiento** — hitos de cumplimiento post-PO (a tiempo / en riesgo / atrasado) reales, editables; puedes agregar/eliminar hitos y reportar una incidencia (abre una Disputa real referenciando el contrato). Al completar un hito con porcentaje de pago se genera su pago (una sola vez); cuando **todos** los hitos están completados el proceso pasa a **Cerrado**.
9. **Disputas** — hilo de mediación real por caso.
10. **Analítica CFO** (`/cliente/analitica`, CFO y Admin) — tablero con una sola fila de filtros (período: 3/6/12 meses, este año, año anterior o personalizado; unidad de negocio; centro de costo; categoría) que aplica a todo:
    - **Resumen**: 8 indicadores con variación contra el período anterior de igual duración (gasto comprometido, ahorro y ahorro %, ahorro por negociación, procesos adjudicados, ciclo promedio y mediana, ofertas por proceso, entrega a tiempo, pagos vencidos) y **hallazgos** calculados con los datos (pagos vencidos, centros sobre presupuesto, concentración de proveedores, baja competencia, ciclos lentos, entregas tardías, evaluaciones bajas, contratos por vencer, variación del ahorro).
    - Pestañas **Gasto, Ahorro, Eficiencia** (embudo de procesos, ciclo y competencia por categoría, prioridad y solicitante), **Proveedores** (HHI, participación del principal y del top 5, desempeño y entrega a tiempo por proveedor), **Presupuesto** (ejecución por centro, igual que en Estructura), **Pagos** (por pagar, vencidos, próximos 30 días) y **Detalle** (todos los procesos del período con búsqueda).
    - **Mis gráficas**: cada usuario arma y guarda gráficas propias cruzando 10 indicadores con 8 dimensiones (mes, trimestre, categoría, proveedor, centro de costo, unidad, prioridad, solicitante), en barras, barras horizontales, líneas o área.
    - Cada gráfica tiene su vista de **tabla**; cada tabla se descarga en **CSV**; **Exportar** genera el **informe ejecutivo en PDF** (indicadores, hallazgos, gráficas y tablas) y el **Excel** completo (una hoja por sección).
    - Todo sale de un mismo conjunto de filas (`GET /analitica/cfo`) y de un único cálculo en el frontend, así que pantalla, PDF, Excel y CSV siempre coinciden. Los montos se suman solo en la moneda base de la empresa (lo que está en otra moneda se informa aparte) y las POs emitidas contra un contrato marco no se suman dos veces.

### Otras pantallas de Cliente
- **Configurar empresa** (`/cliente/onboarding`, Admin) — checklist real que se marca solo: datos de la empresa, equipo invitado, matriz de aprobación, centros de costo (opcional) y primer requerimiento, cada uno con enlace a su pantalla.
- **Configuración de cuenta** — cada usuario edita su nombre y cargo.
- **Usuarios y Roles** / **Matriz de Aprobación** — solo Admin Cliente; ahí también se activa la **retroalimentación a proveedores** (mostrar a quien pierde su posición y brecha con el adjudicado, desactivada por defecto); la Matriz es la que realmente decide quién debe aprobar cada requerimiento (no es solo informativa). En la misma pantalla se configuran país y **moneda base** de la empresa (COP, USD, MXN, PEN, CLP, BRL) y los **requisitos de homologación**: qué categorías de documentos (p. ej. HSE, SARLAFT) debe tener validadas un proveedor para poder invitarlo.
- **Estructura y presupuestos** (`/cliente/estructura`, Admin y CFO) — sedes o unidades de negocio, centros de costo y presupuesto anual por centro, con la ejecución (comprometido en contratos, en proceso en requerimientos, disponible). Al crear un requerimiento se elige el centro de costo (obligatorio si la empresa lo exige); si supera lo disponible, igual se envía pero como **excepción de presupuesto** con el CFO en la aprobación.
- **Configuración de cuenta** — cada usuario decide si recibe las notificaciones por **correo**; Admin y CFO ven el **plan y su uso** (usuarios, requerimientos del mes, almacenamiento) y exportan la **auditoría en CSV**; el Admin define cuánto tiempo se conserva.
- **Listados paginados en el servidor** — Requerimientos (con filtro por centro de costo), Contratos y Directorio buscan y paginan en la API, así escalan a miles de registros.
- **Evaluación de desempeño** (desde Seguimiento) — calidad, plazos, servicio y HSE de 1 a 5 por contrato; el promedio de toda la red se ve en el Directorio.
- **Directorio de Proveedores** — explora toda la red, no solo los invitados.
- **Centro de Notificaciones** — al hacer clic en una notificación te lleva directo a la pantalla del asunto (aprobación pendiente resaltada en la bandeja, pregunta sin responder, oferta, etc.), no solo la marca como leída.
- **Configuración de Cuenta**.

## Portal Proveedores (el espejo del otro lado)

1. **Registro/Login** (real, Supabase Auth) → completas **Homologación** (documentos subidos de verdad a Supabase Storage). Los 4 obligatorios (legal, financiero, certificaciones, referencias) habilitan el envío; HSE, sostenibilidad, centrales de riesgo y SARLAFT son opcionales, suman puntaje y algunos clientes los exigen. Al enviar: OCR real (tesseract) con detección de NIT y cruce real de la razón social y el representante legal contra OFAC/SDN y la lista consolidada de la ONU → queda "en revisión" o "zona gris".
2. **Estado de Homologación** — el proveedor ve su propio score y checklist real (lo aprueba/rechaza el panel interno).
3. **Invitaciones** — recibe la invitación real cuando su requerimiento queda aprobado; acepta o declina.
4. **Mis Ofertas** — lista real de todo proceso que aceptó, con su estado (borrador / enviada) y monto; entra a cada uno para completar el formulario estandarizado y enviarlo. También puede preguntar en la sección de Q&A del proceso.
5. **Subasta en Vivo** — si el comprador activa negociación, el proveedor ve **solo su posición** (nunca montos ni identidad de los demás), conectado en vivo por WebSocket a la misma sala que ve el comprador en Negociación.
6. **Historial** — procesos ganados/perdidos reales con feedback.
7. **Mis Contratos** — igual que Contratos del lado cliente: ve sus contratos reales con hitos, y descarga el PDF (plantilla Procurex o el documento propio que haya adjuntado el cliente).
8. **Pagos/Pronto Pago** — simulador de descuento por adelanto sobre sus POs.
9. **Perfil de Empresa** — certificaciones, usuarios con acceso al portal y enlace a su **vitrina pública** (`/vitrina/:id`, sin login) para compartir con prospectos.
   - **Mi Vitrina** (`/proveedor/vitrina`) — el proveedor arma su vitrina: presentación, correo/teléfono comercial, video (YouTube/Vimeo), galería de hasta 20 imágenes, brochures y catálogos en PDF (hasta 5 de cada uno) y un catálogo de productos/servicios con foto y precio de referencia. Ve cuántas visitas tiene su vitrina. Los compradores la encuentran en el Directorio, que también busca por descripción y por productos del catálogo.
10. **Evaluaciones de desempeño** (en Historial) — lo que sus clientes calificaron por contrato, con aviso de plan de mejora bajo 60/100.
11. **Mi desempeño** (`/proveedor/desempeno`) — la analítica del proveedor, solo con sus propios datos: monto adjudicado, tasa de éxito y de respuesta, embudo de invitaciones, ventas por mes, cliente y categoría, cumplimiento de hitos, evaluaciones, cobros (por cobrar, vencidos, próximos 30 días), contratos por vencer y visitas a su vitrina, con variación contra el período anterior y hallazgos. Filtros de período, moneda, cliente y categoría; exporta informe PDF, Excel y CSV. En los procesos perdidos ve su **posición por precio y la brecha con el precio adjudicado solo si la empresa compradora lo activó**; nunca ve el nombre del ganador ni precios de otros proveedores (y lo mismo aplica en el feedback del Historial).

## Panel Interno (quién opera todo por detrás)

Corre contra el mismo backend; no se tocó a fondo en la última ronda de trabajo, pero la arquitectura es la misma (NestJS + Prisma, sin mocks en la capa de datos):

- **Casos Activos** — carga de trabajo del consultor/compliance del día.
- **Cola de Homologación** — compliance aprueba/rechaza a los proveedores en "zona gris" (resuelve el paso 1 del proveedor), viendo los documentos reales que subió y el resultado por lista restrictiva. Para proveedores colombianos registra la consulta manual en Procuraduría, Contraloría y Policía (no tienen API pública); no se puede aprobar con listas pendientes, caídas o con coincidencias sin resolver. También valida uno a uno los documentos opcionales que suba un proveedor ya homologado.
- **Mediación de Disputas** — vista espejo de las disputas del cliente.
- **Admin Clientes** — "entrar como" un cliente (impersonación), queda registrado en auditoría.
- **Benchmark de Mercado** — índice de precios que alimenta las alertas de anomalías del comparativo.

## Lo que conecta todo

- **Log de auditoría** (visible en Contratos e Interno › Admin Clientes): cada aprobación, rechazo, cambio de score, impersonación o documento adjuntado queda ahí, sin importar desde qué portal se generó — todo backend-real.
- **RBAC**: cada rol ve un menú distinto; algunas pantallas se muestran en modo solo-lectura según el rol.
- **Multi-empresa**: si inicias sesión como Admin Cliente y cambias de Acme a TechCorp (menú del avatar), los requerimientos y contratos que ves cambian por completo (filtrado real por `companyId`).
- **Notificaciones**: la campana del header y el Centro de Notificaciones comparten el mismo estado real (leído/no leído), y cada notificación enlaza a la pantalla donde realmente puedes actuar sobre ella.
- **Gráficas**: la analítica usa una paleta validada para daltonismo y modo oscuro (tokens `--viz-*`), una sola fila de filtros y una vista de tabla por gráfica.

## Limitaciones conocidas (para tener en cuenta)

- **Firma electrónica**: "Firmar y generar contrato" registra la firma dentro de Procurex (con usuario y fecha en la bitácora); no hay integración con un proveedor externo de e-signature (DocuSign, etc.).
- **Listas colombianas manuales**: Procuraduría, Contraloría y Policía no tienen API pública; quedan como verificación manual que Compliance registra. OFAC y ONU sí se consultan automáticamente (si la lista no responde, el caso va a zona gris en vez de asumirse limpio).
- **Moneda**: los montos son enteros en unidades completas y cada requerimiento/contrato/pago lleva su moneda. No hay conversión de tasas: la analítica solo agrega lo que está en la moneda base de la empresa.
- **"Actividad reciente"** (Dashboard) muestra las últimas entradas reales de la bitácora de auditoría.
- **"Recordatorios de vencimiento"** (Contratos) ya es real: un cron diario (`VencimientosService`, `@nestjs/schedule`) revisa todos los contratos/POs activos, los pasa a "Por vencer"/"Vencido" según su `vigenciaFin`, y notifica una sola vez por umbral (60/30/15 días) a compradores y admins de la empresa.
- **Documentos adjuntos a un Requerimiento** ya usan almacenamiento real (bucket `requerimientos-documentos` en Supabase Storage), mismo patrón de URL firmada que Homologación y Contratos.
- **Idioma**: la plataforma está solo en español.
- **Pagos/Pronto Pago** es un simulador de descuento, no una integración financiera real.
