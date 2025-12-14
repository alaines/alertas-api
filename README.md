# Alertas API v1.1.0

Sistema integral para la gestión de incidentes viales, tickets de seguimiento y administración de periféricos urbanos.

## Descripción

API REST desarrollada con NestJS y TypeScript que integra datos de incidentes de Waze con un sistema completo de tickets para seguimiento operativo y gestión de dispositivos de infraestructura vial (cámaras, semáforos, sensores).

## Características Principales

### Autenticación y Control de Acceso
- Autenticación mediante JWT con tokens de 24 horas
- Sistema de roles: ADMIN, OPERATOR, VIEWER
- Control de acceso basado en roles (RBAC)
- Gestión completa de usuarios

### Gestión de Incidentes
- Integración con datos de Waze en tiempo real
- Búsqueda por UUID o ID numérico
- Filtros avanzados: tipo, categoría, ciudad, estado, fechas
- Búsqueda geoespacial por coordenadas y radio
- Consulta de incidentes cercanos

### Sistema de Tickets
- Creación desde múltiples fuentes: WAZE, PHONE_CALL, WHATSAPP, INSPECTORS, OTHER
- Estados de seguimiento: OPEN, IN_PROGRESS, DONE
- Prioridades configurables (1-5)
- Asociación con incidentes por UUID (identificador estable de Waze)
- Asignación a usuarios operadores
- Historial inmutable de eventos
- Comentarios y cambios de estado
- Filtros por fuente, estado, usuario asignado

### Administración de Periféricos
- Gestión de dispositivos instalados en vías
- Tipos soportados: CAMERA, TRAFFIC_LIGHT, SENSOR, COUNTING_CAMERA, OTHER
- Estados: ACTIVE, INACTIVE, MAINTENANCE, DAMAGED
- Información completa: marca, modelo, año de instalación/fabricación
- Ubicación geográfica y dirección física
- Credenciales de acceso (IP, usuario, contraseña)
- Historial de mantenimiento y eventos
- Notas y observaciones técnicas

### Documentación Interactiva
- Swagger UI disponible en `/api`
- Especificación OpenAPI completa
- Ejemplos de uso para todos los endpoints

## Stack Tecnológico

- **Framework:** NestJS 11.0.0
- **Lenguaje:** TypeScript 5.6.3
- **Base de Datos:** PostgreSQL 13+ con PostGIS
- **ORM:** Prisma 6.19.0
- **Autenticación:** JWT (Passport.js)
- **Validación:** Class Validator
- **Seguridad:** Bcrypt para hashing de contraseñas

## Requisitos del Sistema

- Node.js 18 o superior
- PostgreSQL 13+ con extensión PostGIS
- npm 8 o superior
- Linux/Unix para scripts de despliegue
- nginx (recomendado para producción)

## Entorno de Producción

Este proyecto está optimizado para ejecutarse en:
- **Plataforma:** Google Cloud Platform - VM Ubuntu 24.04 LTS
- **Proxy Reverso:** nginx
- **Gestor de Procesos:** systemd

Para instrucciones completas de despliegue en Google Cloud, consultar **[GOOGLE_CLOUD.md](./GOOGLE_CLOUD.md)**

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/alaines/alertas-api.git
cd alertas-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://usuario:password@host:puerto/monitoreo_trafico?schema=public"
NODE_ENV=production
PORT=3000
JWT_SECRET="clave-secreta-jwt-segura-minimo-32-caracteres"
```

**Nota:** En producción con nginx, usar PORT=3000 (puerto interno). nginx manejará el tráfico en puerto 80/443.

### 4. Configurar base de datos

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones (si aplica)
# Las tablas waze_incidents deben existir previamente
```

### 5. Compilar aplicación

```bash
npm run build
```

### 6. Crear usuario administrador inicial

Ejecutar el siguiente SQL en la base de datos:

```sql
INSERT INTO users (email, username, password, full_name, role, is_active, created_at, updated_at)
VALUES (
  'admin@alertas.com',
  'admin',
  '$2b$10$...',  -- Hash de bcrypt para la contraseña deseada
  'Administrador del Sistema',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

O usar el script de seeding si está disponible.

## Despliegue en Producción

### Google Cloud Platform (Recomendado)

Para despliegue en Google Cloud VM con Ubuntu 24.04 LTS y nginx:

```bash
# Ver guía completa en:
cat GOOGLE_CLOUD.md

# Pasos resumidos:
1. Crear VM en GCP
2. Instalar dependencias (Node.js, PostgreSQL, nginx)
3. Clonar repositorio en /opt/alertas-api
4. Configurar .env con NODE_ENV=production
5. Ejecutar ./deploy.sh
6. Configurar nginx (cp nginx.conf)
7. Instalar servicio systemd (cp alertas-api.service)
8. Configurar SSL con Let's Encrypt
```

### Usando Scripts de Despliegue

El sistema incluye scripts automatizados:

```bash
# Despliegue completo (instalar, compilar)
./deploy.sh

# Gestión del servidor
./start-server.sh      # Iniciar
./stop-server.sh       # Detener
./restart-server.sh    # Reiniciar
./status-server.sh     # Ver estado
./backup-db.sh         # Backup de BD
```

### Producción con systemd (Recomendado)

```bash
# Instalar como servicio
sudo cp alertas-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable alertas-api
sudo systemctl start alertas-api

# Gestionar servicio
sudo systemctl status alertas-api
sudo systemctl restart alertas-api
sudo journalctl -u alertas-api -f
```

### nginx como Proxy Reverso

```bash
# Configurar nginx
sudo cp nginx.conf /etc/nginx/sites-available/alertas-api
sudo ln -s /etc/nginx/sites-available/alertas-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Despliegue Manual (Desarrollo)

```bash
# 1. Instalar y compilar
npm install
npm run build

# 2. Iniciar servidor en puerto 80 (requiere sudo)
sudo npm run start

# O configurar PORT diferente en .env y ejecutar sin sudo
npm run start
```

## Estructura del Proyecto

```
alertas-api/
├── prisma/
│   ├── schema.prisma           # Modelos de base de datos
│   └── migrations/             # Migraciones SQL
├── src/
│   ├── auth/                   # Autenticación JWT
│   ├── users/                  # Gestión de usuarios
│   ├── incidents/              # Consulta de incidentes Waze
│   ├── tickets/                # Sistema de tickets
│   ├── devices/                # Administración de periféricos
│   ├── prisma/                 # Servicio Prisma
│   ├── app.module.ts           # Módulo raíz
│   └── main.ts                 # Bootstrap
├── scripts/
│   ├── start-server.sh         # Iniciar servidor
│   ├── stop-server.sh          # Detener servidor
│   ├── restart-server.sh       # Reiniciar servidor
│   └── deploy.sh               # Despliegue completo
└── dist/                       # Código compilado
```

## Modelos de Datos

### User

```typescript
{
  id: number
  email: string              // Único
  username: string           // Único
  password: string          // Hash bcrypt
  fullName: string
  role: UserRole           // ADMIN | OPERATOR | VIEWER
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
  lastLogin: DateTime?
}
```

### Ticket

```typescript
{
  id: bigint
  incidentId: bigint?           // ID numérico (legacy)
  incidentUuid: string?         // UUID de Waze (recomendado)
  source: TicketSource         // WAZE | PHONE_CALL | WHATSAPP | INSPECTORS | OTHER
  incidentType: string?
  title: string
  description: string?
  status: TicketStatus         // OPEN | IN_PROGRESS | DONE
  priority: number             // 1-5
  createdByUserId: number
  assignedToUserId: number?
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Device

```typescript
{
  id: bigint
  name: string
  type: DeviceType             // CAMERA | TRAFFIC_LIGHT | SENSOR | COUNTING_CAMERA | OTHER
  brand: string?
  model: string?
  serialNumber: string?        // Único
  installationYear: number?
  manufactureYear: number?
  latitude: number?
  longitude: number?
  address: string?
  ipAddress: string?
  username: string?
  password: string?
  status: DeviceStatus         // ACTIVE | INACTIVE | MAINTENANCE | DAMAGED
  lastMaintenanceDate: DateTime?
  notes: string?
  createdByUserId: number
  createdAt: DateTime
  updatedAt: DateTime
}
```

### TicketEvent / DeviceEvent

Historial inmutable de cambios (append-only).

```typescript
{
  id: bigint
  [ticket|device]Id: bigint
  eventType: EventType
  fromStatus: Status?
  toStatus: Status?
  description: string?
  payload: JSON?
  createdByUserId: number
  createdAt: DateTime
}
```

## Endpoints de la API

### Base URL

```
http://host/api/v1
```

### Autenticación

#### POST /auth/login

Login de usuario. Endpoint público.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@alertas.com",
    "username": "admin",
    "fullName": "Administrador del Sistema",
    "role": "ADMIN"
  }
}
```

#### POST /auth/register

Registro de nuevos usuarios. Requiere autenticación y rol ADMIN.

### Usuarios

**Autenticación requerida para todos los endpoints.**

- `GET /users` - Listar usuarios
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear usuario (ADMIN)
- `PATCH /users/:id` - Actualizar usuario (ADMIN)
- `DELETE /users/:id` - Eliminar usuario (ADMIN)
- `POST /users/change-password` - Cambiar contraseña propia
- `GET /users/me/profile` - Obtener perfil del usuario actual

### Incidentes

- `GET /incidents` - Listar incidentes con filtros
  - Query params: `type`, `category`, `status`, `city`, `from`, `to`, `limit`
- `GET /incidents/:id` - Obtener incidente por ID numérico
- `GET /incidents/uuid/:uuid` - Obtener incidente por UUID de Waze
- `GET /incidents/near` - Buscar incidentes cercanos
  - Query params: `lat`, `lon`, `radius`, `type`, `category`, `status`, `city`, `limit`

### Tickets

- `GET /tickets` - Listar tickets con filtros
  - Query params: `status`, `source`, `assignedToUserId`, `createdByUserId`, `limit`
- `GET /tickets/:id` - Obtener ticket por ID
- `POST /tickets` - Crear ticket
- `PATCH /tickets/:id` - Actualizar ticket
- `POST /tickets/:id/status` - Cambiar estado del ticket
- `POST /tickets/:id/comments` - Agregar comentario
- `GET /tickets/:id/events` - Obtener historial de eventos

**Ejemplo crear ticket:**
```json
{
  "title": "Revisar accidente en Av. Principal",
  "description": "Reportado por Waze",
  "priority": 3,
  "source": "WAZE",
  "incidentUuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Dispositivos (Periféricos)

- `GET /devices` - Listar dispositivos con filtros
  - Query params: `type`, `status`, `city`, `limit`
- `GET /devices/:id` - Obtener dispositivo por ID
- `POST /devices` - Crear dispositivo
- `PATCH /devices/:id` - Actualizar dispositivo
- `POST /devices/:id/status` - Cambiar estado del dispositivo
- `DELETE /devices/:id` - Eliminar dispositivo

**Ejemplo crear dispositivo:**
```json
{
  "name": "Cámara Principal - Av. Javier Prado",
  "type": "CAMERA",
  "brand": "Hikvision",
  "model": "DS-2CD2047G2-L",
  "serialNumber": "HK001234567",
  "installationYear": 2024,
  "manufactureYear": 2023,
  "latitude": -12.089826,
  "longitude": -77.043994,
  "address": "Av. Javier Prado Este 456, San Isidro",
  "ipAddress": "192.168.10.50",
  "username": "admin",
  "password": "camera123",
  "status": "ACTIVE",
  "notes": "Requiere limpieza de lente cada 3 meses"
}
```

## Autenticación

Todos los endpoints (excepto `/auth/login`) requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

Los tokens expiran en 24 horas.

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `PORT` | Puerto HTTP del servidor | `3000` (nginx proxy en 80/443) |
| `JWT_SECRET` | Clave secreta para JWT | Mínimo 32 caracteres aleatorios |
| `NODE_ENV` | Entorno de ejecución | `production` o `development` |

**Nota**: En producción, `NODE_ENV=production` desactiva Swagger UI automáticamente.

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev      # Servidor con hot-reload
npm run start:debug    # Modo debug

# Producción
npm run build          # Compilar TypeScript
npm run start          # Iniciar servidor compilado

# Base de datos
npx prisma generate    # Generar cliente Prisma
npx prisma studio      # Interface web para DB

# Scripts de despliegue
./deploy.sh            # Despliegue completo
./start-server.sh      # Iniciar servidor
./stop-server.sh       # Detener servidor
./restart-server.sh    # Reiniciar servidor
```

## Monitoreo y Logs

Los logs del servidor se almacenan en:
- `/tmp/alertas-api.log` (cuando se ejecuta con scripts)
- stdout (cuando se ejecuta con npm)

Para ver logs en tiempo real:

```bash
tail -f /tmp/alertas-api.log
```

## Solución de Problemas

### El servidor no inicia en puerto 80 (Desarrollo)

El puerto 80 requiere privilegios root. Usar:
```bash
sudo ./start-server.sh
```

O cambiar `PORT` en `.env` a un puerto > 1024 (ej: 3000, 8080).

**Producción**: nginx maneja los puertos 80/443, Node.js corre en puerto 3000.

### Swagger no está disponible

Swagger UI solo está habilitado en modo desarrollo. Verificar:
- `NODE_ENV` no está configurado o está en `development`
- En producción (`NODE_ENV=production`), Swagger se desactiva automáticamente

### Error de conexión a base de datos

Verificar:
1. PostgreSQL está corriendo
2. Credenciales correctas en `DATABASE_URL`
3. Base de datos `monitoreo_trafico` existe
4. Usuario tiene permisos sobre la base de datos

### Token JWT inválido

Los tokens expiran en 24 horas. Hacer login nuevamente para obtener un nuevo token.

### nginx retorna 502 Bad Gateway

Verificar que el servicio Node.js está corriendo:
```bash
sudo systemctl status alertas-api
```

O verificar el puerto 3000:
```bash
sudo lsof -i :3000
```

## Seguridad

- Las contraseñas se almacenan hasheadas con bcrypt (10 rounds)
- Tokens JWT firmados con algoritmo HS256
- Validación de entrada en todos los endpoints
- Control de acceso basado en roles
- Las contraseñas de dispositivos se almacenan en texto plano (considerar cifrado para producción)

## Contribución

Este proyecto es de uso interno. Para cambios o mejoras, contactar al equipo de desarrollo.

## Licencia

Privado - Todos los derechos reservados

## Contacto

Para soporte o consultas técnicas, contactar al administrador del sistema.

## Notas de Versión

### v1.1.0 (2025-12-14)
- Agregado módulo de gestión de periféricos urbanos
- Soporte para asociación de tickets por UUID de Waze
- Búsqueda de incidentes por UUID
- Scripts de despliegue automatizados
- Mejoras en documentación

### v1.0.0 (2025-12-01)
- Release inicial
- Sistema de autenticación JWT
- Gestión de usuarios con roles
- Sistema de tickets
- Integración con incidentes de Waze
