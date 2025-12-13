# Alertas API

API REST para gestión de incidentes viales basados en datos de Waze, con autenticación JWT, sistema de roles y **sistema de tickets integrado**.

## Características

- **Autenticación JWT** con sistema de roles (Admin, Operator, Viewer)
- **Gestión de usuarios** con diferentes niveles de acceso
- **Sistema de Tickets** para seguimiento de incidentes con historial inmutable
- **API REST completa** para consulta de incidentes viales
- **Filtros avanzados** por tipo, categoría, ciudad, estado y rango de fechas
- **Búsqueda geoespacial** de incidentes cercanos a una ubicación
- **Documentación interactiva** con Swagger/OpenAPI
- **Base de datos PostgreSQL** con Prisma ORM
- **TypeScript** para desarrollo type-safe

## Roles de Usuario

- **ADMIN**: Acceso total al sistema, puede gestionar usuarios y tickets
- **OPERATOR**: Puede ver y gestionar incidentes y tickets
- **VIEWER**: Solo lectura de incidentes y tickets

## Requisitos

- Node.js 18+ 
- PostgreSQL 13+
- npm o yarn

## Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/alaines/alertas-api.git
cd alertas-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env`:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/monitoreo_trafico?schema=public"
PORT=80
JWT_SECRET="tu-secret-jwt-super-seguro"  # Genera uno con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

4. **Generar el cliente de Prisma**
```bash
npm run prisma:generate
```

5. **Crear las tablas en la base de datos**
```bash
# Si las tablas no existen, ejecutar el script SQL
psql -h host -U usuario -d monitoreo_trafico -f prisma/migrations/create_users_table.sql
```

6. **Crear usuario administrador inicial**
```bash
npm run seed:admin
```

Esto creará un usuario admin con las siguientes credenciales:
- **Email**: `admin@alertas.com`
- **Password**: `admin123`
- **Role**: `ADMIN`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer login!

## Ejecución

### Modo desarrollo
```bash
npm run start:dev
```

### Modo producción
```bash
npm run build
npm start
```

La API estará disponible en `http://localhost:80/api/v1`

## Documentación

Accede a la documentación interactiva de Swagger en:
```
http://localhost/api/v1/docs
```

## Autenticación

### 1. Login
```bash
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@alertas.com",
    "password": "admin123"
  }'
```

Respuesta:
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

### 2. Usar el token en las peticiones

```bash
curl http://localhost/api/v1/incidents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Endpoints Principales

### Autenticación

- **POST /api/v1/auth/register** - Registrar un nuevo usuario
- **POST /api/v1/auth/login** - Iniciar sesión

### Usuarios (Solo ADMIN)

- **GET /api/v1/users** - Listar todos los usuarios
- **GET /api/v1/users/:id** - Obtener un usuario por ID
- **POST /api/v1/users** - Crear un nuevo usuario
- **PATCH /api/v1/users/:id** - Actualizar un usuario
- **DELETE /api/v1/users/:id** - Eliminar un usuario
- **POST /api/v1/users/change-password** - Cambiar contraseña
- **GET /api/v1/users/me/profile** - Obtener perfil actual

### Incidentes

- **GET /api/v1/incidents** - Listar incidentes con filtros
- **GET /api/v1/incidents/:id** - Obtener incidente por ID
- **GET /api/v1/incidents/near** - Buscar incidentes cercanos
- **GET /api/v1/incidents/stats/by-type** - Estadísticas por tipo
- **GET /api/v1/incidents/stats/by-city** - Estadísticas por ciudad

Ver documentación completa en Swagger: `http://localhost/api/v1/docs`

## Uso desde el Frontend

### JavaScript / Fetch

```javascript
// 1. Login
const response = await fetch('http://localhost/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@alertas.com',
    password: 'admin123'
  })
});

const { access_token } = await response.json();
localStorage.setItem('token', access_token);

// 2. Usar en peticiones
const incidents = await fetch('http://localhost/api/v1/incidents', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost/api/v1'
});

// Interceptor para agregar token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const { data } = await api.post('/auth/login', {
  email: 'admin@alertas.com',
  password: 'admin123'
});

localStorage.setItem('token', data.access_token);
```

## Uso en Postman

1. **Login** - POST `http://localhost/api/v1/auth/login`
2. Copia el `access_token` de la respuesta
3. En otras peticiones:
   - Authorization tab → Type: **Bearer Token**
   - Token: Pega el `access_token`

## Sistema de Tickets

El sistema incluye un módulo completo de tickets para seguimiento de incidentes. Ver documentación detallada en:

[📋 TICKETING_SYSTEM.md](./TICKETING_SYSTEM.md)

**Características principales:**
- ✅ Crear tickets vinculados a incidentes
- ✅ Estados: OPEN, IN_PROGRESS, DONE
- ✅ Asignación de usuarios
- ✅ Historial inmutable de todos los cambios
- ✅ Comentarios y cambios de estado
- ✅ Control de acceso por rol (ADMIN/OPERATOR)

**Endpoints principales:**
- `POST /api/v1/tickets` - Crear ticket
- `GET /api/v1/tickets` - Listar tickets
- `PATCH /api/v1/tickets/:id` - Actualizar ticket
- `POST /api/v1/tickets/:id/status` - Cambiar estado
- `POST /api/v1/tickets/:id/comments` - Agregar comentario
- `GET /api/v1/tickets/:id/events` - Ver historial

## Tecnologías

- **NestJS** - Framework de Node.js
- **Prisma** - ORM
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Passport** - Middleware de autenticación
- **Bcrypt** - Hashing de contraseñas
- **Swagger** - Documentación
- **TypeScript** - Lenguaje

## Licencia

MIT

## Autor

**Aland Laines Calonge**
- GitHub: [@alaines](https://github.com/alaines)

---

Si este proyecto te ha sido útil, considera darle una estrella en GitHub
