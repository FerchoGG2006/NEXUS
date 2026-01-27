# 🔗 Guía de Configuración de Webhooks

Esta guía te muestra cómo conectar Facebook, Instagram y WhatsApp a tu sistema NEXUS AUTO-SALES.

---

## 📋 Prerrequisitos

1. **Proyecto Firebase creado** con Cloud Functions habilitadas
2. **Firebase CLI instalado**: `npm install -g firebase-tools`
3. **Cuenta de desarrollador de Meta** (developers.facebook.com)
4. **Página de Facebook** o **Cuenta de Instagram Business** (opcional)

---

## 🚀 Paso 1: Desplegar Cloud Functions

### 1.1 Iniciar sesión en Firebase

```bash
firebase login
```

### 1.2 Inicializar Firebase en el proyecto

```bash
firebase init
```

Selecciona:
- ✅ Firestore
- ✅ Functions
- ✅ Storage

### 1.3 Configurar variables de entorno

```bash
firebase functions:config:set fb.verify_token="TU_TOKEN_SECRETO_123"
```

### 1.4 Desplegar las funciones

```bash
firebase deploy --only functions
```

Después del despliegue, verás URLs como:

```
✔ Functions deployed successfully!

Function URL (procesarMensaje): https://us-central1-TU-PROYECTO.cloudfunctions.net/procesarMensaje
Function URL (webhookFacebook): https://us-central1-TU-PROYECTO.cloudfunctions.net/webhookFacebook
Function URL (getEstadisticasIA): https://us-central1-TU-PROYECTO.cloudfunctions.net/getEstadisticasIA
```

**Guarda estas URLs**, las necesitarás para configurar los webhooks.

---

## 📘 Paso 2: Configurar Facebook Messenger

### 2.1 Crear App en Meta

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Click en **"Mis apps"** → **"Crear app"**
3. Selecciona **"Negocios"** como tipo de app
4. Nombre: `Nexus Auto-Sales Bot`

### 2.2 Agregar Messenger

1. En el dashboard de tu app, click en **"Agregar productos"**
2. Busca **"Messenger"** y click en **"Configurar"**

### 2.3 Conectar tu Página

1. En la sección **"Tokens de acceso"**, click en **"Agregar o quitar páginas"**
2. Selecciona tu página de Facebook
3. Genera el **Token de acceso de la página**
4. **Guarda este token** (lo necesitarás más adelante)

### 2.4 Configurar Webhook

1. Baja a la sección **"Webhooks"**
2. Click en **"Agregar URL de devolución de llamada"**
3. Ingresa:
   - **URL de devolución**: `https://us-central1-TU-PROYECTO.cloudfunctions.net/webhookFacebook`
   - **Token de verificación**: `TU_TOKEN_SECRETO_123` (el mismo que configuraste en Firebase)
4. Click en **"Verificar y guardar"**

### 2.5 Suscribirse a eventos

1. Click en **"Agregar suscripciones"** junto a tu página
2. Selecciona:
   - ✅ `messages`
   - ✅ `messaging_postbacks`
3. Click en **"Guardar"**

### 2.6 Permisos de la App

1. Ve a **"Configuración de la app"** → **"Permisos"**
2. Solicita:
   - `pages_messaging`
   - `pages_read_engagement`

---

## 📸 Paso 3: Configurar Instagram (Opcional)

### 3.1 Vincular cuenta de Instagram

1. En tu app de Meta, ve a **"Messenger"** → **"Configuración de Instagram"**
2. Conecta tu **cuenta de Instagram Business**
3. Acepta los permisos

### 3.2 El webhook es el mismo

Instagram usa el mismo webhook que Facebook Messenger. Los mensajes llegarán con `plataforma: 'instagram'`.

---

## 💬 Paso 4: Configurar WhatsApp (Método alternativo)

WhatsApp Business API requiere verificación empresarial. Para empezar rápido, usa **n8n** o **Make.com**.

### Opción A: WhatsApp Cloud API (Oficial)

1. En tu app de Meta, agrega el producto **"WhatsApp"**
2. Configura un **número de prueba** de WhatsApp
3. El webhook es similar al de Facebook

### Opción B: Usando n8n (Recomendado para empezar)

1. Crea una cuenta en [n8n.io](https://n8n.io)
2. Crea un flujo:

```
Trigger: WhatsApp (vía Twilio o WhatsApp Business API)
    ↓
HTTP Request: POST a tu Cloud Function
    ↓
Responder al cliente
```

#### Ejemplo de payload para n8n:

```json
{
  "cliente_id": "whatsapp_{{$json.from}}",
  "cliente_nombre": "{{$json.profile.name}}",
  "cliente_telefono": "{{$json.from}}",
  "plataforma": "whatsapp",
  "mensaje": "{{$json.body}}"
}
```

---

## 🧪 Paso 5: Probar la Integración

### 5.1 Test manual con cURL

```bash
curl -X POST https://us-central1-TU-PROYECTO.cloudfunctions.net/procesarMensaje \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": "test_123",
    "cliente_nombre": "Juan Test",
    "cliente_telefono": "+57 300 000 0000",
    "plataforma": "web",
    "producto_id": "PRODUCTO_ID_AQUI",
    "mensaje": "Hola, me interesa el producto"
  }'
```

### 5.2 Verificar respuesta

Deberías recibir algo como:

```json
{
  "success": true,
  "conversacion_id": "abc123xyz",
  "respuesta": "¡Hola Juan! Me alegra que estés interesado...",
  "estado": "negociando"
}
```

### 5.3 Verificar en Firestore

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Abre **Firestore Database**
3. Verifica que se crearon documentos en:
   - `conversaciones/`
   - `webhooks_log/`

---

## 🔧 Paso 6: Configurar OpenAI

### 6.1 Obtener API Key

1. Ve a [platform.openai.com](https://platform.openai.com)
2. Click en **"API Keys"** → **"Create new secret key"**
3. Copia la key (empieza con `sk-...`)

### 6.2 Agregar a Firestore

1. En Firestore, crea el documento:
   - Colección: `configuracion_ia`
   - Documento ID: `default`
2. Campos:
   ```json
   {
     "nombre_tienda": "Tu Tienda",
     "tono_vendedor": "profesional",
     "openai_api_key": "sk-tu-api-key-aqui"
   }
   ```

**O** usa la página `/configuracion-ia` en tu dashboard.

---

## 📊 Paso 7: Monitorear

### Ver logs en tiempo real

```bash
firebase functions:log
```

### Ver estadísticas

```bash
curl https://us-central1-TU-PROYECTO.cloudfunctions.net/getEstadisticasIA
```

---

## ⚠️ Troubleshooting

### Error: "OpenAI API Key no configurada"
- Asegúrate de haber agregado la key en Firestore en `configuracion_ia/default`

### Error: "Forbidden" en webhook de Facebook
- Verifica que el token de verificación coincida
- Revisa que la URL esté correcta

### No llegan mensajes
- Verifica que la app de Meta esté en modo **"Live"**
- Revisa los logs: `firebase functions:log`

### El bot no responde en Facebook
- Necesitas implementar la respuesta de vuelta a Messenger usando la API de envío de Meta

---

## 🔄 Flujo Completo

```
1. Cliente envía mensaje en FB/IG/WA
       ↓
2. Meta envía webhook a Cloud Function
       ↓
3. Cloud Function guarda en Firestore
       ↓
4. GPT-4o genera respuesta de venta
       ↓
5. Respuesta guardada en conversación
       ↓
6. (Opcional) Enviar respuesta de vuelta al cliente
       ↓
7. Cliente confirma pago
       ↓
8. Se crea pedido de despacho
       ↓
9. Admin recibe notificación y despacha
```

---

## 📞 Soporte

Si tienes problemas, revisa:
- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Meta Webhooks Docs](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [OpenAI API Docs](https://platform.openai.com/docs)

---

¡Listo! Tu sistema de ventas autónomas está configurado. 🚀
