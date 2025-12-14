#!/bin/bash

# deploy.sh
# Script de despliegue completo para Alertas API v1.1.0
# Optimizado para Google Cloud VM con Ubuntu 24.04 LTS

set -e  # Salir si hay algún error

echo "============================================"
echo "  Alertas API - Despliegue en Producción"
echo "  Versión: 1.1.0"
echo "  Plataforma: Google Cloud VM - Ubuntu 24.04"
echo "============================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "Error: Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar Node.js
echo "[1/7] Verificando requisitos del sistema..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js no está instalado"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Se requiere Node.js 18 o superior (actual: $(node -v))"
    exit 1
fi

echo "   Node.js $(node -v) ✓"
echo "   npm $(npm -v) ✓"

# Verificar archivo .env
echo ""
echo "[2/7] Verificando configuración..."
if [ ! -f ".env" ]; then
    echo "Error: Archivo .env no encontrado"
    echo "Crear archivo .env con las siguientes variables:"
    echo "  DATABASE_URL=\"postgresql://user:pass@host:port/monitoreo_trafico\""
    echo "  PORT=80"
    echo "  JWT_SECRET=\"clave-secreta-jwt\""
    exit 1
fi

echo "   Archivo .env encontrado ✓"

# Verificar conexión a base de datos
echo ""
echo "[3/7] Verificando conexión a base de datos..."
if npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
    echo "   Conexión a base de datos exitosa ✓"
else
    echo "   Advertencia: No se pudo verificar la conexión a la base de datos"
    echo "   Continuando con el despliegue..."
fi

# Detener servidor si está corriendo
echo ""
echo "[4/7] Deteniendo servidor anterior..."
if [ -f "./stop-server.sh" ]; then
    ./stop-server.sh > /dev/null 2>&1 || true
    echo "   Servidor detenido ✓"
else
    pkill -f "node dist/main.js" > /dev/null 2>&1 || true
    echo "   Proceso anterior finalizado ✓"
fi

# Instalar dependencias
echo ""
echo "[5/7] Instalando dependencias..."
npm install --production=false
echo "   Dependencias instaladas ✓"

# Generar cliente Prisma
echo ""
echo "[6/7] Generando cliente Prisma..."
npx prisma generate
echo "   Cliente Prisma generado ✓"

# Compilar aplicación
echo ""
echo "[7/7] Compilando aplicación..."
npm run build
echo "   Aplicación compilada ✓"

# Crear directorio de logs si no existe
mkdir -p logs

echo ""
echo "============================================"
echo "  Despliegue completado exitosamente"
echo "============================================"
echo ""
echo "SIGUIENTES PASOS:"
echo ""
echo "1. Configurar nginx (si no está configurado):"
echo "   sudo cp nginx.conf /etc/nginx/sites-available/alertas-api"
echo "   sudo ln -s /etc/nginx/sites-available/alertas-api /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "2. Opción A - Iniciar con script (desarrollo/testing):"
echo "   ./start-server.sh"
echo ""
echo "3. Opción B - Instalar como servicio systemd (producción):"
echo "   sudo cp alertas-api.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable alertas-api"
echo "   sudo systemctl start alertas-api"
echo "   sudo systemctl status alertas-api"
echo ""
echo "Otros comandos disponibles:"
echo "  ./stop-server.sh       - Detener servidor"
echo "  ./restart-server.sh    - Reiniciar servidor"
echo ""
echo "Documentación API: http://host/api"
echo ""
