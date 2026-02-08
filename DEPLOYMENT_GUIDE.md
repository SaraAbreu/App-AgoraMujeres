# 🚀 Guía de Deployment - Ágora Mujeres

## Opción 1: Render (RECOMENDADO - Gratuito 💰)

### Paso 1: Preparar MongoDB Atlas (Gratuito)

1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea cuenta gratuita
3. Crea un cluster gratuito (M0)
4. Ve a Database Access y crea usuario (ej: `agora_user` / contraseña fuerte)
5. Ve a Network Access y agrega `0.0.0.0/0` (permite acceso desde cualquier IP)
6. Copia la connection string:
   ```
   mongodb+srv://agora_user:PASSWORD@cluster.mongodb.net/agora_mujeres?retryWrites=true&w=majority
   ```

### Paso 2: Desplegar en Render

1. Ve a https://dashboard.render.com
2. Crea cuenta (conecta con GitHub)
3. Haz push de este repo a GitHub
4. Click en "New" → "Web Service"
5. Conecta tu repositorio
6. Configura:
   - **Name:** `agora-mujeres-api`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn server:app --host 0.0.0.0 --port 8000`
   - **Runtime:** Python 3.11
   - **Plan:** Free

7. Agrega Variables de Entorno (en Dashboard → Environment):
   ```
   MONGO_URL=mongodb+srv://agora_user:PASSWORD@cluster.mongodb.net/agora_mujeres?retryWrites=true&w=majority
   DB_NAME=agora_mujeres
   STRIPE_SECRET_KEY=sk_live_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
   OPENAI_API_KEY=sk_...
   ENVIRONMENT=production
   ```

8. Click "Deploy"
9. Espera 5-10 minutos
10. URL del API: `https://agora-mujeres-api.onrender.com/api/`

### Paso 3: Actualizar Frontend

En `frontend/.env.production`:
```
EXPO_PUBLIC_API_URL=https://agora-mujeres-api.onrender.com/api
```

---

## Opción 2: Railway (Alternativa moderna)

1. Ve a https://railway.app
2. Crea cuenta con GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Configura variables de entorno igual que arriba
5. URL final está en Dashboard

---

## Opción 3: Heroku (Clásico, requiere tarjeta)

```bash
# Instalar Heroku CLI
curl https://cli.heroku.com/install.sh | sh

# Login
heroku login

# Crear app
heroku create agora-mujeres-api

# Agregar variables
heroku config:set MONGO_URL="mongodb+srv://..." -a agora-mujeres-api
heroku config:set STRIPE_SECRET_KEY="sk_..." -a agora-mujeres-api

# Desplegar
git push heroku main
```

---

## 🔍 Verificar Deployment

```bash
# Verificar health check
curl https://agora-mujeres-api.onrender.com/api/

# Probar endpoints
curl -X POST https://agora-mujeres-api.onrender.com/api/diary \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device",
    "texto": "Test entry",
    "emotional_state": {"calma": 3, "fatiga": 2, "niebla_mental": 1, "dolor_difuso": 2, "gratitud": 4, "tension": 2}
  }'
```

---

## Variables de Entorno Necesarias

| Variable | Valor | Dónde obtenerlo |
|----------|-------|-----------------|
| `MONGO_URL` | mongodb+srv://... | MongoDB Atlas |
| `DB_NAME` | agora_mujeres | Personalizado |
| `STRIPE_SECRET_KEY` | sk_live_... | Dashboard Stripe |
| `STRIPE_PUBLISHABLE_KEY` | pk_live_... | Dashboard Stripe |
| `OPENAI_API_KEY` | sk_... | OpenAI Platform |
| `EMERGENT_LLM_KEY` | ... | Emergent Dashboard |

---

## Troubleshooting

### Error: "Connection refused to MongoDB"
- ✅ Verifica MONGO_URL es correcta
- ✅ En MongoDB Atlas, Network Access debe incluir 0.0.0.0/0
- ✅ Usuario de BD tiene permisos de lectura/escritura

### Error: "Uvicorn cannot be found"
- ✅ Asegúrate que requirements.txt está en backend/
- ✅ Build command es correcto

### API responde lentamente desde Render Free
- ⚠️ Render free-tier se apaga después de 15min inactivo
- 💡 Usa pinging service o actualiza a plan pagado

---

## Dashboard URLs

- 🌐 Frontend Expo: `https://agora-mujeres.expo.dev`
- 🔌 API: `https://agora-mujeres-api.onrender.com/api`
- 📊 MongoDB: `https://cloud.mongodb.com`
- 💳 Stripe: `https://dashboard.stripe.com`

---

## Monitoreo

Ver logs en Render:
```
Dashboard → agora-mujeres-api → Logs
```

---

**¿Necesitas más configuración? Pregunta en el chat.**
