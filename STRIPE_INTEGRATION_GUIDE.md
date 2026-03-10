# 💳 GUÍA DE INTEGRACIÓN: STRIPE + ÁGORA MUJERES

## 🔐 Estado Actual

✅ **Backend:** Stripe completamente integrado  
✅ **API Key:** Configurada y validada  
✅ **Endpoints:** 3 endpoints de pago listos  
⏳ **Frontend:** Listo para integración

---

## 📱 Configuración del Frontend

### 1. **Stripe Key Pública en Frontend**

En `frontend/app.json` o variable de entorno, necesitas la clave PÚBLICA de Stripe:

```json
{
  "extra": {
    "STRIPE_PUBLIC_KEY": "pk_live_51SRw7PL07UaiQy6M...",  // Tu clave pública
    "STRIPE_ACCOUNT_ID": "acct_1SRw7PL07UaiQy6M"
  }
}
```

**¿Dónde obtener la clave pública?**
- Ve a: https://dashboard.stripe.com/apikeys
- Busca "Publishable Key"
- Cópiala (empieza con `pk_live_` o `pk_test_`)

### 2. **Instalación de Dependencias de Stripe**

```bash
cd frontend
npm install @stripe/react-stripe-js stripe
```

### 3. **Flow de Pago en Frontend**

```
Usuario abre app
    ↓
(Si trial expirado) Muestra botón "Activar Suscripción"
    ↓
Usuario clica el botón
    ↓
Se crea Customer en Stripe (backend)
    ↓
Se crea Payment Intent (backend)
    ↓
Stripe Checkout o Elements UI (frontend)
    ↓
Usuario entra tarjeta de crédito
    ↓
Pago procesado ✅
    ↓
Backend activa suscripción
    ↓
Usuario puede seguir usando
```

---

## 🛠️ Endpoints Backend Disponibles

### 1️⃣ Crear Cliente (Necesario primero)

```bash
POST /api/subscription/create-customer
Content-Type: application/json

{
  "device_id": "user-12345",
  "email": "usuario@ejemplo.com",
  "name": "María García"
}

Response:
{
  "customer_id": "cus_xxxxxxxxxx"
}
```

**Usar en Frontend:**
```typescript
const createCustomer = async (deviceId: string, email: string, name: string) => {
  const response = await fetch('http://localhost:8000/api/subscription/create-customer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, email, name })
  });
  return await response.json();
};
```

### 2️⃣ Crear Payment Intent

```bash
POST /api/subscription/create-payment-intent

Body:
{
  "device_id": "user-12345"
}

Response:
{
  "client_secret": "pi_xxxxxxxxxx_secret_yyyyy",
  "payment_intent_id": "pi_xxxxxxxxxx"
}
```

**Usar en Frontend:**
```typescript
const createPaymentIntent = async (deviceId: string) => {
  const response = await fetch(`http://localhost:8000/api/subscription/create-payment-intent?device_id=${deviceId}`, {
    method: 'POST'
  });
  return await response.json();
};
```

### 3️⃣ Activar Suscripción (Después del pago)

```bash
POST /api/subscription/activate

Query Params:
- device_id: "user-12345"
- payment_intent_id: "pi_xxxxxxxxxx"

Response:
{
  "status": "active",
  "message": "Subscription activated successfully"
}
```

**Usar en Frontend:**
```typescript
const activateSubscription = async (deviceId: string, paymentIntentId: string) => {
  const response = await fetch(
    `http://localhost:8000/api/subscription/activate?device_id=${deviceId}&payment_intent_id=${paymentIntentId}`,
    { method: 'POST' }
  );
  return await response.json();
};
```

---

## 💰 Precios Configurados

| Plan | Precio | Duración |
|------|--------|----------|
| **Trial** | Gratis | 2 horas |
| **Monthly** | €10 | 1 mes |
| **Yearly** | €100 | 1 año |

*Los precios están hardcodeados en el backend. Para cambiarlos:*

Edita `backend/server.py` línea ~1580:
```python
amount=1000,  # 10 EUR in cents
currency="eur",
```

---

## 🔄 Flujo Técnico Completo (Live)

### Paso 1: App Abierta
```
Frontend obtiene device_id (guardado localmente)
GET /api/subscription/{device_id}
Response: 
{
  "status": "trial",
  "trial_remaining_seconds": 7200  // 2 horas
}
```

### Paso 2: Trial Expirado
```
Si trial_remaining_seconds <= 0:
  Muestra: "Tu período de prueba terminó"
  Muestra botón: "Activar Suscripción" → $10
```

### Paso 3: Usuario Clica "Activar"
```
POST /api/subscription/create-customer
  device_id, email, name

Response: customer_id

POST /api/subscription/create-payment-intent
  device_id

Response: client_secret, payment_intent_id

// Abre Stripe Checkout o Elements
Stripe.confirmCardPayment(client_secret)
```

### Paso 4: Pago Confirmado
```
POST /api/subscription/activate
  device_id, payment_intent_id

Backend:
  - Verifica que payment_intent.status == "succeeded"
  - Actualiza: subscriptions.status = "active"
  - Guarda: payment_intent_id, activated_at

Response: "Subscription activated successfully"
```

### Paso 5: Usuario Autenticado
```
GET /api/subscription/{device_id}
Response:
{
  "status": "active",
  "is_admin": false
}

// Acceso total a chat ilimitado ✅
```

---

## 🚨 Modo Test vs Live

### Development (con claves de prueba)
```
STRIPE_SECRET_KEY=sk_test_xxxxx...
STRIPE_PUBLIC_KEY=pk_test_xxxxx...

Tarjeta para test: 4242 4242 4242 4242
Mes/Año: Cualquiera (ej: 12/25)
CVC: Cualquiera (ej: 123)
```

### Production (con claves reales)
```
STRIPE_SECRET_KEY=sk_live_xxxxx...
STRIPE_PUBLIC_KEY=pk_live_xxxxx...

✅ Tu configuración actual está en sk_live_ (PRODUCCIÓN)
```

---

## 🔒 Seguridad - IMPORTANTE

### ⚠️ Tus claves están en el repositorio

**Riego Crítico:**
- El `STRIPE_SECRET_KEY` está visible en git
- **Cualquiera con acceso al repo puede:**
  - Crear refunds
  - Ver transacciones
  - Cambiar configuración

### ✅ Solución Inmediata

1. **REVOCA la clave actual en Stripe:**
   - Dashboard → API Keys → Más opciones → Eliminar

2. **Crea una clave NUEVA:**
   - Dashboard → API Keys → "Create restricted API key"
   - Permisos: Solo lectura de customers y payment intents

3. **Reemplaza en `.env`:**
   ```env
   STRIPE_SECRET_KEY=sk_live_nueva_clave_aqui...
   ```

4. **Asegúrate de que `.env` está en `.gitignore`:**
   ```bash
   echo "backend/.env" >> .gitignore
   ```

5. **Saca la clave del historial de git:**
   ```bash
   # En bash/zsh (en Windows usa Git Bash):
   git filter-branch --tree-filter 'git rm --cached backend/.env' --prune-empty HEAD
   git push origin --force
   ```

---

## 🧪 Testing de Pago

### Test 1: Crear Cliente
```bash
curl -X POST http://localhost:8000/api/subscription/create-customer \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-123",
    "email": "test@ejemplo.com",
    "name": "Test User"
  }'
```

### Test 2: Crear Payment Intent
```bash
curl -X POST "http://localhost:8000/api/subscription/create-payment-intent?device_id=test-device-123"
```

### Test 3: Activar Suscripción
```bash
curl -X POST "http://localhost:8000/api/subscription/activate?device_id=test-device-123&payment_intent_id=pi_3xxxxxxx"
```

---

## 📊 Monitoreo

**Ver transacciones en Stripe Dashboard:**
- https://dashboard.stripe.com/payments

**Ver clientes:**
- https://dashboard.stripe.com/customers

**Webhook para confirmación (opcional):**
- Puedes recibir eventos cuando se complete un pago
- Configurar en: Dashboard → Webhooks

---

## 🎯 Próximos Pasos

✅ **Done:**
- Backend configuration: 100%
- API Endpoints: 100%
- Stripe integration: 100%

⏳ **To Do:**
1. Obtener clave pública de Stripe
2. Agregar a `frontend/app.json`
3. Instalar `@stripe/react-stripe-js`
4. Crear componente de PaywallModal
5. Implementar flujo de pago en frontend
6. Testing con tarjeta de prueba (4242...)
7. Deploy con claves vivas

---

## ❓ Preguntas Comunes

**P: ¿Cómo cambio el precio de €10 a otro?**
R: Edita `backend/server.py` línea ~1580, cambia `amount=1000` por el precio en centavos

**P: ¿Cómo hago que los usuarios paguen solo una vez?**
R: Cambia "trial" a "one-time-purchase" en el endpoint `/activate`

**P: ¿Puedo usar Stripe sin verificar mi cuenta real?**
R: Solo con claves de test (pk_test_, sk_test_). Para live necesitas cuenta verificada

**P: ¿Qué pasa si pago falla?**
R: El payment_intent se queda en "requires_payment_method", app sigue en trial

---

## 📞 Soporte

Si hay dudas:
1. Ver logs: `LOG_LEVEL=DEBUG` en `.env`
2. Revisar errores: `/api/subscription/{device_id}` debe retornar status
3. Stripe dashboard: https://dashboard.stripe.com/events

¡**Tu Ágora está lista para monetizar! 💚**
