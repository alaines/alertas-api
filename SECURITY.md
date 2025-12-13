# Guía de Seguridad con API Keys

## Configuración

### 1. Generar API Keys

Genera tus propias API Keys seguras usando Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Esto generará algo como: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

### 2. Configurar en el servidor

Agrega las API Keys generadas en tu archivo `.env`:

```env
API_KEYS="key1,key2,key3"
```

Puedes tener múltiples keys separadas por comas, una por cada aplicación/cliente que necesite acceso.

## Uso en el Frontend

### JavaScript / Fetch

```javascript
fetch('http://tu-servidor/api/v1/incidents', {
  method: 'GET',
  headers: {
    'x-api-key': 'tu-api-key-aqui'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://tu-servidor/api/v1',
  headers: {
    'x-api-key': 'tu-api-key-aqui'
  }
});

// Usar la instancia configurada
api.get('/incidents')
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));
```

### React con fetch

```javascript
const API_KEY = 'tu-api-key-aqui';
const API_BASE_URL = 'http://tu-servidor/api/v1';

async function fetchIncidents() {
  try {
    const response = await fetch(`${API_BASE_URL}/incidents`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error('Error en la petición');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Angular

```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';

export class IncidentsService {
  private apiKey = 'tu-api-key-aqui';
  private baseUrl = 'http://tu-servidor/api/v1';

  constructor(private http: HttpClient) {}

  getIncidents() {
    const headers = new HttpHeaders({
      'x-api-key': this.apiKey
    });

    return this.http.get(`${this.baseUrl}/incidents`, { headers });
  }
}
```

## Uso en Postman

### Opción 1: Header manual

1. Abre Postman
2. Crea una nueva petición GET a: `http://tu-servidor/api/v1/incidents`
3. Ve a la pestaña **Headers**
4. Agrega un nuevo header:
   - **Key**: `x-api-key`
   - **Value**: `tu-api-key-aqui`
5. Envía la petición

### Opción 2: Variables de entorno (Recomendado)

1. En Postman, haz clic en el icono de "Environments" (esquina superior derecha)
2. Crea un nuevo ambiente llamado "Alertas API"
3. Agrega las variables:
   - **Variable**: `api_key` → **Value**: `tu-api-key-aqui`
   - **Variable**: `base_url` → **Value**: `http://tu-servidor/api/v1`
4. En tu petición:
   - URL: `{{base_url}}/incidents`
   - Header: `x-api-key` → `{{api_key}}`
5. Selecciona el ambiente "Alertas API" en el dropdown superior
6. Envía la petición

### Opción 3: Authorization header en colección

1. Crea una colección para "Alertas API"
2. Haz clic derecho en la colección → **Edit**
3. Ve a la pestaña **Authorization**
4. Selecciona **Type**: API Key
5. Configura:
   - **Key**: `x-api-key`
   - **Value**: `tu-api-key-aqui`
   - **Add to**: Header
6. Todas las peticiones en esa colección heredarán este header automáticamente

## Respuestas de error

### Sin API Key
```json
{
  "statusCode": 401,
  "message": "API key is required",
  "error": "Unauthorized"
}
```

### API Key inválida
```json
{
  "statusCode": 401,
  "message": "Invalid API key",
  "error": "Unauthorized"
}
```

## Mejores prácticas

1. **Nunca expongas las API Keys en el código del frontend**: Usa variables de entorno
2. **Rota las keys periódicamente**: Genera nuevas keys cada cierto tiempo
3. **Una key por aplicación**: Facilita el seguimiento y revocación
4. **Usa HTTPS en producción**: Para cifrar las keys en tránsito
5. **Monitorea el uso**: Implementa logging para detectar uso indebido

## Seguridad adicional en producción

Considera combinar API Keys con:
- Rate limiting
- IP whitelisting
- JWT tokens para usuarios finales
- OAuth2 para aplicaciones de terceros
