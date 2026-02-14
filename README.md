# Ágora Mujeres - Backend

## Despliegue seguro

1. Instala dependencias:
	```bash
	pip install -r backend/requirements.txt
	```
2. Configura variables de entorno:
	- `MONGO_URL`: URL de tu base de datos MongoDB
	- `DB_NAME`: Nombre de la base de datos
	- `STRIPE_SECRET_KEY`: Clave secreta de Stripe
	- `OPENAI_API_KEY`: Clave de OpenAI
	- `ALLOWED_ORIGINS`: Dominios permitidos para CORS (por defecto solo https://agoramujeres.com)

3. Ejecuta el servidor:
	```bash
	uvicorn backend.server:app --host 0.0.0.0 --port 8000
	```

## Optimización y seguridad
- CORS restringido a dominios seguros
- Stripe y OpenAI protegidos por variables de entorno
- Datos sensibles nunca expuestos
- Pruebas automatizadas en backend_test.py y final_api_test.py

## Pruebas
Ejecuta:
```bash
python backend_test.py
python final_api_test.py
```
Verifica resultados en test_result.md
