# Flujo de la Plataforma — ProcureOS

> Nota: esta es una app 100% frontend (sin backend real). Todo vive en memoria del navegador usando datos mock (`src/lib/mockData.ts` y `src/lib/mock/*.ts`) y algunos "stores" compartidos que simulan un backend en vivo (auditoría, notificaciones, subasta en vivo, homologación).

## Arquitectura general

Hay 3 portales independientes, cada uno con su propio login, pero comparten el mismo router y los mismos datos de fondo.

```
/                    → Landing (elige portal)
/cliente/*           → Portal Cliente (comprador)
/proveedor/*         → Portal Proveedores
/interno/*           → Panel Interno (consultores/compliance)
```

## Autenticación (los 3 portales)

1. Escribes email/contraseña → `AuthContext` valida contra `src/lib/mock/users.ts`.
2. Si el rol requiere 2FA (Admin/CFO en Cliente) → pantalla de código (demo: `000000`).
3. Si el usuario tiene más de una empresa (solo `admin@acme.com`) → selector de empresa.
4. La sesión se guarda en `localStorage` → sobrevive a refrescos, pero **no persiste entre distintas cuentas de usuarios auto-registrados** si no vuelves a iniciar sesión con esa cuenta (los usuarios creados vía auto-registro solo viven en memoria de esa pestaña/sesión).
5. `ProtectedRoute` bloquea el portal si no perteneces a él; `RequireRole` bloquea pantallas específicas según tu rol (ej. solo Admin Cliente ve "Usuarios y Roles").

### Usuarios demo (contraseña `demo123` para todos)

| Portal | Email | Rol | Notas |
|---|---|---|---|
| Cliente | `carlos@acme.com` | Comprador | Acceso estándar |
| Cliente | `laura@acme.com` | Comprador | Acceso estándar |
| Cliente | `ana.cfo@acme.com` | Aprobador / CFO | Requiere 2FA |
| Cliente | `admin@acme.com` | Admin Cliente | Requiere 2FA + 2 empresas (Acme S.A. y TechCorp) |
| Proveedor | `contacto@cloudsphere.com` | Proveedor (CloudSphere Technologies) | |
| Interno | `ana.consultora@procureos.com` | Consultor | |
| Interno | `compliance@procureos.com` | Compliance / Ops | |

Código de 2FA de demo: **`000000`**

## El flujo central: Portal Cliente (ciclo de compra completo)

Este es el corazón de la plataforma — sigue un requerimiento de principio a fin:

1. **Nuevo Requerimiento** (`/cliente/requerimientos/nuevo`) — formulario de 5 pasos: descripción (con Copiloto IA), especificaciones, presupuesto, criterios ponderados (deben sumar 100%), revisión. Al enviar genera un ID nuevo tipo `RFP-2026-XXXX`.
2. **Detalle del Requerimiento** — timeline del proceso, comentarios, documentos. Desde aquí navegas a Shortlist o Comparativo.
3. **Shortlist de Proveedores** — seleccionas proveedores del directorio (mínimo 3 recomendado) o agregas uno externo (entra en "homologación exprés").
4. **Bandeja de Aprobaciones** — si el monto lo requiere, un Aprobador/CFO aprueba o rechaza (con motivo obligatorio) antes de salir a licitación.
5. **Licitación en Curso** (`/cliente/licitaciones/:id`) — cuenta regresiva, estado de cada proveedor invitado, Q&A. Cada requerimiento tiene su propio set de proveedores y datos.
6. **Cuadro Comparativo** (`/cliente/licitaciones/:id/comparativo`) — ranking automático por score ponderado, detecta ofertas atípicas, puedes ajustar los pesos en vivo (queda en el log de auditoría). Desde aquí decides:
   - **Negociación** (`/cliente/negociacion/:id`) — subasta inversa en vivo: los 3 mejores proveedores mejoran su oferta, el leaderboard se mueve solo cada 5s (simulando pujas rivales) hasta que cierras la ronda.
   - o **Adjudicar directamente** (`/cliente/adjudicacion/:id`).
7. **Adjudicación** (`/cliente/adjudicacion/:id`) — confirmas al ganador → si supera $50K requiere marcar "revisión legal" → firma electrónica simulada (puede fallar una vez, con botón de reintentar) → queda "firmado".
8. **Contratos / POs** — repositorio de todo lo firmado, con recordatorios de vencimiento y trazabilidad de auditoría.
9. **Seguimiento** — hitos de cumplimiento post-PO (a tiempo / en riesgo / atrasado), confirmas recepción o reportas incidencia.
10. **Disputas** — si reportas una incidencia, abre un caso aquí con hilo de mediación.
11. **Analítica CFO** — todo lo anterior se refleja en ahorro reportado vs. auditado, ciclos de tiempo, concentración de gasto.

> Solo 3 requerimientos (`RFP-2024-0032`, `RFP-2024-0031`, `RFP-2024-0030`) tienen el pipeline completo de comparativo/negociación/adjudicación con datos reales (`src/lib/mock/procesos.ts`). El resto se ve bien en la lista y el timeline, pero no tiene esa data específica más adelante en el flujo — mostrarían un estado vacío si entras a su comparativo.

### Otras pantallas de Cliente
- **Usuarios y Roles** / **Matriz de Aprobación** — solo Admin Cliente.
- **Directorio de Proveedores** — explora toda la red, no solo los invitados.
- **Centro de Notificaciones** / **Configuración de Cuenta** — accesibles desde el header.

## Portal Proveedores (el espejo del otro lado)

1. **Registro/Login** → completas **Homologación** (documentos, validación OCR/OFAC simulada) → queda "en revisión".
2. **Estado de Homologación** — el proveedor ve su score y checklist (lo aprueba/rechaza el panel interno, ver abajo).
3. **Invitaciones** — recibe la invitación cuando el comprador arma su Shortlist; acepta o declina.
4. **Carga de Oferta** — formulario estandarizado (mismos campos para todos, no PDFs libres) para el RFP.
5. **Subasta en Vivo** — si el comprador activa negociación, el proveedor ve **solo su posición** (nunca montos ni identidad de los demás) — comparte el mismo estado en vivo que ve el comprador en Negociación.
6. **Historial** — procesos ganados/perdidos con feedback estructurado ("perdiste por precio, 8% sobre el ganador").
7. **Pagos/Pronto Pago** — simulador de descuento por adelanto sobre sus POs.
8. **Perfil de Empresa** — certificaciones, usuarios con acceso al portal.

## Panel Interno (quién opera todo por detrás)

- **Casos Activos** — carga de trabajo del consultor/compliance del día.
- **Cola de Homologación** — compliance aprueba/rechaza a los proveedores en "zona gris" (esto resuelve el paso 1 del proveedor).
- **Asistente de Redacción RFP** — apoyo experto para estructurar requerimientos complejos.
- **Auditoría de Ahorro** — certifica que el ahorro reportado por el cliente sea real (compara contra benchmark).
- **Mediación de Disputas** — vista espejo de las disputas del cliente, con plantillas de resolución.
- **Admin Clientes** — "entrar como" un cliente (impersonación), queda registrado en auditoría.
- **Benchmark de Mercado** — índice de precios que alimenta las alertas de anomalías del comparativo.

## Lo que conecta todo

- **Log de auditoría** (visible en Contratos e Interno › Admin Clientes): cada aprobación, rechazo, cambio de score o impersonación queda ahí, sin importar desde qué portal se generó.
- **RBAC**: cada rol ve un menú distinto; algunas pantallas se muestran en modo solo-lectura según el rol.
- **Multi-empresa**: si inicias sesión como Admin Cliente y cambias de Acme a TechCorp (menú del avatar), los requerimientos y contratos que ves cambian por completo.
- **Notificaciones**: la campana del header y el Centro de Notificaciones comparten el mismo estado (leído/no leído) en tiempo real.

## Limitaciones conocidas (para tener en cuenta)

- Sin backend real: nada de esto persiste fuera de la pestaña del navegador (ni en localStorage salvo la sesión y el tema).
- El pipeline dinámico de comparativo/negociación/adjudicación solo tiene datos completos para 3 requerimientos de ejemplo.
- El selector de idioma es cosmético (no hay i18n real conectado).
- El auto-registro de proveedor crea una cuenta funcional, pero las pantallas del portal proveedor siguen mostrando el escenario de ejemplo (CloudSphere), no datos propios del nuevo registro.
