#!/bin/bash

# restart-server.sh
# Script para reiniciar el servidor de Alertas API

echo "Reiniciando servidor de Alertas API..."

# Detener servidor
./stop-server.sh

# Esperar un momento
sleep 2

# Iniciar servidor
./start-server.sh

echo ""
echo "Reinicio completado."
