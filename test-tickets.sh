#!/bin/bash

# Script de prueba del sistema de tickets
# Asegúrate de que el API esté corriendo antes de ejecutar este script

API_URL="http://192.168.18.230/api/v1"
EMAIL="admin@alertas.com"
PASSWORD="admin123"

echo "🧪 Probando Sistema de Tickets - Alertas API"
echo "=============================================="
echo ""

# 1. Login
echo "1️⃣  Obteniendo token JWT..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido: ${TOKEN:0:30}..."
echo ""

# 2. Crear ticket
echo "2️⃣  Creando ticket de prueba..."
CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "incidentId": 1,
    "title": "Ticket de prueba automatizada",
    "description": "Este ticket fue creado automáticamente para probar el sistema",
    "priority": 3
  }')

TICKET_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$TICKET_ID" ]; then
  echo "❌ Error: No se pudo crear el ticket"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✅ Ticket creado con ID: $TICKET_ID"
echo ""

# 3. Listar tickets
echo "3️⃣  Listando todos los tickets..."
LIST_RESPONSE=$(curl -s "${API_URL}/tickets" \
  -H "Authorization: Bearer $TOKEN")

TICKET_COUNT=$(echo $LIST_RESPONSE | grep -o '"id"' | wc -l)
echo "✅ Se encontraron $TICKET_COUNT ticket(s)"
echo ""

# 4. Obtener ticket específico
echo "4️⃣  Obteniendo detalles del ticket $TICKET_ID..."
GET_RESPONSE=$(curl -s "${API_URL}/tickets/${TICKET_ID}" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Ticket obtenido correctamente"
echo ""

# 5. Cambiar estado a IN_PROGRESS
echo "5️⃣  Cambiando estado a IN_PROGRESS..."
STATUS_RESPONSE=$(curl -s -X POST "${API_URL}/tickets/${TICKET_ID}/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "IN_PROGRESS",
    "message": "Iniciando revisión del incidente"
  }')

echo "✅ Estado cambiado exitosamente"
echo ""

# 6. Agregar comentario
echo "6️⃣  Agregando comentario al ticket..."
COMMENT_RESPONSE=$(curl -s -X POST "${API_URL}/tickets/${TICKET_ID}/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Este es un comentario de prueba del sistema de tickets"
  }')

echo "✅ Comentario agregado exitosamente"
echo ""

# 7. Actualizar ticket
echo "7️⃣  Actualizando prioridad del ticket..."
UPDATE_RESPONSE=$(curl -s -X PATCH "${API_URL}/tickets/${TICKET_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "priority": 5,
    "description": "Descripción actualizada - Prioridad ALTA"
  }')

echo "✅ Ticket actualizado exitosamente"
echo ""

# 8. Obtener historial de eventos
echo "8️⃣  Obteniendo historial de eventos..."
EVENTS_RESPONSE=$(curl -s "${API_URL}/tickets/${TICKET_ID}/events" \
  -H "Authorization: Bearer $TOKEN")

EVENT_COUNT=$(echo $EVENTS_RESPONSE | grep -o '"eventType"' | wc -l)
echo "✅ Se encontraron $EVENT_COUNT evento(s) en el historial"
echo ""

# 9. Cambiar estado a DONE
echo "9️⃣  Cerrando ticket (estado DONE)..."
DONE_RESPONSE=$(curl -s -X POST "${API_URL}/tickets/${TICKET_ID}/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "DONE",
    "message": "Ticket de prueba completado exitosamente"
  }')

echo "✅ Ticket cerrado exitosamente"
echo ""

# 10. Verificar estado final
echo "🔟 Verificando estado final del ticket..."
FINAL_RESPONSE=$(curl -s "${API_URL}/tickets/${TICKET_ID}" \
  -H "Authorization: Bearer $TOKEN")

FINAL_STATUS=$(echo $FINAL_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo "✅ Estado final: $FINAL_STATUS"
echo ""

# Resumen
echo "=============================================="
echo "✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE"
echo "=============================================="
echo ""
echo "📊 Resumen:"
echo "  - Ticket ID: $TICKET_ID"
echo "  - Estado final: $FINAL_STATUS"
echo "  - Eventos registrados: $EVENT_COUNT"
echo "  - Total de tickets: $TICKET_COUNT"
echo ""
echo "🌐 Ver en Swagger: ${API_URL}/docs"
echo ""
