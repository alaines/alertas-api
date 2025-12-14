#!/bin/bash

# status-server.sh
# Script para verificar el estado del servidor de Alertas API

echo "============================================"
echo "  Alertas API - Estado del Servidor"
echo "============================================"
echo ""

# Verificar proceso
PID=$(pgrep -f "node dist/main.js")

if [ -z "$PID" ]; then
    echo "Estado: DETENIDO"
    echo ""
    echo "El servidor no está corriendo."
    echo "Para iniciar: ./start-server.sh"
    exit 1
else
    echo "Estado: ACTIVO"
    echo "PID: $PID"
    
    # Información del proceso
    echo ""
    echo "Información del proceso:"
    ps -p $PID -o pid,user,%cpu,%mem,etime,cmd --no-headers
    
    # Verificar puerto
    echo ""
    echo "Puertos en escucha:"
    sudo netstat -tlnp 2>/dev/null | grep "$PID" || ss -tlnp 2>/dev/null | grep "$PID"
    
    # Verificar logs recientes
    if [ -f "/tmp/alertas-api.log" ]; then
        echo ""
        echo "Últimas líneas del log:"
        tail -5 /tmp/alertas-api.log
    fi
    
    # Test de conectividad
    echo ""
    echo "Test de conectividad:"
    PORT=$(grep -E "^PORT=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    PORT=${PORT:-80}
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/v1/auth/login > /dev/null 2>&1; then
        echo "   API respondiendo en puerto $PORT ✓"
    else
        echo "   Advertencia: API no responde en puerto $PORT"
    fi
    
    echo ""
    echo "Para ver logs en tiempo real: tail -f /tmp/alertas-api.log"
    echo "Para reiniciar servidor: ./restart-server.sh"
    echo "Para detener servidor: ./stop-server.sh"
fi

echo ""
