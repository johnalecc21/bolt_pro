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

1. **Nuevo Requerimiento** (`/cliente/requerimientos/nuevo`) — formulario de varios pasos: descripción, categoría y **prioridad** (normal/alta/urgente), presupuesto y fecha de cierre (se interpreta como el final de ese día en el país de la empresa), criterios ponderados (deben sumar 100%), shortlist de proveedores, revisión. Opcionalmente se agregan **ítems a cotizar** (descripción, cantidad y unidad, hasta 200 líneas): con ítems, cada proveedor cotiza precio unitario por línea y la adjudicación puede dividirse por ítem; sin ítems, se cotiza un valor total como antes. Los ítems se pueden corregir (agregar, quitar o cambiar cantidades) en "Corregir y reenviar" de un requerimiento devuelto; solo se reemplazan si cambiaron. Al enviar crea un requerimiento real; según el monto y la **Matriz de Aprobación** de la empresa, genera automáticamente la aprobación que corresponda (rol requerido, único o secuencial).
2. **Detalle del Requerimiento** — timeline del proceso, comentarios, documentos adjuntos.
3. **Bandeja de Aprobaciones** — el rol que la Matriz de Aprobación determine (Comprador, Admin Cliente o Aprobador/CFO, según el monto) aprueba o rechaza (con motivo obligatorio); solo al aprobar se envían las invitaciones a los proveedores. Si se **rechaza**, el requerimiento vuelve a **borrador** (deja de contar en el presupuesto), el solicitante recibe una notificación con el motivo y desde el detalle puede **corregir y reenviar**: se vuelve a aplicar la matriz y el control de presupuesto.
4. **Licitación en Curso** (`/cliente/licitaciones/:id`) — cuenta regresiva real hasta el cierre; **extender plazo** y **cerrar anticipadamente** cambian la fecha en el servidor, que rechaza ofertas nuevas o editadas desde el cierre; estado real de cada proveedor invitado (invitado / visto / declinó / oferta enviada, tomado de sus invitaciones y ofertas reales — no relleno), y **Preguntas y Respuestas real**: el proveedor invitado pregunta, el comprador responde, y cada lado recibe una notificación real con link directo a la pantalla correspondiente.
5. **Cuadro Comparativo** (`/cliente/licitaciones/:id/comparativo`) — ranking calculado en vivo por score ponderado sobre las ofertas reales recibidas, detecta ofertas atípicas, puedes ajustar los pesos (queda en el log de auditoría). En un requerimiento con ítems, una oferta que no cotizó todo se marca "cotizó N de M ítems" y, para el ranking, cada línea que no cotizó cuenta al precio más alto de esa línea (así cubrir menos no parece más barato). Debajo aparece el **comparativo por ítem**: precio unitario y subtotal de cada proveedor por línea, el más barato marcado con ícono y la palabra "Mejor", la **mejor combinación por ítem** frente al **mejor proveedor único** que cotizó todo, y el ahorro de dividir. Desde aquí decides:
   - **Adjudicar por ítems**: cada línea arranca asignada al más barato; puedes cambiarla a cualquier proveedor que la cotizó o dejarla **desierta**. Cada proveedor elegido recibe su propia adjudicación, orden de compra (`PO-año-número-1`, `-2`…) y contrato.
   - **Negociación** (`/cliente/negociacion/:id`) — subasta inversa en vivo vía WebSocket (Socket.IO). Eliges duración (30 min a 24 h) y si entran los 3 mejores precios o todos los ofertantes; participantes y montos iniciales salen de las ofertas reales en el servidor. Iniciar la ronda cierra la licitación y pasa el proceso a *En negociación*. Cada puja se valida en la base de datos (ronda abierta, antes del plazo y mejor que la anterior). Al **cerrar la ronda** (o al vencer), se adjudica a la mejor puja con ese precio.
   - o **Adjudicar todo** a la mejor oferta según los pesos (en un requerimiento con ítems, se le adjudican las líneas que cotizó).
   En todos los casos el precio y las condiciones los fija el servidor a partir de la oferta o de la puja final, nunca el navegador. Si hubo negociación, las líneas de ese proveedor se escalan en la proporción puja/oferta (y si gana todo lo que cotizó, el monto es exactamente su puja). Un ítem no se adjudica dos veces y un proceso se adjudica una sola vez.
6. **Adjudicación** (`/cliente/adjudicacion/:id`) — una tarjeta por proveedor adjudicado con sus líneas, condiciones y vista previa de la PO, más el ahorro sobre el total y los ítems desiertos. Confirmas la decisión (pasa a *Adjudicado* y se notifica una vez a cada ganador) → cada contrato se firma por separado: si supera el umbral legal de su moneda (≈ USD 50.000: 200M COP, 1M MXN, 190K PEN, 47M CLP, 280K BRL) se bloquea hasta marcar "revisión legal" → **"Firmar y generar contrato"**: registra la firma, crea el Contrato con sus hitos, notifica a ese ganador; cuando se firma el **último** contrato el proceso pasa a *En cumplimiento* y (según el checkbox) se notifica a quienes no ganaron nada. No se puede firmar dos veces. Mientras un proceso dividido tiene algún contrato firmado, el presupuesto cuenta lo firmado (no el estimado).
7. **Contratos / POs** (`/cliente/contratos`) — lista paginada con búsqueda y filtros por categoría y **estado** (activo, por vencer, vencido, terminado); cada fila abre la **ficha del contrato** (`/cliente/contratos/:id`), que reúne todo en un lugar:
   - Valor, pagado/liberado (o **saldo** si es marco), vigencia con días restantes y avance de entregas.
   - **Hitos de entrega y pago** con su % y valor, el avance reportado por el proveedor y "Marcar como recibido" (con confirmación: libera el pago y ya no se puede reabrir). Muestra cuánto % del valor está asignado y la **penalidad estimada** por atrasos según la cláusula que configuró la empresa (porcentaje diario, tope, días de gracia y base, en Plantillas y documentos › Marca y datos). Si la empresa no la configuró, no se muestra ninguna.
   - **Ítems adjudicados**, **pagos** con el estado de su factura, **condiciones** (vigencia, orden de compra, marco padre, pago desde la factura, plazo, garantía, centro de costo) y enlace al requerimiento de origen.
   - **Modificaciones** con historial: **prorrogar** (Comprador/Admin; reactiva un contrato vencido; una PO no puede pasar la vigencia de su marco), **cambiar el valor** (Admin/CFO; no por debajo de lo ya liberado o de las POs emitidas) y **terminar anticipadamente** (Admin/CFO; los pagos liberados se mantienen, los hitos pendientes dejan de liberar pagos). Cada una exige motivo y notifica al proveedor.
   - **Documento firmado con versiones**: cada subida queda como una versión descargable; la vigente es la que descarga el proveedor. Sin documento propio, se descarga el PDF de Procurex (con ítems, hitos y su %, y la cláusula de pago desde la factura).
   - **Evaluación del proveedor** del contrato.
   - **Contrato Marco** (a partir del umbral de la empresa): es un techo, no se paga por hitos. Se ejecuta **emitiendo POs** desde su ficha: cada PO descuenta del saldo (no se puede pasar, ni con dos emisiones simultáneas), queda dentro de su vigencia, hereda proveedor y condiciones de pago, nace con un hito de entrega del 100% y se notifica al proveedor. El proceso de compra no se cierra mientras el marco siga vigente.
8. **Seguimiento de entregas** — filtros *En ejecución / Con atrasos / Todos*; los hitos se marcan solos **en riesgo** 3 días antes y **atrasados** al pasar su fecha (en pantalla y por el cron diario). Los % de pago de un contrato no pueden sumar más de 100% (se muestra cuánto falta), un hito que ya liberó pago no se reabre, no cambia su % ni se elimina, y recibir un hito pide confirmación. También se ve lo que reporta el proveedor, y desde cada contrato se abre su ficha, se evalúa o se reporta una incidencia (Disputa). Cuando todos los contratos del proceso están cumplidos o terminados (y no queda un marco vigente), el proceso pasa a **Cerrado**.
9. **Cuentas por pagar** (`/cliente/pagos`, Comprador, Admin y CFO) — cada pago liberado por un hito, con la factura que radicó el proveedor. Filtros *Requieren acción / Por pagar / Pagados / Todos*, búsqueda y totales (por pagar, vencido, vence en 30 días, facturas por revisar). Por pago:
   - **Aprobar o rechazar la factura** (con motivo; el proveedor la corrige y radica otra, y queda el historial). Comprador, Admin o CFO.
   - **Registrar el pago** (fecha, referencia bancaria y soporte opcional) — solo con factura aprobada; solo Admin o CFO; no se registra dos veces. Se paga el neto de cualquier descuento de pronto pago.
   - **Responder solicitudes de pronto pago** — aceptar cambia la fecha pactada y fija el descuento; Admin o CFO.
   El plazo de pago del contrato cuenta desde la **radicación** de la factura. Un pago sin pagar después de su fecha se muestra *Vencido* al instante y el cron diario lo guarda así. Todo queda en la bitácora de auditoría y cada decisión notifica al otro lado.
10. **Disputas** — hilo de mediación real por caso.
11. **Analítica CFO** (`/cliente/analitica`, CFO y Admin) — tablero con una sola fila de filtros (período: 3/6/12 meses, este año, año anterior o personalizado; unidad de negocio; centro de costo; categoría) que aplica a todo:
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
4. **Mis Ofertas** — lista real de todo proceso que aceptó, con su estado (borrador / enviada) y monto; entra a cada uno para completar el formulario estandarizado y enviarlo. Si el requerimiento tiene ítems, cotiza **precio unitario por línea** (puede dejar en blanco las que no ofrece) y el total lo calcula el servidor. También puede preguntar en la sección de Q&A del proceso.
5. **Subasta en Vivo** — si el comprador activa negociación, el proveedor ve **solo su posición** (nunca montos ni identidad de los demás), conectado en vivo por WebSocket a la misma sala que ve el comprador en Negociación.
6. **Historial** — procesos ganados/perdidos reales con feedback. En un proceso adjudicado por ítems, gana si le adjudicaron alguna línea (se indica que fue parcial) y figura como perdido solo cuando todos los contratos del proceso están firmados sin él.
7. **Mis Contratos** — sus contratos con el estado real de las entregas; cada uno abre su **ficha** (`/proveedor/contratos/:id`) con hitos, pagos, ítems, condiciones y modificaciones (sin los datos internos del cliente). Desde ahí **reporta el avance** de cada hito (el cliente recibe la notificación y confirma la recepción, que es lo que libera el pago) y descarga el documento vigente o el PDF de Procurex.
8. **Centro de Pagos** (`/proveedor/pagos`) — por cobrar, vencido, pendientes de factura y cobrado. Por cada pago: **radica la factura** (número, fecha de emisión y archivo PDF/XML/imagen, a un bucket privado), sigue su revisión y, si la rechazan, ve el motivo y radica otra. Con la factura aprobada puede **solicitar pronto pago**: elige la fecha, ve el descuento (1,5% por cada 30 días de adelanto) y lo envía; el comprador acepta o rechaza. Cuando le pagan ve fecha, monto, referencia y el soporte.
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

## Plantillas y documentos (`/cliente/plantillas`)

Solo Admin Cliente. Sirve para que cada empresa use sus propios formatos de contrato y orden de compra, en lugar de uno genérico.

- **Plantillas Word**:
  - La empresa sube su formato (.docx) con marcadores como `{{proveedor.nit}}`, `{{contrato.valorEnLetras}}` o una tabla `{{#lineas}}…{{/lineas}}`. Puede partir de las plantillas de ejemplo descargables.
  - Procurex la valida al subirla. Rechaza los marcadores mal escritos y las llaves sin cerrar, con un mensaje claro para cada error, y advierte si falta el NIT o el valor.
  - Antes de activarla se puede ver una vista previa, en PDF o en Word, llena con el último contrato real.
  - Hay una plantilla activa por tipo (orden de compra o contrato marco). Una plantilla de categoría tiene prioridad sobre la general.
- **Generación automática**: al firmar una adjudicación o emitir una PO bajo un marco, Procurex llena la plantilla activa y la convierte a PDF con Gotenberg (LibreOffice) en el servidor. El resultado queda como documento vigente, en PDF, y el Word llenado se puede descargar y editar. Las prórrogas y los cambios de valor generan una versión nueva. En la ficha, **Generar desde plantilla** la vuelve a llenar a mano. Si algo falla, la firma no se bloquea y el error queda en la auditoría.
- **Marca y datos**:
  - Se configuran la razón social, el NIT, la dirección, el representante legal que firma, el logo, el color, las cláusulas propias y el pie de página.
  - Estos datos llenan los marcadores `{{empresa.…}}` y `{{clausulas}}`.
  - **Penalidad por incumplimiento**: viene apagada. Si la empresa la activa, fija el % por día de atraso, el tope, los días de gracia y la base (el hito atrasado o el contrato), y redacta la cláusula. Se imprime en el PDF de Procurex, está disponible como `{{penalidad.texto}}` y `{{penalidad.porcentajeDiario}}` en las plantillas, y la ficha del contrato la estima con los mismos números.
  - Sin plantilla propia, el PDF de Procurex sale con esta marca: el logo y el color en el encabezado, las cláusulas de la empresa y un bloque de firmas. El proveedor lo descarga igual.
- **Guía de marcadores**: la lista completa, con descripción y botón de copiar, más las reglas para tablas y condicionales. El detalle técnico está en `docs/PLANTILLAS-DOCUMENTOS.md` del backend.

## Integración ERP (`/cliente/integraciones`)

Para Admin Cliente y CFO. Sirve con cualquier ERP (SAP, Siesa, World Office, Oracle, Odoo, Excel…) porque Procurex publica un formato propio y estable; el ERP (o su integrador) lo consume. Detalle técnico completo en `docs/INTEGRACION-ERP.md` del backend.

- **Qué se sincroniza**: proveedores (con su NIT), órdenes de compra/contratos (con líneas, hitos, centro de costo y cuenta), recepciones (hito recibido), facturas aprobadas y pagos. Cada documento viaja como una foto completa con versión: si cambia (prórroga, cambio de monto, anulación), se reenvía la versión nueva y el ERP solo actualiza.
- **Fase 1 · Archivo** — pestaña *Exportar*: descarga Excel (una hoja por tipo, columnas fijas) o CSV de un período, y la **cola de pendientes**: lo nuevo desde la última descarga, que se marca como exportado al bajarlo.
- **Fase 2 · Webhook** — pestaña *Conexión*: URL HTTPS del ERP o middleware, secreto de firma (se muestra una sola vez), eventos a enviar y botón de prueba. Cada envío va firmado (HMAC-SHA256 con timestamp) y se reintenta solo (1 min → 24 h) antes de quedar *fallido*.
- **Mapeos** — centro de costo → código del ERP y categoría → cuenta contable, para que el ERP reciba sus propios códigos.
- **Sincronización** — panel con el estado de cada documento (pendiente, enviado, error, fallido, descartado), el error exacto, el contenido enviado y botones para reintentar o descartar. La ficha del contrato y el detalle de Cuentas por Pagar muestran si ese documento ya llegó al ERP.
- **Siigo Nube (conector nativo)** — tercer modo en *Conexión*: con el usuario y la access key de la API de Siigo, Procurex crea el proveedor como tercero (NIT con dígito de verificación), cada factura aprobada como factura de compra (cuenta por pagar, con la cuenta contable de la categoría, el centro de costo y el IVA) y cada pago como comprobante de egreso contra esa factura. Si la empresa paga en Siigo, Procurex lee las facturas saldadas cada 10 minutos y las marca pagadas. Los tipos de comprobante, formas de pago, bancos e impuestos se eligen de los catálogos de la propia cuenta de Siigo, y la tabla de sincronización muestra el número de Siigo (FC-1-73, RP-1-10). Los reintentos nunca duplican documentos. Órdenes de compra y recepciones no aplican, porque Siigo no tiene API para ellas.
- **API de entrada** — con una API key (se genera en *Conexión*), el ERP informa los pagos que hizo (`POST /integraciones/erp/entrada/pagos`, por id de pago o número de factura + NIT) y Procurex los registra como pagados sin duplicarlos; también puede confirmar el número interno que le asignó a cada documento (`/acuse`).
- **NIT del proveedor**: el proveedor lo completa en *Perfil de Empresa* (se precarga del NIT detectado en homologación); sin él el ERP no puede crear el tercero.

## Red de proveedores, seguimiento en vivo y riesgo continuo

**"Homológate una vez y participa en los procesos de todas las empresas de Procurex."** El registro y la vitrina son gratis para el proveedor, así que la red crece con cada cliente. Detalle técnico en `docs/RED-Y-RIESGO.md` del backend.

- **Abrir un proceso a la red**: en el paso *Proveedores* del nuevo requerimiento viene activado. Además de los invitados directos, al aprobarse la salida a licitación se avisa a los proveedores homologados de la categoría. Con la red abierta ya no hace falta invitar a 3 proveedores. También se puede abrir o cerrar desde el tablero mientras la licitación esté abierta.
- **Oportunidades (`/proveedor/oportunidades`)**: el proveedor ve los procesos abiertos de su categoría (o todos), lee el requerimiento completo y se une con un clic, sin invitación. Si la empresa exige documentos que el proveedor no tiene validados, no puede unirse y se le dice cuáles faltan. Al unirse, el comprador recibe un aviso. El menú muestra cuántas oportunidades nuevas hay.
- **Directorio público (`/red`)**: proveedores homologados con búsqueda, categorías y enlace a su vitrina, cifras de la red y el llamado a registrarse gratis. Tiene enlaces desde la landing y desde el registro.
- **Seguimiento en vivo (ficha de la licitación)**: un tablero que se actualiza cada 15 s mientras la licitación está abierta.
  - Muestra el embudo: participantes, vieron, aceptaron, preparando, enviaron y declinaron.
  - Por cada proveedor muestra la etapa, cuándo vio, respondió y envió, y su última actividad.
  - Indica quién llegó desde la red. Nunca muestra precios antes del cierre.
- **Riesgo continuo**: cada noche, un proceso revisa a los proveedores homologados.
  - Vuelve a consultar OFAC y ONU cada 30 días por proveedor. Una coincidencia nueva manda la homologación a revisión (zona gris) y genera una alerta para Compliance. A las empresas con contratos con ese proveedor se les avisa "en revisión", sin detalle, y al proveedor no se le revela.
  - Avisa al proveedor 30, 15 y 7 días antes de que venza un documento. El día que vence, lo marca *vencido* y genera una alerta.
  - Alerta cuando la revalidación anual está vencida.
  - Si una lista no responde, no se da por limpio y se reintenta al día siguiente.
  - El proveedor puede indicar la vigencia al subir cada documento, y ve sus pendientes en *Homologación*.
  - Compliance las gestiona en `/interno/riesgo`: puede resolver cada alerta con una nota o ejecutar el monitoreo en el momento. Al volver a aprobar una homologación, sus alertas se cierran solas.
  - El comprador ve en la ficha del proveedor la fecha de la última re-consulta y las alertas abiertas.
  - **Pendiente**: datos financieros (RUES, centrales de riesgo).

## Lo que conecta todo

- **Log de auditoría** (visible en Contratos e Interno › Admin Clientes): cada aprobación, rechazo, cambio de score, impersonación o documento adjuntado queda ahí, sin importar desde qué portal se generó — todo backend-real.
- **Menú por etapas**: el menú del cliente se agrupa en Inicio · Compras · Contratos · Finanzas · Directorio, con **Configuración** aparte al fondo. El del proveedor se agrupa en Inicio · Oportunidades · Contratos y pagos · Mi empresa.
  - Los grupos se despliegan y se recuerdan; el de la pantalla actual siempre está abierto. Con el menú colapsado, cada grupo es un ícono que abre sus opciones.
  - Los **contadores** muestran lo que espera al usuario: aprobaciones por aprobar, facturas o pronto pagos por revisar, invitaciones sin responder, pagos por facturar y la cola de homologación. Salen de `GET /navegacion/contadores` y se refrescan al navegar y cada minuto.
  - "Primeros pasos" sale del menú cuando la configuración inicial está completa.
  - En celular, el menú es un panel que se abre con el botón ☰.
- **RBAC**: cada rol ve un menú distinto (un grupo con una sola opción se muestra plano); algunas pantallas se muestran en modo solo-lectura según el rol.
- **Multi-empresa**: si inicias sesión como Admin Cliente y cambias de Acme a TechCorp (menú del avatar), los requerimientos y contratos que ves cambian por completo (filtrado real por `companyId`).
- **Notificaciones**: la campana del header y el Centro de Notificaciones comparten el mismo estado real (leído/no leído), y cada notificación enlaza a la pantalla donde realmente puedes actuar sobre ella.
- **Gráficas**: la analítica usa una paleta validada para daltonismo y modo oscuro (tokens `--viz-*`), una sola fila de filtros y una vista de tabla por gráfica.

## Limitaciones conocidas (para tener en cuenta)

- **Plantillas**: se llenan desde Word (.docx); no se leen PDF ni .doc antiguos. La conversión a PDF necesita el contenedor de Gotenberg; sin él se entrega el Word llenado.
- **Firma electrónica**: "Firmar y generar contrato" registra la firma dentro de Procurex (con usuario y fecha en la bitácora); no hay integración con un proveedor externo de e-signature (DocuSign, etc.).
- **Listas colombianas manuales**: Procuraduría, Contraloría y Policía no tienen API pública; quedan como verificación manual que Compliance registra. OFAC y ONU sí se consultan automáticamente (si la lista no responde, el caso va a zona gris en vez de asumirse limpio).
- **Moneda**: los montos son enteros en unidades completas y cada requerimiento/contrato/pago lleva su moneda. No hay conversión de tasas: la analítica solo agrega lo que está en la moneda base de la empresa.
- **"Actividad reciente"** (Dashboard) muestra las últimas entradas reales de la bitácora de auditoría.
- **"Recordatorios de vencimiento"** (Contratos) ya es real: un cron diario (`VencimientosService`, `@nestjs/schedule`) revisa todos los contratos/POs activos, los pasa a "Por vencer"/"Vencido" según su `vigenciaFin`, y notifica una sola vez por umbral (60/30/15 días) a compradores y admins de la empresa.
- **Documentos adjuntos a un Requerimiento** ya usan almacenamiento real (bucket `requerimientos-documentos` en Supabase Storage), mismo patrón de URL firmada que Homologación y Contratos.
- **Idioma**: la plataforma está solo en español.
- **Pagos**: el registro del pago es manual (fecha, referencia y soporte) o llega del ERP por la API de entrada; no hay integración bancaria ni validación de la factura electrónica ante la DIAN/SAT. La tasa de pronto pago es fija (1,5% mensual).
- **Adjudicación por ítems**: los ítems desiertos no se relicitan solos; hay que crear un requerimiento nuevo para ellos.
- **Penalidades**: Procurex no trae ninguna cláusula de penalidad por defecto. Cada empresa decide si aplica una, fija los porcentajes y redacta el texto (hay un texto sugerido que se puede editar). La plataforma estima el valor con esa misma regla, pero no lo descuenta de los pagos: aplicarla es una decisión, y un trámite, de la empresa.
- **ERP**: hay conector nativo solo para Siigo Nube (probado contra una API simulada; falta validarlo en una cuenta sandbox de Siigo antes del primer cliente). Para otros ERP la integración es genérica (archivo, webhook firmado y API de pagos).
