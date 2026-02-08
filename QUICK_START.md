# 🚀 EJECUTAR APP EN PC - GUÍA RÁPIDA

## ✅ Backend YA ESTÁ EJECUTÁNDOSE 
- 🔗 URL: http://localhost:8000/api
- 📊 Swagger Docs: http://localhost:8000/docs
- 🔌 Puerto: 8000

---

## 📦 Requisitos para el Frontend

### Windows:
1. **Descargar e instalar Node.js** (incluye npm)
   - Ve a: https://nodejs.org/
   - Descarga la versión **LTS (Latest Stable)**
   - Instala normalmente
   - Reinicia tu terminal PowerShell

2. **Verificar instalación:**
   ```powershell
   node --version
   npm --version
   ```

---

## 🎮 Ejecutar el Frontend

Copia estos comandos en PowerShell:

```powershell
# 1. Ve a la carpeta del frontend
cd c:\workspace\App-AgoraMujeres\frontend

# 2. Instala dependencias (primera vez, toman ~5 min)
npm install

# 3. Lanza el app
npm start
```

### Luego en el terminal donde te pida elegir:
- Escribe: **w** para web 🌐
- O: **a** para Android (si tienes Expo Go)
- O: **i** para iOS (si tienes Mac)

---

## 🌐 Abrir en el Navegador

Una vez ejecutado `npm start`:
1. Se abrirá automáticamente en **http://localhost:19006**
2. Si no, copia esa URL en tu navegador
3. ¡Listo! Verás la app en tu PC 📱

---

## 🔗 Verificar Conexión Backend

Abre en tu navegador:
```
http://localhost:8000/api/
```

Deberías ver:
```json
{
  "message": "Ágora Mujeres API",
  "version": "1.0.0"
}
```

---

## ⚠️ Problemas Comunes

| Problema | Solución |
|----------|----------|
| `npm: command not found` | Instala Node.js (requiere reiniciar terminal) |
| Backend no responde | Verifica que terminal backend sigue corriendo |
| Puerto 8000 ocupado | Cambia `--port 9000` en el comando del backend |
| "Cannot find module" | Corre `npm install` de nuevo |

---

## 📱 URL Por Defecto

El frontend está configurado para conectar a:
```
http://localhost:8000/api
```

Si cambias el puerto del backend, actualiza en:
```
frontend/.env.local
```

Agrega:
```
EXPO_PUBLIC_API_URL=http://localhost:NUEVO_PUERTO/api
```

---

**¿Necesitas ayuda? Pregunta en el chat.**
