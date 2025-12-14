# Scripts de Despliegue - Alertas API v1.1.0

## Scripts Disponibles

### Despliegue y Gestión del Servidor

#### deploy.sh
Script de despliegue completo para producción.

**Funcionalidad:**
- Verifica requisitos del sistema (Node.js 18+)
- Valida configuración (.env)
- Detiene servidor anterior si existe
- Instala dependencias
- Genera cliente Prisma
- Compila la aplicación

**Uso:**
```bash
./deploy.sh
```

**Después de ejecutar:**
El sistema queda listo para iniciar. Ejecutar `./start-server.sh`

---

#### start-server.sh
Inicia el servidor de Alertas API.

**Funcionalidad:**
- Detiene procesos anteriores del servidor
- Inicia servidor en puerto configurado (default: 80)
- Redirige logs a `/tmp/alertas-api.log`
- Verifica que el servidor está escuchando
- Muestra últimos logs de inicio

**Uso:**
```bash
./start-server.sh
```

**Nota:** Puerto 80 requiere sudo. El script solicitará la contraseña.

---

#### stop-server.sh
Detiene el servidor de Alertas API.

**Funcionalidad:**
- Busca y detiene procesos de Node.js ejecutando `dist/main.js`
- Verifica que el proceso se detuvo correctamente

**Uso:**
```bash
./stop-server.sh
```

---

#### restart-server.sh
Reinicia el servidor de Alertas API.

**Funcionalidad:**
- Ejecuta `stop-server.sh`
- Espera 2 segundos
- Ejecuta `start-server.sh`

**Uso:**
```bash
./restart-server.sh
```

**Cuándo usar:**
- Después de cambios en configuración (.env)
- Después de compilar nuevo código
- Para aplicar cambios en la base de datos
- Cuando el servidor no responde

---

#### status-server.sh
Muestra el estado actual del servidor.

**Funcionalidad:**
- Verifica si el servidor está corriendo
- Muestra PID del proceso
- Muestra uso de CPU y memoria
- Muestra tiempo de ejecución
- Lista puertos en escucha
- Muestra últimas líneas del log
- Realiza test de conectividad HTTP

**Uso:**
```bash
./status-server.sh
```

**Salida ejemplo:**
```
Estado: ACTIVO
PID: 12345
Información del proceso:
  12345 root      0.1  2.5    02:45:40 node dist/main.js
Puertos en escucha:
  tcp  0.0.0.0:80  LISTEN  12345/node
Test de conectividad:
  API respondiendo en puerto 80 ✓
```

---

### Backup y Mantenimiento

#### backup-db.sh
Realiza backup de las tablas del sistema.

**Funcionalidad:**
- Lee configuración de .env
- Extrae credenciales de DATABASE_URL
- Realiza dump de tablas: users, tickets, ticket_events, devices, device_events
- Comprime el backup con gzip
- Guarda en carpeta `./backups/`
- Limpia backups antiguos (>7 días)

**Uso:**
```bash
./backup-db.sh
```

**Archivo generado:**
```
./backups/alertas_api_backup_YYYYMMDD_HHMMSS.sql.gz
```

**Restaurar backup:**
```bash
gunzip ./backups/alertas_api_backup_YYYYMMDD_HHMMSS.sql.gz
psql -h host -p 5432 -U user -d monitoreo_trafico < ./backups/alertas_api_backup_YYYYMMDD_HHMMSS.sql
```

**Nota:** No incluye tabla `waze_incidents` (datos externos).

---

## Flujo de Trabajo Recomendado

### Despliegue Inicial

```bash
# 1. Configurar entorno
cp .env.example .env
nano .env  # Editar con credenciales reales

# 2. Ejecutar despliegue
./deploy.sh

# 3. Iniciar servidor
./start-server.sh

# 4. Verificar estado
./status-server.sh
```

### Actualización de Código

```bash
# 1. Obtener últimos cambios
git pull origin main

# 2. Ejecutar despliegue (instala, compila)
./deploy.sh

# 3. Reiniciar servidor
./restart-server.sh

# 4. Verificar funcionamiento
./status-server.sh
curl http://localhost/api/v1/auth/login
```

### Mantenimiento Regular

```bash
# Ver logs en tiempo real
tail -f /tmp/alertas-api.log

# Hacer backup (recomendado: diario)
./backup-db.sh

# Verificar estado del servidor
./status-server.sh

# Reiniciar si es necesario
./restart-server.sh
```

### Solución de Problemas

```bash
# 1. Verificar estado
./status-server.sh

# 2. Ver logs
tail -100 /tmp/alertas-api.log

# 3. Reiniciar servidor
./restart-server.sh

# 4. Si persiste, redesplegar
./stop-server.sh
./deploy.sh
./start-server.sh
```

---

## Automatización con Cron

### Backup Diario

Agregar a crontab:

```bash
# Editar crontab
crontab -e

# Agregar línea (backup a las 2:00 AM)
0 2 * * * cd /ruta/a/alertas-api && ./backup-db.sh >> /var/log/alertas-backup.log 2>&1
```

### Reinicio Semanal

```bash
# Reinicio cada domingo a las 3:00 AM
0 3 * * 0 cd /ruta/a/alertas-api && ./restart-server.sh >> /var/log/alertas-restart.log 2>&1
```

---

## Variables de Entorno Requeridas

Archivo `.env` debe contener:

```env
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/monitoreo_trafico"
PORT=80
JWT_SECRET="clave-secreta-minimo-32-caracteres"
```

---

## Permisos Requeridos

Todos los scripts deben tener permisos de ejecución:

```bash
chmod +x *.sh
```

Puerto 80 requiere privilegios root. Los scripts que inician el servidor usan `sudo`.

---

## Logs

### Ubicación
- Logs del servidor: `/tmp/alertas-api.log`
- Logs de despliegue: stdout
- Logs de backup: stdout (redirigir si se usa cron)

### Ver logs
```bash
# Últimas 100 líneas
tail -100 /tmp/alertas-api.log

# Seguimiento en tiempo real
tail -f /tmp/alertas-api.log

# Buscar errores
grep -i error /tmp/alertas-api.log

# Logs del día actual
grep "$(date +%Y-%m-%d)" /tmp/alertas-api.log
```

---

## Monitoreo

### Verificar Salud del Servicio

```bash
# Estado del proceso
./status-server.sh

# Test de endpoint
curl http://localhost/api/v1/auth/login

# Con autenticación
TOKEN="eyJhbGc..."
curl -H "Authorization: Bearer $TOKEN" http://localhost/api/v1/users/me/profile
```

### Métricas del Sistema

```bash
# Uso de memoria y CPU
ps aux | grep "node dist/main.js"

# Conexiones activas
ss -tn | grep :80

# Espacio en disco
df -h
du -sh /home/alaines/alertas-api
```

---

## Notas Importantes

1. **Puerto 80**: Requiere privilegios root. Para desarrollo, usar puerto >1024 en .env
2. **Backups**: Se mantienen 7 días por defecto. Ajustar en `backup-db.sh` si es necesario
3. **Logs**: `/tmp/alertas-api.log` se sobrescribe en cada inicio. Implementar rotación si es necesario
4. **Base de Datos**: Los scripts asumen que la tabla `waze_incidents` existe y es administrada externamente
5. **JWT Secret**: Cambiar el default en producción. Generar con: `openssl rand -base64 32`

---

## Soporte

Para problemas o consultas sobre los scripts de despliegue, contactar al administrador del sistema.
