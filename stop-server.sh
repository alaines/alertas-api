#!/bin/bash
# Script para detener el servidor de alertas-api

echo "Deteniendo servidor de alertas-api..."
sudo pkill -f "node.*dist/main.js"
sleep 2

if ps aux | grep -q "node.*dist/main.js" | grep -v grep; then
    echo "❌ El servidor aún está corriendo"
    ps aux | grep "node.*dist/main.js" | grep -v grep
else
    echo "✅ Servidor detenido exitosamente"
fi
