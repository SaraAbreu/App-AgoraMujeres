# Ágora Mujeres - Frontend

## Build y optimización

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Ejecuta en modo desarrollo:
   ```bash
   npx expo start
   ```
3. Para producción (bundle optimizado):
   ```bash
   npx expo export --output dist
   ```
   El bundle estará minificado y listo para deploy.

## Seguridad
- SecureStore para todos los datos sensibles
- Multi-idioma integrado (i18next)
- Stripe y backend protegidos por variables de entorno

## Pruebas
Ejecuta:
```bash
python ../backend_test.py
python ../final_api_test.py
```
Verifica resultados en test_result.md
