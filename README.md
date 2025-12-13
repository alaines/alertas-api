# Alertas API

API REST para gestión de incidentes viales basados en datos de Waze, construida con NestJS, Prisma y PostgreSQL.

## Características

- **API REST completa** para consulta de incidentes viales
- **Filtros avanzados** por tipo, categoría, ciudad, estado y rango de fechas
- **Búsqueda geoespacial** de incidentes cercanos a una ubicación
- **Documentación interactiva** con Swagger/OpenAPI
- **Base de datos PostgreSQL** con Prisma ORM
- **TypeScript** para desarrollo type-safe

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

Edita el archivo `.env` con tus credenciales de PostgreSQL:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/monitoreo_trafico?schema=public"
```

4. **Generar el cliente de Prisma**
```bash
npm run prisma:generate
```

5. **Ejecutar migraciones** (si las tienes)
```bash
npx prisma migrate deploy
```

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

**Nota:** Para ejecutar en el puerto 80 en Linux, necesitas privilegios de root o configurar capacidades:
```bash
sudo npm start
# O configurar capacidades:
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

## Documentación

Accede a la documentación interactiva de Swagger en:
```
http://localhost/api/v1/docs
```

## Endpoints principales

### Listar incidentes
```http
GET /api/v1/incidents
```

**Parámetros opcionales:**
- `type` - Tipo de incidente (ACCIDENT, JAM, WEATHERHAZARD, etc.)
- `category` - Categoría del incidente
- `status` - Estado (active, inactive)
- `city` - Ciudad
- `from` - Fecha inicio (ISO 8601)
- `to` - Fecha fin (ISO 8601)
- `limit` - Número máximo de resultados

**Ejemplo:**
```bash
curl "http://localhost/api/v1/incidents?type=ACCIDENT&status=active&limit=10"
```

### Obtener incidente por ID
```http
GET /api/v1/incidents/:id
```

### Buscar incidentes cercanos
```http
GET /api/v1/incidents/near?lat=LATITUDE&lon=LONGITUDE&radius=METROS
```

**Parámetros:**
- `lat` - Latitud (requerido)
- `lon` - Longitud (requerido)
- `radius` - Radio de búsqueda en metros (opcional, default: 5000)

**Ejemplo:**
```bash
curl "http://localhost/api/v1/incidents/near?lat=-12.0464&lon=-77.0428&radius=3000"
```

### Estadísticas por tipo
```http
GET /api/v1/incidents/stats/by-type
```

### Estadísticas por ciudad
```http
GET /api/v1/incidents/stats/by-city
```

## Modelo de datos

La API utiliza el siguiente esquema de base de datos:

```prisma
model WazeIncident {
  id             BigInt   @id @default(autoincrement())
  source         String   @default("waze")
  uuid           String   @unique
  type           String
  subtype        String?
  city           String?
  street         String?
  road_type      Int?
  magvar         Int?
  report_rating  Int?
  report_by_muni Boolean
  confidence     Int?
  reliability    Int?
  pub_millis     BigInt
  pub_time       DateTime
  category       String?
  priority       Int?
  status         String   @default("active")
  created_at     DateTime @default(now())
  updated_at     DateTime @default(now())
}
```

## Scripts disponibles

```bash
# Desarrollo con hot-reload
npm run start:dev

# Compilar para producción
npm run build

# Iniciar en producción
npm start

# Generar cliente Prisma
npm run prisma:generate

# Linting
npm run lint
```

## Estructura del proyecto

```
alertas-api/
├── prisma/
│   └── schema.prisma       # Esquema de base de datos
├── src/
│   ├── incidents/          # Módulo de incidentes
│   │   ├── dto/
│   │   ├── incidents.controller.ts
│   │   ├── incidents.service.ts
│   │   └── incidents.module.ts
│   ├── prisma/             # Módulo de Prisma
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts       # Módulo principal
│   └── main.ts             # Punto de entrada
├── .env.example            # Variables de entorno de ejemplo
├── nest-cli.json           # Configuración de NestJS
├── package.json
├── tsconfig.json
└── README.md
```

## Tecnologías

- **[NestJS](https://nestjs.com/)** - Framework de Node.js progresivo
- **[Prisma](https://www.prisma.io/)** - ORM de próxima generación
- **[PostgreSQL](https://www.postgresql.org/)** - Base de datos relacional
- **[Swagger](https://swagger.io/)** - Documentación de API
- **[TypeScript](https://www.typescriptlang.org/)** - JavaScript tipado

## Licencia

MIT

## Autor

**Aland Laines Calonge**
- GitHub: [@alaines](https://github.com/alaines)

---

Si este proyecto te ha sido útil, considera darle una estrella en GitHub
