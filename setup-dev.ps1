#!/usr/bin/env pwsh
# Script para lanzar la app completa en desarrollo

Write-Host "🚀 Iniciando Ágora Mujeres en desarrollo...`n" -ForegroundColor Cyan

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "   ✅ Node.js $nodeVersion encontrado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js NO ENCONTRADO" -ForegroundColor Red
    Write-Host "   Descárgalo desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar Python
Write-Host "`n🐍 Verificando Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>$null
if ($pythonVersion) {
    Write-Host "   ✅ $pythonVersion encontrado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Python no encontrado en PATH" -ForegroundColor Yellow
}

# Instalar dependencias frontend
Write-Host "`n📥 Instalando dependencias frontend..." -ForegroundColor Yellow
Push-Location frontend
npm install --legacy-peer-deps 2>&1 | Select-Object -Last 5
Pop-Location
Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green

# Resumen
Write-Host "`n✨ CONFIGURACIÓN LISTA" -ForegroundColor Cyan
Write-Host "`n🔧 Para iniciar:"
Write-Host "   1. Frontend: cd frontend && npm start" -ForegroundColor White
Write-Host "   2. Backend:  YA ESTÁ CORRIENDO en puerto 8000" -ForegroundColor White
Write-Host "`n📱 URLs:"
Write-Host "   Frontend (Web): http://localhost:19006" -ForegroundColor Cyan
Write-Host "   Backend API:    http://localhost:8000/api" -ForegroundColor Cyan
Write-Host "   API Docs:       http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`n"
