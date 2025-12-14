#!/bin/bash

# backup-db.sh
# Script para realizar backup de la base de datos

set -e

# Configuración
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="alertas_api_backup_${TIMESTAMP}.sql"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "============================================"
echo "  Alertas API - Backup de Base de Datos"
echo "============================================"
echo ""

# Leer configuración de .env
if [ ! -f ".env" ]; then
    echo "Error: Archivo .env no encontrado"
    exit 1
fi

# Extraer información de conexión
DB_URL=$(grep DATABASE_URL .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DB_URL" ]; then
    echo "Error: DATABASE_URL no encontrado en .env"
    exit 1
fi

# Parse DATABASE_URL (formato: postgresql://user:pass@host:port/dbname)
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "Configuración:"
echo "  Host: $DB_HOST"
echo "  Puerto: $DB_PORT"
echo "  Base de datos: $DB_NAME"
echo "  Usuario: $DB_USER"
echo ""

# Tablas a respaldar
TABLES="users tickets ticket_events devices device_events"

echo "Iniciando backup..."
echo ""

# Realizar backup solo de las tablas del sistema (no waze_incidents)
PGPASSWORD=$DB_PASS pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-privileges \
    -t users \
    -t tickets \
    -t ticket_events \
    -t devices \
    -t device_events \
    > "$BACKUP_DIR/$BACKUP_FILE"

# Comprimir backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

FINAL_FILE="$BACKUP_DIR/${BACKUP_FILE}.gz"
FILE_SIZE=$(du -h "$FINAL_FILE" | cut -f1)

echo "============================================"
echo "  Backup completado exitosamente"
echo "============================================"
echo ""
echo "Archivo: $FINAL_FILE"
echo "Tamaño: $FILE_SIZE"
echo ""
echo "Para restaurar:"
echo "  gunzip $FINAL_FILE"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $BACKUP_DIR/$BACKUP_FILE"
echo ""

# Limpiar backups antiguos (mantener últimos 7 días)
echo "Limpiando backups antiguos (>7 días)..."
find "$BACKUP_DIR" -name "alertas_api_backup_*.sql.gz" -mtime +7 -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/alertas_api_backup_*.sql.gz 2>/dev/null | wc -l)
echo "Backups disponibles: $REMAINING"
echo ""
