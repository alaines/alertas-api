# Changelog

Historial de cambios de Alertas API.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2025-12-14

### Agregado

#### Módulo de Periféricos Urbanos
- Gestión completa de dispositivos instalados en vías (CRUD)
- Tipos de dispositivos: CAMERA, TRAFFIC_LIGHT, SENSOR, COUNTING_CAMERA, OTHER
- Estados: ACTIVE, INACTIVE, MAINTENANCE, DAMAGED
- Información técnica: marca, modelo, número de serie
- Años de instalación y fabricación
- Ubicación geográfica (latitud, longitud) y dirección física
- Credenciales de acceso: IP, usuario, contraseña
- Historial de mantenimiento con fecha del último servicio
- Notas y observaciones técnicas
- Historial inmutable de eventos (creación, actualización, cambios de estado)
- Filtros por tipo, estado y ciudad
- Endpoints RESTful completos en `/api/v1/devices`

#### Sistema de UUIDs para Incidentes
- Soporte para UUID de Waze como identificador estable de incidentes
- Asociación de tickets con incidentes mediante UUID (recomendado sobre ID numérico)
- Campo `incidentUuid` agregado a modelo Ticket
- Migración de datos existentes para asignar UUIDs
- Resolución bidireccional UUID ↔ ID numérico
- Backward compatibility: ambos identificadores disponibles en respuestas

#### Búsqueda de Incidentes
- Nuevo endpoint `GET /incidents/uuid/:uuid` para búsqueda por UUID de Waze
- Mantiene compatibilidad con búsqueda por ID numérico

#### Scripts de Despliegue
- `deploy.sh`: Despliegue completo automatizado
- `restart-server.sh`: Reinicio rápido del servidor
- `status-server.sh`: Verificación de estado y métricas
- `backup-db.sh`: Backup automatizado de base de datos con compresión
- Documentación completa en DEPLOYMENT.md

### Mejorado

#### Documentación
- README.md completamente reescrito con estructura profesional
- Sin iconos, formato limpio y corporativo
- Secciones organizadas: instalación, despliegue, API, modelos
- Ejemplos actualizados de todos los endpoints
- Tabla de variables de entorno
- Guía de solución de problemas
- Notas de versión incluidas

#### Base de Datos
- Índices agregados para optimización de consultas
- Campos UUID con tipo nativo de PostgreSQL
- Eventos con cascada en eliminación de dispositivos
- Números de serie únicos en dispositivos

#### Seguridad
- Notas sobre almacenamiento de credenciales de dispositivos
- Recomendaciones de cifrado para producción

### Cambiado
- Versión actualizada de 1.0.0 a 1.1.0
- Descripción del proyecto actualizada en package.json
- .gitignore ampliado para backups y archivos temporales

### Técnico
- Modelos Prisma: Device, DeviceEvent con relaciones completas
- DTOs con validación completa usando class-validator
- Servicios con transacciones para integridad de datos
- Módulos NestJS siguiendo arquitectura limpia
- Manejo de errores consistente (404, validación)

---

## [1.0.0] - 2025-12-01

### Agregado

#### Sistema de Autenticación
- JWT con tokens de 24 horas
- Login con username/password
- Endpoints públicos para autenticación
- Hashing de contraseñas con bcrypt (10 rounds)

#### Gestión de Usuarios
- CRUD completo de usuarios
- Roles: ADMIN, OPERATOR, VIEWER
- Control de acceso basado en roles (RBAC)
- Cambio de contraseña con validación
- Perfil de usuario autenticado

#### Sistema de Tickets
- Creación de tickets desde múltiples fuentes
- Estados: OPEN, IN_PROGRESS, DONE
- Prioridades configurables (1-5)
- Asociación con incidentes de Waze por ID numérico
- Asignación a usuarios operadores
- Comentarios en tickets
- Cambios de estado con registro de eventos
- Historial inmutable de todos los cambios
- Filtros avanzados: estado, fuente, usuario asignado, usuario creador

#### Consulta de Incidentes
- Integración con tabla waze_incidents (PostGIS)
- Listado con filtros: tipo, categoría, ciudad, estado, fechas
- Búsqueda geoespacial por coordenadas y radio
- Incidentes cercanos a una ubicación
- Paginación configurable

#### Documentación
- Swagger UI en `/api`
- Especificación OpenAPI completa
- Ejemplos de uso en todos los endpoints

#### Infraestructura
- Scripts de inicio/parada del servidor
- Configuración mediante variables de entorno
- Soporte para puerto 80 con sudo
- Logs en archivo

### Inicial
- Framework NestJS 11.0.0
- TypeScript 5.6.3
- PostgreSQL 13+ con PostGIS
- Prisma ORM 6.19.0
- Arquitectura modular y escalable

---

## Tipos de Cambios

- **Agregado**: para funcionalidades nuevas
- **Cambiado**: para cambios en funcionalidades existentes
- **Deprecado**: para funcionalidades que se eliminarán pronto
- **Eliminado**: para funcionalidades eliminadas
- **Corregido**: para corrección de bugs
- **Seguridad**: para vulnerabilidades
- **Mejorado**: para mejoras en funcionalidades existentes
- **Técnico**: para cambios técnicos internos

---

## Versionado

Este proyecto usa [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Funcionalidades nuevas compatibles con versiones anteriores
- **PATCH** (0.0.X): Correcciones de bugs compatibles con versiones anteriores

---

## Roadmap

### Planificado para v1.2.0
- Panel de administración web
- Notificaciones en tiempo real (WebSocket)
- Reportes y estadísticas
- Exportación de datos (CSV, Excel)
- API de integración con sistemas externos

### En consideración
- Autenticación con OAuth2
- Multi-tenancy
- Cifrado de credenciales de dispositivos
- Almacenamiento de imágenes/archivos
- Geofencing y alertas automáticas
- Integración con otros proveedores de datos (Google Traffic, etc.)

---

## Contacto

Para reportar bugs, solicitar funcionalidades o consultas técnicas, contactar al equipo de desarrollo.
