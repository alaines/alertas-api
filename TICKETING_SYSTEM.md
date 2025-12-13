# Sistema de Tickets - Alertas API

## Descripción General

El sistema de tickets permite realizar seguimiento de incidentes viales (waze_incidents) mediante la creación de tickets con estados, asignaciones y un historial completo e inmutable de todos los cambios.

## Características Principales

- ✅ **Integración completa con autenticación JWT** existente
- ✅ **Control de acceso basado en roles** (ADMIN, OPERATOR, VIEWER)
- ✅ **Historial inmutable** de todos los cambios (ticket_events)
- ✅ **Transacciones atómicas** garantizan consistencia de datos
- ✅ **Documentación Swagger** completa
- ✅ **Prevención de eliminación en cascada** de incidentes

## Modelos de Base de Datos

### Tabla: `tickets`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL | ID único del ticket |
| incident_id | BIGINT | FK a waze_incidents (RESTRICT) |
| title | TEXT | Título del ticket |
| description | TEXT | Descripción detallada (opcional) |
| status | TicketStatus | Estado: OPEN, IN_PROGRESS, DONE |
| priority | INTEGER | Prioridad 1-5 (opcional) |
| created_by_user_id | INTEGER | FK a users (creador) |
| assigned_to_user_id | INTEGER | FK a users (asignado, opcional) |
| created_at | TIMESTAMPTZ(6) | Fecha de creación |
| updated_at | TIMESTAMPTZ(6) | Fecha de última actualización |

**Índices:**
- `tickets_incident_id_idx`
- `tickets_status_idx`
- `tickets_created_by_user_id_idx`
- `tickets_assigned_to_user_id_idx`

### Tabla: `ticket_events`

Historial **append-only** (solo inserción) de todos los cambios en tickets.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | BIGSERIAL | ID único del evento |
| ticket_id | BIGINT | FK a tickets (RESTRICT) |
| event_type | TicketEventType | Tipo de evento |
| from_status | TicketStatus | Estado anterior (nullable) |
| to_status | TicketStatus | Estado nuevo (nullable) |
| message | TEXT | Mensaje descriptivo (opcional) |
| payload | JSONB | Datos adicionales del evento |
| created_by_user_id | INTEGER | FK a users (autor del cambio) |
| created_at | TIMESTAMPTZ(6) | Fecha del evento |

**Índices:**
- `ticket_events_ticket_id_created_at_idx` (compuesto)

### Enums

```typescript
enum TicketStatus {
  OPEN          // Ticket recién creado o reabierto
  IN_PROGRESS   // Ticket en proceso de resolución
  DONE          // Ticket completado/cerrado
}

enum TicketEventType {
  CREATED        // Ticket creado
  COMMENT        // Comentario agregado
  STATUS_CHANGED // Cambio de estado
  UPDATED        // Campos actualizados
  ASSIGNED       // Usuario asignado
  UNASSIGNED     // Usuario desasignado
}
```

## Endpoints API

Todos los endpoints requieren autenticación JWT (`Authorization: Bearer <token>`).

### 1. Crear Ticket

**POST** `/api/v1/tickets`

**Permisos:** ADMIN, OPERATOR

**Body:**
```json
{
  "incidentId": 123,
  "title": "Revisar incidente en Av. Principal",
  "description": "Este incidente requiere verificación en campo",
  "priority": 3,
  "assignedToUserId": 2
}
```

**Response:**
```json
{
  "id": "1",
  "incidentId": "123",
  "title": "Revisar incidente en Av. Principal",
  "description": "Este incidente requiere verificación en campo",
  "status": "OPEN",
  "priority": 3,
  "createdByUserId": 1,
  "assignedToUserId": 2,
  "createdAt": "2025-12-13T12:00:00Z",
  "updatedAt": "2025-12-13T12:00:00Z",
  "incident": {
    "id": "123",
    "uuid": "abc-123",
    "type": "ACCIDENT",
    "category": "traffic",
    "city": "Lima",
    "street": "Av. Principal",
    "status": "active"
  },
  "createdBy": {
    "id": 1,
    "fullName": "Administrador del Sistema",
    "username": "admin"
  },
  "assignedTo": {
    "id": 2,
    "fullName": "Operador 1",
    "username": "operator1"
  }
}
```

**Eventos creados automáticamente:**
- `CREATED`: Ticket creado
- `ASSIGNED`: Usuario asignado (si se proporcionó `assignedToUserId`)

---

### 2. Listar Tickets

**GET** `/api/v1/tickets`

**Permisos:** Todos los usuarios autenticados

**Query params:**
- `status`: OPEN | IN_PROGRESS | DONE
- `incidentId`: Filtrar por ID de incidente
- `assignedToUserId`: Filtrar por usuario asignado
- `createdByUserId`: Filtrar por usuario creador
- `limit`: Límite de resultados (máx 100, default 100)

**Ejemplo:**
```
GET /api/v1/tickets?status=OPEN&assignedToUserId=2&limit=20
```

---

### 3. Obtener Ticket por ID

**GET** `/api/v1/tickets/:id`

**Permisos:** Todos los usuarios autenticados

**Response:** Incluye detalles del ticket + incidente relacionado + últimos 10 eventos

---

### 4. Actualizar Ticket

**PATCH** `/api/v1/tickets/:id`

**Permisos:** ADMIN, OPERATOR

**Body:**
```json
{
  "title": "Nuevo título",
  "description": "Nueva descripción",
  "priority": 4,
  "assignedToUserId": 3
}
```

**Eventos creados:**
- `UPDATED`: Si cambian title, description o priority (con payload de campos modificados)
- `ASSIGNED` / `UNASSIGNED`: Si cambia assignedToUserId

---

### 5. Cambiar Estado

**POST** `/api/v1/tickets/:id/status`

**Permisos:** ADMIN, OPERATOR

**Body:**
```json
{
  "status": "IN_PROGRESS",
  "message": "Comenzando revisión del incidente"
}
```

**Evento creado:**
- `STATUS_CHANGED`: Con fromStatus, toStatus y message

---

### 6. Agregar Comentario

**POST** `/api/v1/tickets/:id/comments`

**Permisos:** ADMIN, OPERATOR

**Body:**
```json
{
  "message": "Se contactó con el operador de campo. Pendiente de confirmación."
}
```

**Evento creado:**
- `COMMENT`: Con el mensaje

---

### 7. Obtener Historial de Eventos

**GET** `/api/v1/tickets/:id/events?limit=50`

**Permisos:** Todos los usuarios autenticados

**Response:**
```json
[
  {
    "id": "5",
    "ticketId": "1",
    "eventType": "COMMENT",
    "message": "Se contactó con el operador de campo",
    "createdByUserId": 1,
    "createdAt": "2025-12-13T14:30:00Z",
    "createdBy": {
      "id": 1,
      "fullName": "Admin",
      "username": "admin"
    }
  },
  {
    "id": "4",
    "ticketId": "1",
    "eventType": "STATUS_CHANGED",
    "fromStatus": "OPEN",
    "toStatus": "IN_PROGRESS",
    "message": "Comenzando revisión",
    "createdByUserId": 1,
    "createdAt": "2025-12-13T14:00:00Z",
    "createdBy": {
      "id": 1,
      "fullName": "Admin",
      "username": "admin"
    }
  }
]
```

## Control de Acceso por Rol

| Operación | VIEWER | OPERATOR | ADMIN |
|-----------|--------|----------|-------|
| Crear ticket | ❌ | ✅ | ✅ |
| Ver tickets | ✅ | ✅ | ✅ |
| Ver ticket individual | ✅ | ✅ | ✅ |
| Actualizar ticket | ❌ | ✅ | ✅ |
| Cambiar estado | ❌ | ✅ | ✅ |
| Agregar comentario | ❌ | ✅ | ✅ |
| Ver eventos | ✅ | ✅ | ✅ |

## Garantías de Consistencia

### Transacciones Atómicas

Todas las operaciones que modifican un ticket utilizan transacciones de Prisma para garantizar que:

1. El ticket se actualiza
2. El evento correspondiente se crea
3. Ambas operaciones se completan o ambas fallan

```typescript
const result = await this.prisma.$transaction(async (tx) => {
  const ticket = await tx.ticket.update(...);
  await tx.ticketEvent.create(...);
  return ticket;
});
```

### Validaciones

- ✅ El incidente debe existir antes de crear un ticket
- ✅ El usuario asignado debe existir si se proporciona
- ✅ No se puede cambiar a un estado igual al actual
- ✅ Todos los cambios quedan registrados con usuario y timestamp

### Restricciones de Integridad

- **ON DELETE RESTRICT** en FK a `waze_incidents`: Previene eliminación de incidentes con tickets
- **ON DELETE RESTRICT** en FK a `tickets`: Previene eliminación de tickets con eventos
- **Historial inmutable**: Los eventos nunca se modifican ni eliminan

## Ejemplo de Flujo Completo

```bash
# 1. Login (obtener token JWT)
curl -X POST http://192.168.18.230/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alertas.com","password":"admin123"}'

# Response: { "access_token": "eyJhbGc...", "user": {...} }

# 2. Crear ticket (OPERATOR o ADMIN)
curl -X POST http://192.168.18.230/api/v1/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "incidentId": 123,
    "title": "Verificar accidente reportado",
    "description": "Múltiples reportes del mismo punto",
    "priority": 4,
    "assignedToUserId": 2
  }'

# 3. Ver todos los tickets abiertos
curl http://192.168.18.230/api/v1/tickets?status=OPEN \
  -H "Authorization: Bearer <TOKEN>"

# 4. Cambiar estado a IN_PROGRESS
curl -X POST http://192.168.18.230/api/v1/tickets/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "status": "IN_PROGRESS",
    "message": "Operador en camino al lugar"
  }'

# 5. Agregar comentario
curl -X POST http://192.168.18.230/api/v1/tickets/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "message": "Confirmado: accidente con 2 vehículos. Tránsito bloqueado."
  }'

# 6. Actualizar prioridad
curl -X PATCH http://192.168.18.230/api/v1/tickets/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "priority": 5
  }'

# 7. Cambiar estado a DONE
curl -X POST http://192.168.18.230/api/v1/tickets/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "status": "DONE",
    "message": "Incidente verificado y resuelto. Tránsito normalizado."
  }'

# 8. Ver historial completo del ticket
curl http://192.168.18.230/api/v1/tickets/1/events \
  -H "Authorization: Bearer <TOKEN>"
```

## Documentación Swagger

Una vez que el API esté corriendo, accede a:

```
http://192.168.18.230/api/v1/docs
```

Allí encontrarás:
- ✅ Todos los endpoints documentados
- ✅ Modelos de request/response
- ✅ Ejemplos interactivos
- ✅ Autenticación Bearer configurada
- ✅ Indicadores de permisos por rol

## Estructura de Código

```
src/tickets/
├── dto/
│   └── ticket.dto.ts          # DTOs para validación y Swagger
├── tickets.controller.ts      # Endpoints REST con guards
├── tickets.service.ts         # Lógica de negocio y transacciones
└── tickets.module.ts          # Módulo NestJS

prisma/
├── schema.prisma              # Modelos Ticket y TicketEvent
└── migrations/
    └── add_ticketing_system.sql  # Migración SQL
```

## Próximas Mejoras (Opcional)

- [ ] Notificaciones cuando se asigna un ticket
- [ ] Webhooks para eventos importantes
- [ ] Exportar reportes de tickets en PDF/Excel
- [ ] Dashboard de métricas (tickets abiertos, tiempo promedio de resolución)
- [ ] Adjuntar archivos/fotos a los tickets
- [ ] Plantillas de tickets predefinidas
- [ ] SLA (Service Level Agreement) con alertas automáticas

---

**Última actualización:** 13 de diciembre de 2025  
**Autor:** Aland Laines Calonge
