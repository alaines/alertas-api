# Guía de Integración Frontend - Sistema de Autenticación

Esta guía explica cómo integrar el sistema de autenticación JWT en el frontend de Alertas Web.

## Cambios Principales

El sistema ahora usa **JWT (JSON Web Tokens)** en lugar de API Keys para autenticación. Esto proporciona:
- Autenticación por usuario
- Control de acceso basado en roles
- Sesiones seguras con expiración
- Mejor trazabilidad de acciones

## Flujo de Autenticación

```
1. Usuario ingresa email/password → POST /api/v1/auth/login
2. Backend valida credenciales → Retorna access_token
3. Frontend guarda token (localStorage/sessionStorage)
4. Frontend incluye token en cada petición → Header: Authorization: Bearer {token}
5. Backend valida token y permisos → Retorna datos o error 401
```

## Implementación en React/TypeScript

### 1. Crear servicio de autenticación

```typescript
// src/services/auth.service.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.18.230/api/v1';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    username: string;
    fullName: string;
    role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  };
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }
}

export default new AuthService();
```

### 2. Configurar Axios con interceptor

```typescript
// src/api/axios.config.ts
import axios from 'axios';
import authService from '../services/auth.service';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.18.230/api/v1',
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores 401 (no autenticado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Actualizar servicio de incidentes

```typescript
// src/api/incidents.ts
import api from './axios.config';

export interface Incident {
  id: number;
  uuid: string;
  type: string;
  subtype: string | null;
  city: string | null;
  street: string | null;
  category: string | null;
  priority: number | null;
  status: string;
  pub_time: string;
  reliability: number | null;
  confidence: number | null;
  lat: number;
  lon: number;
  distance?: number;
  closedAt?: string;
  closedBy?: string;
}

export async function fetchIncidents(params: {
  status?: string;
  type?: string;
  category?: string;
  limit?: number;
} = {}): Promise<Incident[]> {
  const response = await api.get<Incident[]>('/incidents', {
    params: {
      status: params.status ?? 'active',
      type: params.type,
      category: params.category,
      limit: params.limit ?? 200,
    },
  });
  return response.data;
}
```

### 4. Actualizar componente Login

```typescript
// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login({ email, password });
      navigate('/map');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Error al iniciar sesión. Verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@alertas.com"
            required
          />
        </div>

        <div className="mb-3">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
```

### 5. Proteger rutas privadas

```typescript
// src/components/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';
import authService from '../services/auth.service';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !authService.hasRole(requiredRole)) {
    return (
      <div className="alert alert-danger">
        No tienes permisos para acceder a esta página
      </div>
    );
  }

  return <>{children}</>;
}
```

```typescript
// src/main.tsx
import { PrivateRoute } from './components/PrivateRoute';

<Routes>
  <Route path="/login" element={<Login />} />
  
  <Route 
    path="/map" 
    element={
      <PrivateRoute>
        <App />
      </PrivateRoute>
    } 
  />
  
  <Route 
    path="/admin" 
    element={
      <PrivateRoute requiredRole="ADMIN">
        <AdminPanel />
      </PrivateRoute>
    } 
  />
  
  <Route path="/" element={<Navigate to="/map" replace />} />
</Routes>
```

### 6. Actualizar header con info del usuario

```typescript
// En App.tsx o Header.tsx
import authService from '../services/auth.service';

function Header() {
  const user = authService.getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-bottom p-3">
      <div className="d-flex justify-content-between align-items-center">
        <h1>Alertas Viales</h1>
        
        <div className="d-flex align-items-center gap-3">
          <span>
            <i className="fas fa-user"></i> {user?.fullName}
            <span className="badge bg-primary ms-2">{user?.role}</span>
          </span>
          
          {user?.role === 'ADMIN' && (
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => navigate('/admin')}
            >
              <i className="fas fa-cog"></i> Admin
            </button>
          )}
          
          <button 
            className="btn btn-sm btn-outline-danger"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i> Salir
          </button>
        </div>
      </div>
    </header>
  );
}
```

## Variables de Entorno

Actualiza tu archivo `.env`:

```env
# Antes (API Key)
VITE_API_URL="http://192.168.18.230/api/v1"
VITE_API_KEY="tu-api-key"  # ❌ Ya no se usa

# Ahora (JWT)
VITE_API_URL="http://192.168.18.230/api/v1"
# No se necesita API_KEY, el token se obtiene al hacer login
```

## Credenciales Iniciales

Para testing, usa estas credenciales:

```
Email: admin@alertas.com
Password: admin123
Role: ADMIN
```

⚠️ **Importante**: Cambia la contraseña después del primer login usando el endpoint:
```
POST /api/v1/users/change-password
```

## Manejo de Errores

### 401 Unauthorized
- Token inválido o expirado
- Usuario no autenticado
- **Acción**: Redirigir a login

### 403 Forbidden
- Usuario sin permisos para la acción
- **Acción**: Mostrar mensaje de error

### 400 Bad Request
- Credenciales inválidas
- Datos de entrada incorrectos
- **Acción**: Mostrar mensaje de error específico

## Roles y Permisos

### VIEWER
- Ver incidentes
- Ver mapa
- Ver estadísticas

### OPERATOR
- Todo lo de VIEWER
- Gestionar incidentes (si se implementa)
- Exportar reportes (si se implementa)

### ADMIN
- Todo lo de OPERATOR
- Gestionar usuarios (crear, editar, eliminar)
- Ver logs del sistema (si se implementa)
- Configuración general

## Checklist de Migración

- [ ] Instalar dependencias si hace falta (`axios` ya está)
- [ ] Crear `auth.service.ts`
- [ ] Crear `axios.config.ts` con interceptores
- [ ] Actualizar `incidents.ts` para usar instancia configurada
- [ ] Modificar componente `Login.tsx`
- [ ] Crear componente `PrivateRoute.tsx`
- [ ] Actualizar rutas en `main.tsx`
- [ ] Actualizar header con info del usuario
- [ ] Remover código relacionado con API Keys
- [ ] Actualizar archivo `.env`
- [ ] Probar login y navegación
- [ ] Probar expiración de token
- [ ] Probar permisos por rol

## Testing

```bash
# 1. Login exitoso
curl -X POST http://192.168.18.230/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alertas.com","password":"admin123"}'

# 2. Obtener incidentes con token
curl http://192.168.18.230/api/v1/incidents \
  -H "Authorization: Bearer {TU_TOKEN_AQUI}"

# 3. Obtener perfil
curl http://192.168.18.230/api/v1/users/me/profile \
  -H "Authorization: Bearer {TU_TOKEN_AQUI}"
```

## Soporte

Si tienes problemas:
1. Verifica que el backend esté corriendo
2. Revisa la consola del navegador (F12)
3. Verifica la pestaña Network para ver la respuesta del servidor
4. Confirma que el token se está guardando en localStorage
5. Verifica que el token se esté enviando en el header Authorization

---

**Última actualización**: 13 de diciembre de 2025
