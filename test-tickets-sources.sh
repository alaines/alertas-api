#!/bin/bash

# Test de sistema de tickets con diferentes fuentes
BASE_URL="http://192.168.18.230/api/v1"

echo "========================================="
echo "PRUEBA DE SISTEMA DE TICKETS CON FUENTES"
echo "========================================="
echo ""

# 1. Login
echo "1. Login como admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  echo "Respuesta: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login exitoso, token obtenido"
echo ""

# 2. Crear ticket desde WAZE (con incidentId)
echo "2. Crear ticket desde WAZE (con incidentId)..."
TICKET1=$(curl -s -X POST "$BASE_URL/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "source": "WAZE",
    "incidentId": 857487,
    "incidentType": "ACCIDENT",
    "title": "Accidente reportado desde Waze",
    "description": "Incidente detectado en Waze que requiere verificación",
    "priority": 8
  }')

echo "Respuesta: $TICKET1" | jq .
echo ""

# 3. Crear ticket desde llamada telefónica (sin incidentId)
echo "3. Crear ticket desde llamada telefónica (sin incidentId)..."
TICKET2=$(curl -s -X POST "$BASE_URL/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "source": "PHONE_CALL",
    "incidentType": "POTHOLE",
    "title": "Reporte de bache en Av. Colonial",
    "description": "Llamada de vecino reportando bache grande en Av. Colonial altura 1234",
    "priority": 6
  }')

echo "Respuesta: $TICKET2" | jq .
echo ""

# 4. Crear ticket desde WhatsApp (sin incidentId)
echo "4. Crear ticket desde WhatsApp (sin incidentId)..."
TICKET3=$(curl -s -X POST "$BASE_URL/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "source": "WHATSAPP",
    "incidentType": "TRAFFIC_JAM",
    "title": "Congestión vehicular en Av. Arequipa",
    "description": "Reporte vía WhatsApp de tráfico intenso por obras",
    "priority": 5
  }')

echo "Respuesta: $TICKET3" | jq .
echo ""

# 5. Crear ticket desde inspectores (sin incidentId)
echo "5. Crear ticket desde inspectores (sin incidentId)..."
TICKET4=$(curl -s -X POST "$BASE_URL/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "source": "INSPECTORS",
    "incidentType": "ROAD_CLOSED",
    "title": "Cierre de vía por mantenimiento",
    "description": "Inspector reporta cierre programado de vía",
    "priority": 7
  }')

echo "Respuesta: $TICKET4" | jq .
echo ""

# 6. Intentar crear ticket WAZE sin incidentId (debe fallar)
echo "6. Intentar crear ticket WAZE sin incidentId (DEBE FALLAR)..."
TICKET_ERROR=$(curl -s -X POST "$BASE_URL/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "source": "WAZE",
    "title": "Esto debe fallar",
    "description": "Ticket WAZE sin incidentId",
    "priority": 5
  }')

echo "Respuesta: $TICKET_ERROR" | jq .
echo ""

# 7. Listar todos los tickets
echo "7. Listar todos los tickets creados..."
ALL_TICKETS=$(curl -s -X GET "$BASE_URL/tickets" \
  -H "Authorization: Bearer $TOKEN")

echo "Total de tickets: $(echo $ALL_TICKETS | jq 'length')"
echo "Tickets con source:"
echo $ALL_TICKETS | jq '[.[] | {id, source, incidentType, title, incidentId}]'
echo ""

# 8. Filtrar tickets por source=PHONE_CALL
echo "8. Filtrar tickets por source=PHONE_CALL..."
PHONE_TICKETS=$(curl -s -X GET "$BASE_URL/tickets?source=PHONE_CALL" \
  -H "Authorization: Bearer $TOKEN")

echo "Tickets de llamadas telefónicas: $(echo $PHONE_TICKETS | jq 'length')"
echo $PHONE_TICKETS | jq '[.[] | {id, source, title}]'
echo ""

echo "========================================="
echo "PRUEBAS COMPLETADAS"
echo "========================================="
