# Guía de Despliegue en Google Cloud VM

## Entorno de Producción

- **Plataforma:** Google Cloud Platform (GCP)
- **Sistema Operativo:** Ubuntu 24.04 LTS
- **Servidor Web:** nginx (proxy reverso)
- **Base de Datos:** PostgreSQL con PostGIS
- **Gestor de Procesos:** systemd

## Requisitos Previos

### 1. Crear VM en Google Cloud

```bash
# Especificaciones mínimas recomendadas:
- Tipo de máquina: e2-medium (2 vCPU, 4 GB RAM)
- Disco: 20 GB SSD
- Región: Seleccionar la más cercana a usuarios
- Firewall: Permitir tráfico HTTP (80) y HTTPS (443)
```

### 2. Configurar Firewall en GCP

En Cloud Console > VPC Network > Firewall rules:

```
Regla HTTP:
- Nombre: allow-http
- Targets: All instances in the network
- Source IP ranges: 0.0.0.0/0
- Protocols and ports: tcp:80

Regla HTTPS:
- Nombre: allow-https
- Targets: All instances in the network
- Source IP ranges: 0.0.0.0/0
- Protocols and ports: tcp:443
```

### 3. Conectar a la VM

```bash
# Desde Cloud Console o usando gcloud CLI
gcloud compute ssh nombre-de-tu-vm --zone=tu-zona
```

## Instalación Inicial

### 1. Actualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Node.js 18+

```bash
# Instalar NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node -v  # Debe ser 18.x o superior
npm -v
```

### 3. Instalar PostgreSQL con PostGIS

```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib postgis

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar
sudo systemctl status postgresql
```

### 4. Instalar nginx

```bash
# Instalar nginx
sudo apt install -y nginx

# Iniciar y habilitar
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar
sudo systemctl status nginx
```

### 5. Configurar PostgreSQL

```bash
# Cambiar a usuario postgres
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE monitoreo_trafico;
CREATE USER alertas WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE monitoreo_trafico TO alertas;

# Habilitar PostGIS
\c monitoreo_trafico
CREATE EXTENSION IF NOT EXISTS postgis;

# Salir
\q
```

### 6. Crear Usuario del Sistema

```bash
# Crear usuario sin privilegios para ejecutar la aplicación
sudo useradd -r -s /bin/bash -d /opt/alertas-api alertas
sudo mkdir -p /opt/alertas-api
sudo chown alertas:alertas /opt/alertas-api
```

## Despliegue de la Aplicación

### 1. Clonar Repositorio

```bash
# Opción A: Desde GitHub (recomendado)
cd /opt/alertas-api
sudo -u alertas git clone https://github.com/alaines/alertas-api.git .

# Opción B: Subir archivos con SCP
# Desde tu máquina local:
gcloud compute scp --recurse ./alertas-api/* nombre-vm:/tmp/alertas-api/
# Luego en la VM:
sudo mv /tmp/alertas-api/* /opt/alertas-api/
sudo chown -R alertas:alertas /opt/alertas-api
```

### 2. Configurar Variables de Entorno

```bash
cd /opt/alertas-api
sudo -u alertas cp .env.example .env
sudo -u alertas nano .env
```

Configurar con valores de producción:

```env
DATABASE_URL="postgresql://alertas:tu_password@localhost:5432/monitoreo_trafico?schema=public"
NODE_ENV=production
PORT=3000
JWT_SECRET="generar-con-openssl-rand-base64-32"
```

### 3. Ejecutar Despliegue

```bash
cd /opt/alertas-api
sudo -u alertas ./deploy.sh
```

### 4. Configurar nginx

```bash
# Copiar configuración
sudo cp /opt/alertas-api/nginx.conf /etc/nginx/sites-available/alertas-api

# Editar con tu dominio o IP
sudo nano /etc/nginx/sites-available/alertas-api
# Cambiar: server_name tu-dominio.com;

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/alertas-api /etc/nginx/sites-enabled/

# Remover sitio por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

### 5. Instalar como Servicio systemd

```bash
# Copiar archivo de servicio
sudo cp /opt/alertas-api/alertas-api.service /etc/systemd/system/

# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable alertas-api

# Iniciar servicio
sudo systemctl start alertas-api

# Verificar estado
sudo systemctl status alertas-api
```

## Configuración SSL con Let's Encrypt

### 1. Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtener Certificado

```bash
# Asegurarse que el dominio apunta a la IP de la VM
sudo certbot --nginx -d tu-dominio.com
```

### 3. Renovación Automática

```bash
# Certbot configura automáticamente cron para renovación
# Verificar:
sudo certbot renew --dry-run
```

## Gestión de la Aplicación

### Ver Logs

```bash
# Logs del servicio
sudo journalctl -u alertas-api -f

# Logs de nginx
sudo tail -f /var/log/nginx/alertas-api-access.log
sudo tail -f /var/log/nginx/alertas-api-error.log
```

### Controlar Servicio

```bash
# Estado
sudo systemctl status alertas-api

# Reiniciar
sudo systemctl restart alertas-api

# Detener
sudo systemctl stop alertas-api

# Iniciar
sudo systemctl start alertas-api

# Ver logs en tiempo real
sudo journalctl -u alertas-api -f
```

### Actualizar Aplicación

```bash
# 1. Ir al directorio
cd /opt/alertas-api

# 2. Obtener cambios (si usas git)
sudo -u alertas git pull origin main

# 3. Redesplegar
sudo -u alertas ./deploy.sh

# 4. Reiniciar servicio
sudo systemctl restart alertas-api

# 5. Verificar
sudo systemctl status alertas-api
```

## Backup y Mantenimiento

### Backup Automático

```bash
# Editar crontab del usuario alertas
sudo crontab -u alertas -e

# Agregar backup diario a las 2:00 AM
0 2 * * * cd /opt/alertas-api && ./backup-db.sh >> /var/log/alertas-backup.log 2>&1
```

### Rotación de Logs

Crear archivo `/etc/logrotate.d/alertas-api`:

```bash
/var/log/nginx/alertas-api-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

## Monitoreo

### Verificar Salud del Sistema

```bash
# Estado del servicio
sudo systemctl status alertas-api

# Estado de nginx
sudo systemctl status nginx

# Estado de PostgreSQL
sudo systemctl status postgresql

# Uso de recursos
htop

# Espacio en disco
df -h

# Test de API
curl http://localhost:3000/api/v1/health
curl http://tu-dominio.com/api/v1/auth/login
```

### Alertas por Email (opcional)

Instalar y configurar `postfix` para notificaciones:

```bash
sudo apt install -y postfix mailutils
```

## Seguridad

### 1. Firewall (ufw)

```bash
# Instalar y configurar ufw
sudo apt install -y ufw

# Permitir SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

### 2. Actualizaciones Automáticas

```bash
# Instalar unattended-upgrades
sudo apt install -y unattended-upgrades

# Configurar
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 3. Fail2ban (protección contra ataques)

```bash
# Instalar
sudo apt install -y fail2ban

# Configurar
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Solución de Problemas

### La aplicación no inicia

```bash
# Ver logs del servicio
sudo journalctl -u alertas-api -n 50

# Verificar permisos
ls -la /opt/alertas-api

# Verificar .env
sudo -u alertas cat /opt/alertas-api/.env

# Probar manualmente
cd /opt/alertas-api
sudo -u alertas node dist/main.js
```

### nginx retorna 502 Bad Gateway

```bash
# Verificar que el servicio Node.js está corriendo
sudo systemctl status alertas-api

# Verificar puerto
sudo netstat -tlnp | grep 3000

# Ver logs de nginx
sudo tail -50 /var/log/nginx/alertas-api-error.log
```

### Base de datos no conecta

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Probar conexión
psql -h localhost -U alertas -d monitoreo_trafico

# Ver logs de PostgreSQL
sudo tail -50 /var/log/postgresql/postgresql-*.log
```

## Comandos Útiles

```bash
# Ver IP externa de la VM
curl ifconfig.me

# Ver procesos de Node.js
ps aux | grep node

# Uso de memoria
free -h

# Conexiones activas
ss -tunlp

# Verificar puertos abiertos
sudo netstat -tlnp

# Reiniciar todo
sudo systemctl restart postgresql nginx alertas-api
```

## Costos Estimados (GCP)

- **VM e2-medium:** ~$24/mes
- **Disco 20GB SSD:** ~$3/mes
- **IP Estática:** ~$3/mes (opcional)
- **Total aproximado:** $30/mes

Para optimizar costos, considerar:
- Usar discos HDD en lugar de SSD (no crítico)
- Apagar VM cuando no se use (desarrollo)
- Usar alertas de presupuesto en GCP

## Recursos Adicionales

- [Documentación GCP](https://cloud.google.com/docs)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [Let's Encrypt](https://letsencrypt.org/getting-started/)

## Soporte

Para problemas específicos de despliegue en Google Cloud, contactar al administrador del sistema.
