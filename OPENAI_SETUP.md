# 🔧 Configuración de OpenAI - Ágora Mujeres

## Requisitos
- Una cuenta en OpenAI (https://platform.openai.com)
- API key de OpenAI generada
- Python 3.8+ instalado en el backend

## Pasos de Setup

### 1️⃣ Obtener API Key de OpenAI

1. Ve a: https://platform.openai.com/account/api-keys
2. Inicia sesión con tu cuenta de OpenAI
3. Haz clic en "Create new secret key"
4. Copia la clave (aparecerá una sola vez)
5. **Importante:** Guarda esta clave de forma SEGURA - no la subas a GitHub

### 2️⃣ Configurar Backend

**Opción A: Variable de Entorno (Recomendado para desarrollo)**

```bash
# En Windows PowerShell (temporal - solo para esta sesión):
$env:OPENAI_API_KEY = "sk-tu-clave-aqui"

# Para persistente en Windows, crear/editar backend/.env:
OPENAI_API_KEY=sk-tu-clave-aqui
```

**Opción B: Archivo .env (local)**

1. Abre `backend/.env`
2. Reemplaza `sk-your-openai-api-key-here` con tu clave real:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
MONGO_URL=mongodb://localhost:27017
DB_NAME=agora_mujeres
```

3. Guarda el archivo
4. **¡NO** subas este archivo a Git (ya está en .gitignore)

### 3️⃣ Verificar Instalación

```bash
# En backend/
python -c "from openai import AsyncOpenAI; print('✅ OpenAI package installed')"
```

## Modelos Disponibles

Actualmente usamos **`gpt-4o-mini`** que es:
- ✅ Rápido y económico
- ✅ Suficientemente poderoso para procesamiento de texto
- ✅ Excelente relación costo-beneficio

**Alternativas si quieres cambiar:**
- `gpt-3.5-turbo` - Más barato, menos potente
- `gpt-4o` - Más potente pero más caro
- `gpt-4-turbo` - Premium

Para cambiar, edita `backend/server.py` L585:
```python
.with_model("openai", "gpt-4o-mini")  # ← Cambia aqui
```

## Costos Estimados

Con **`gpt-4o-mini`**:
- Entrada: $0.15 / 1M tokens
- Salida: $0.60 / 1M tokens

Un mensaje típico de Ágora = ~500 tokens
= ~$0.00035 por mensaje

**Límites recomendados:**
- Desarrollo: Sin límite (testing)
- Producción: Implementar rate limiting

## Troubleshooting

### ❌ Error: "OPENAI_API_KEY not configured"
- ✅ Verifica que la variable esté en `.env`
- ✅ Reinicia el servidor: `Ctrl+C` y vuelve a ejecutar
- ✅ Verifica que el archivo `.env` esté en `backend/` (no en `backend/backend/`)

### ❌ Error: "Invalid API key"
- ✅ Copia la clave nuevamente desde OpenAI (aparece una sola vez)
- ✅ Verifica que no haya espacios extras: `sk-xxxxx` (sin espacios)
- ✅ Asegúrate que la clave comienza con `sk-`

### ❌ Error: "API quota exceeded"
- ✅ Verifica tus créditos en https://platform.openai.com/account/billing/overview
- ✅ Establece un límite de gasto si es necesario

## Próximos Pasos

Una vez configurado, prueba el chat:

1. Inicia el backend:
   ```bash
   cd backend/
   python server.py
   ```

2. Inicia el frontend:
   ```bash
   cd frontend/
   npm start
   # Selecciona 'w' para web
   ```

3. Abre la app en http://localhost:3000
4. Escribe un mensaje en el chat para probar

¡Ágora debería responder con comprensión sobre fibromialgia! 💜

## Documentación Oficial

- OpenAI API: https://platform.openai.com/docs/api-reference
- Pricing: https://openai.com/pricing
- Status: https://status.openai.com
