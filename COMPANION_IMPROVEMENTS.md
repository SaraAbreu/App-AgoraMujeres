# 🌸 Plan: Aurora - Acompañante para Fibromialgia

## 6 Mejoras Principales

### 1. 🆘 Modo "Crisis" - Soporte Inmediato
**Cuándo:** Cuando el dolor es insoportable (8+/10)
**Qué hace:**
- Botón rojo destacado en Home: "Necesito ayuda AHORA"
- Aurora responde en <2 segundos con técnicas de:
  - Respiración guiada (4-7-8)
  - Grounding corporal
  - Autocompasión
  - Contacto con realidad
- Opción para contactar crisis real (números de emergencia)

**Backend:** 
- Endpoint `/api/crisis` que responde con mensajes preconfigurados
- Sistema de respuesta ultra-rápida sin esperar a OpenAI

**Frontend:**
- Botón de crisis flotante en Chat
- Pantalla de crisis oscura/calmante
- Técnicas guiadas paso a paso

---

### 2. 🔔 Notificaciones de Check-in
**Cuándo:** Cada mañana a hora personalizada
**Qué dice:** "¿Cómo te sientes hoy? 💙"
**Beneficio:** Mantiene rutina, previene aislamiento

**Backend:**
- Endpoint para registrar preferencia de notificación
- Programador de tareas

**Frontend:**
- Configurar hora en Settings
- Notificación push con link directo a Aurora

---

### 3. 💾 Guardar Mensajes de Aurora
**Para:** Releerlos cuando duela
**Qué permite:**
- ❤️ Marcar mensajes como favoritos
- 📝 Colecciones (e.g., "Para crisis", "Ánimos")
- 🔄 Quick access a los favorites

**Backend:**
- Tabla: `favorite_messages` (device_id, message_id, category, created_at)
- Endpoints: GET/POST/DELETE

**Frontend:**
- Ícono de corazón en cada mensaje
- Pantalla "Mis mensajes guardados"

---

### 4. ✨ Afirmaciones Personalizadas Diarias
**Sistema:**
- Rota según estado emocional usuario
- Personalizada a su diagnosis (fibromialgia)
- Aurora la dice al abrir la app

**Ejemplos:**
- "Tu cuerpo no es tu enemigo, es tu maestro"
- "El dolor es real, pero también tu fuerza"
- "Hoy es suficiente tal como es"

**Backend:**
- Banco de 50+ afirmaciones
- Endpoint: `GET /api/affirmation/{device_id}`
- Sistema de rotación smart

**Frontend:**
- Banner diario en Home
- Audio con voz calmante (opcional)

---

### 5. 🌙 Modo Oscuro Mejorado
**Actual:** Colores suaves lavanda/beige
**Mejorado:**
- Fondo casi negro (#0a0a0a)
- Texto blanco suave (#e8e8e8)
- Menos brillo para migrañas
- Tipografía más grande
- Espacios más abiertos

**Beneficio:** Para días de migraña, fotofobia

---

### 6. 📊 Historial Visual - Gráficos de Progreso
**Muestra:**
- Evolución emocional (7 días / 30 días)
- Días buenos vs. días difíciles
- Patrones (ej: "mejoras los lunes")
- Cambios en dolor físico
- Tendencias de fatiga

**Backend:**
- Endpoint: `GET /api/diary/{device_id}/analytics`
- Retorna: tendencias, estadísticas, patrones

**Frontend:**
- Dashboard con gráficos
- Cards con insights ("Has tenido 3 días mejores esta semana ✨")

---

## Implementación Orden

1. ✅ Modo Crisis (impacto máximo, 1-2 horas)
2. ✅ Guardar mensajes (fácil, 1 hora)
3. ✅ Afirmaciones diarias (1-2 horas)
4. ✅ Modo oscuro mejorado (1 hora)
5. ✅ Gráficos/Analytics (3-4 horas)
6. ⏳ Notificaciones (depende de plataforma, 2-3 horas)

---

## Impacto Esperado

| Mejora | Impacto | Para quién |
|--------|--------|-----------|
| Crisis | CRÍTICO | Momentos de 8+/10 dolor |
| Guardar msg | Alto | Recordar qué funciona |
| Afirmaciones | Alto | Autoestima diaria |
| Modo oscuro | Medio | Días de migraña |
| Gráficos | Medio | Motivación a largo plazo |
| Notificaciones | Medio | Rutina y conexión |

---

¿Empezamos?
