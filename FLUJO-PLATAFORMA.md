# Flujo de la Plataforma — Procurex

> Backend real: NestJS + Prisma + PostgreSQL (Supabase), con autenticación real vía Supabase Auth (incluye MFA/2FA real y login con Google). Todo lo que se crea, aprueba, oferta, adjudica o firma persiste de verdad en la base de datos — no hay datos mock detrás del flujo de negocio. `src/lib/mockData.ts` y `src/lib/mock/*.ts` siguen existiendo solo para un puñado de widgets puramente decorativos (ver "Limitaciones conocidas" al final).

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

1. **Nuevo Requerimiento** (`/cliente/requerimientos/nuevo`) — formulario de varios pasos: descripción y especificaciones, presupuesto, criterios ponderados (deben sumar 100%), shortlist de proveedores, revisión. Al enviar crea un requerimiento real; según el monto y la **Matriz de Aprobación** de la empresa, genera automáticamente la aprobación que corresponda (rol requerido, único o secuencial).
2. **Detalle del Requerimiento** — timeline del proceso, comentarios, documentos adjuntos.
3. **Bandeja de Aprobaciones** — el rol que la Matriz de Aprobación determine (Comprador, Admin Cliente o Aprobador/CFO, según el monto) aprueba o rechaza (con motivo obligatorio); solo entonces se envían las invitaciones pendientes a los proveedores.
4. **Licitación en Curso** (`/cliente/licitaciones/:id`) — cuenta regresiva real, estado real de cada proveedor invitado (invitado / visto / declinó / oferta enviada, tomado de sus invitaciones y ofertas reales — no relleno), y **Preguntas y Respuestas real**: el proveedor invitado pregunta, el comprador responde, y cada lado recibe una notificación real con link directo a la pantalla correspondiente.
5. **Cuadro Comparativo** (`/cliente/licitaciones/:id/comparativo`) — ranking calculado en vivo por score ponderado sobre las ofertas reales recibidas, detecta ofertas atípicas, puedes ajustar los pesos (queda en el log de auditoría). Desde aquí decides:
   - **Negociación** (`/cliente/negociacion/:id`) — subasta inversa en vivo real vía WebSocket (Socket.IO): arranca con los 3 mejores oferentes reales, cada proveedor ve el leaderboard actualizarse en tiempo real y puede pujar desde su propio portal; tú cierras la ronda cuando quieras.
   - o **Adjudicar directamente** (`/cliente/adjudicacion/:id`).
6. **Adjudicación** (`/cliente/adjudicacion/:id`) — confirmas al ganador (real) → si supera $50K se bloquea hasta marcar "revisión legal" (real) → **"Enviar a firma electrónica"**: la animación de DocuSign es teatro simulado (falla la primera vez a propósito, con botón de reintentar — no hay integración real con ningún proveedor de firma), pero el resultado final es 100% real: crea el Contrato, genera sus hitos de seguimiento, cambia el estado del requerimiento y notifica al ganador y (según el checkbox, que sí funciona) a los perdedores.
7. **Contratos / POs** — repositorio real de todo lo firmado. Por cada contrato puedes **descargar un PDF** (generado con la plantilla Procurex a partir de los datos reales) o **adjuntar el PO/contrato propio de la empresa** (subida real a Supabase Storage) — si adjuntas uno, la descarga entrega ese archivo en vez de la plantilla, y el proveedor ve el mismo documento adjunto desde su portal.
8. **Seguimiento** — hitos de cumplimiento post-PO (a tiempo / en riesgo / atrasado) reales, editables; puedes agregar/eliminar hitos y reportar una incidencia (abre una Disputa real referenciando el contrato).
9. **Disputas** — hilo de mediación real por caso.
10. **Analítica CFO** — gráficas (ahorro reportado vs. auditado, ciclo de tiempo por categoría, concentración de gasto, top proveedores) con colores de marca Procurex.

### Otras pantallas de Cliente
- **Usuarios y Roles** / **Matriz de Aprobación** — solo Admin Cliente; la Matriz es la que realmente decide quién debe aprobar cada requerimiento (no es solo informativa). En la misma pantalla se configuran país y **moneda base** de la empresa (COP, USD, MXN, PEN, CLP, BRL) y los **requisitos de homologación**: qué categorías de documentos (p. ej. HSE, SARLAFT) debe tener validadas un proveedor para poder invitarlo.
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

## Panel Interno (quién opera todo por detrás)

Corre contra el mismo backend; no se tocó a fondo en la última ronda de trabajo, pero la arquitectura es la misma (NestJS + Prisma, sin mocks en la capa de datos):

- **Casos Activos** — carga de trabajo del consultor/compliance del día.
- **Cola de Homologación** — compliance aprueba/rechaza a los proveedores en "zona gris" (resuelve el paso 1 del proveedor), viendo los documentos reales que subió y el resultado por lista restrictiva. Para proveedores colombianos registra la consulta manual en Procuraduría, Contraloría y Policía (no tienen API pública); no se puede aprobar con listas pendientes, caídas o con coincidencias sin resolver. También valida uno a uno los documentos opcionales que suba un proveedor ya homologado.
- **Asistente de Redacción RFP** — apoyo para estructurar requerimientos complejos.
- **Auditoría de Ahorro** — compara el ahorro reportado por el cliente contra el benchmark.
- **Mediación de Disputas** — vista espejo de las disputas del cliente.
- **Admin Clientes** — "entrar como" un cliente (impersonación), queda registrado en auditoría.
- **Benchmark de Mercado** — índice de precios que alimenta las alertas de anomalías del comparativo.

## Lo que conecta todo

- **Log de auditoría** (visible en Contratos e Interno › Admin Clientes): cada aprobación, rechazo, cambio de score, impersonación o documento adjuntado queda ahí, sin importar desde qué portal se generó — todo backend-real.
- **RBAC**: cada rol ve un menú distinto; algunas pantallas se muestran en modo solo-lectura según el rol.
- **Multi-empresa**: si inicias sesión como Admin Cliente y cambias de Acme a TechCorp (menú del avatar), los requerimientos y contratos que ves cambian por completo (filtrado real por `companyId`).
- **Notificaciones**: la campana del header y el Centro de Notificaciones comparten el mismo estado real (leído/no leído), y cada notificación enlaza a la pantalla donde realmente puedes actuar sobre ella.
- **Gráficas**: los colores de todas las gráficas (Dashboard, Analítica CFO) están atados a la paleta de marca Procurex, no a colores sueltos.

## Limitaciones conocidas (para tener en cuenta)

- **Firma electrónica simulada**: "Enviar a firma" muestra una animación tipo DocuSign que falla a propósito en el primer intento — no hay integración real con ningún proveedor de e-signature. Lo que pasa *después* de esa animación (contrato, hitos, notificaciones) sí es real.
- **Listas colombianas manuales**: Procuraduría, Contraloría y Policía no tienen API pública; quedan como verificación manual que Compliance registra. OFAC y ONU sí se consultan automáticamente (si la lista no responde, el caso va a zona gris en vez de asumirse limpio).
- **Moneda**: los montos son enteros en unidades completas y cada requerimiento/contrato/pago lleva su moneda. No hay conversión de tasas: la analítica solo agrega lo que está en la moneda base de la empresa.
- **"Actividad reciente"** (Dashboard) es un widget decorativo.
- **"Recordatorios de vencimiento"** (Contratos) ya es real: un cron diario (`VencimientosService`, `@nestjs/schedule`) revisa todos los contratos/POs activos, los pasa a "Por vencer"/"Vencido" según su `vigenciaFin`, y notifica una sola vez por umbral (60/30/15 días) a compradores y admins de la empresa.
- **Documentos adjuntos a un Requerimiento** ya usan almacenamiento real (bucket `requerimientos-documentos` en Supabase Storage), mismo patrón de URL firmada que Homologación y Contratos.
- **Selector de idioma** es cosmético (no hay i18n real conectado).
- **Pagos/Pronto Pago** es un simulador de descuento, no una integración financiera real.
