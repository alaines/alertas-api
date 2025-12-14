#!/bin/bash
# Script para iniciar el servidor de alertas-api en puerto 80
# Requiere permisos de sudo

cd /home/alaines/alertas-api

echo "Deteniendo procesos anteriores..."
sudo pkill -f "node.*dist/main.js" 2>/dev/null
sleep 2

echo "Iniciando servidor en puerto 80..."
sudo npm run start > /tmp/alertas-api.log 2>&1 &

sleep 6

echo ""
echo "Verificando estado del servidor..."
if sudo netstat -tlnp | grep -q ":80 "; then
    echo "✅ Servidor iniciado correctamente en puerto 80"
    echo ""
    echo "Últimos logs:"
    tail -10 /tmp/alertas-api.log
    echo ""
    echo "API disponible en: http://192.168.18.230/api/v1"
    echo "Swagger docs en: http://192.168.18.230/api"
else
    echo "❌ Error: El servidor no está escuchando en el puerto 80"
    echo ""
    echo "Logs de error:"
    tail -20 /tmp/alertas-api.log
fi
