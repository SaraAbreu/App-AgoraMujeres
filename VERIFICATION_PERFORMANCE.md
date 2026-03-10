# ✅ Verificación de Optimizaciones - GUÍA PASO-A-PASO

**Fecha:** 8 de marzo de 2026  
**Objetivo:** Validar que las optimizaciones funcionan correctamente

---

## 🎯 Verificación en 3 Pasos

### **PASO 1: Preparar el Ambiente** (5 minutos)

```powershell
# Desde PowerShell, en c:\workspace\App-AgoraMujeres\frontend

# 1. Limpiar dependencias antiguas
Remove-Item -Recurse -Force node_modules 2>$null
Remove-Item package-lock.json 2>$null
Remove-Item .metro-cache -Recurse -Force 2>$null

# 2. Instalar nuevas dependencias (sin react-navigation)
npm install

# ✅ Espera a que complete (5-8 minutos)
```

**✅ Será exitoso si:**
- No hay errores de instalación
- `node_modules` contiene ~650 paquetes (antes eran ~680)
- Se ve: `added XXX packages`

---

### **PASO 2: Medir Bundle Size** (10 minutos)

```powershell
# 1. Construir para web y analizar
npm run analyze

# 2. Se abrirá un navegador automáticamente con la visualización
# 3. Busca en la lista:
#    - react-native
#    - @expo módulos
#    - zustand
#    - i18next
#    - Las rutas del app
```

**Qué mirar:**
- ✅ `@react-navigation` NO debe aparecer (removido)
- ✅ El bundle debe ser ~3.0-3.1 MB (era 3.39 MB)
- ✅ Las rutas modales ({diary, subscription, crisis}) deben estar separadas

---

### **PASO 3: Medir Startup Time** (15 minutos)

```powershell
# 1. Medir tiempo de primer start con caché
Write-Host "=== TEST 1: Con caché (normal) ===" -ForegroundColor Green
$timer = Measure-Command { npm start }
Write-Host "Tiempo: $($timer.TotalSeconds) segundos" -ForegroundColor Yellow

# 2. Medir tiempo sin caché (peor caso)
Write-Host "`n=== TEST 2: Sin caché (fresh start) ===" -ForegroundColor Green
npm run start:cleared   # Esto borra .metro-cache y limpia
$timer = Measure-Command { npm start }
Write-Host "Tiempo: $($timer.TotalSeconds) segundos" -ForegroundColor Yellow

# 3. Espera a que diga "Application started on X"
# Es el tiempo que mide
```

**Resultados esperados:**
| Métrica | Antes | Ahora | Mejora |
|---------|-------|-------|--------|
| Con caché | 60-90 seg | 45-65 seg | 🟢 20-30% |
| Sin caché | 90-120 seg | 60-85 seg | 🟢 25-35% |

---

### **PASO 4: Profiling Detallado (web)** (20 minutos)

```powershell
# 1. Iniciar en modo web
npm run web

# 2. Una vez que cargue (en http://localhost:8081):
#    - Abre DevTools: F12
#    - Ve a Performance tab
#    - Click "Record"
#    - Espera 3-5 segundos interactuando
#    - Click "Stop"

# 3. Busca en la timeline:
#    - "Metro" timings
#    - "Bundle" timings
#    - "Parse script" (javascript parsing)
```

**Métricas clave:**
- Time to Interactive (TTI): < 7 segundos
- First Contentful Paint (FCP): < 3 segundos
- Largest Contentful Paint (LCP): < 5 segundos

---

## 📊 Hoja de Validación

Completa esto después de las pruebas:

```
Optimización de Rendimiento - Validación Final

Date: _______________
Tested by: _______________

✅ PASO 1: Dependencias Instaladas
   - npm install completed sin errores: [ ]
   - Se removió react-navigation: [ ]
   - Bundle size: _____ MB (esperado: ~3.0-3.1 MB)

✅ PASO 2: Bundle Analysis
   - source-map-explorer abierto: [ ]
   - @react-navigation NO aparece: [ ]
   - Rutas modales están splitadas: [ ]

✅ PASO 3: Startup Time
   - Con caché: _____ seg (esperado: 45-65 seg)
   - Sin caché: _____ seg (esperado: 60-85 seg)
   - Mejora estimada: _____ % (esperado: 20-35%)

✅ PASO 4: DevTools Profiling
   - TTI: _____ seg (esperado: <7 seg)
   - FCP: _____ seg (esperado: <3 seg)
   - LCP: _____ seg (esperado: <5 seg)

✅ NOTIFICACIONES
   - Console sin errores: [ ]
   - No hay warning de dependencias faltantes: [ ]
   - App carga correctamente en web: [ ]

Resultado Final: [EXITOSO / CON PROBLEMAS]
Notas: 
_________________________________________________
_________________________________________________
```

---

## 🚀 Cómo Usar las Herramientas Nuevas

### **Analizar Bundle Visualmente**
```bash
# En la carpeta frontend:
npm run analyze

# Se abrirá automáticamente mostrando gráficamente
# qué ocupa espacio en el bundle
```

### **Generar Reporte de Assets**
```bash
npm run bundle-report

# Crea un archivo dump-assetmap.json con todos los assets
```

### **Limpiar Caché Completamente**
```bash
npm run start:cleared

# Borra .metro-cache y reinicia todo desde cero
# Útil si parece que el caché está corrupto
```

---

## ⚠️ Posibles Problemas y Soluciones

### **Problema: "Module not found" después de instalar**
```powershell
# Solución:
rm -r node_modules
npm install --legacy-peer-deps
npm start
```

### **Problema: "Metro cache corrupted"**
```powershell
# Solución:
npm run start:cleared
```

### **Problema: console.logs no aparecen**
Metro está configurado para remover `console.log()` en modo minificación. Si necesitas debuguear:
```js
// En metro.config.js, comenta esta línea:
// drop_console: true,
// Luego:
npm run start:cleared
```

### **Problema: Source maps no funcionan**
```bash
npm run analyze  # Regenera source maps
```

---

## 📝 Notas Finales

✅ **Todas las optimizaciones son:**
- Non-breaking (no cambian funcionalidad)
- Automáticas (no requieren cambios manuales)
- Reversibles (si necesitas deshacer, solo revert en git)

✅ **Próximas optimizaciones posibles:**
- Comprimir imágenes con WEBP
- Usar font subsets
- Lazy loading de componentes dentro de screens
- Code-splitting avanzado en (tabs)

---

## 🎓 Referencia Rápida

| Comando | Qué hace |
|---------|----------|
| `npm install` | Instala dependencias (¡sin react-navigation!) |
| `npm start` | Inicia dev server normal |
| `npm run start:cleared` | Borra caché y reinicia |
| `npm run analyze` | Ve qué ocupa espacio (visual) |
| `npm run bundle-report` | Genera JSON con detalles |
| `npm run web` | Inicia en navegador (para profiling) |
| `npm lint` | Chequea el código |

---

**¡Listo para medir!** 🎉

Ejecuta estos pasos y reporta los números en la hoja de validación.
