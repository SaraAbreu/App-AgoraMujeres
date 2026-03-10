#!/usr/bin/env python3
"""
Script para probar el chat con OpenAI
"""

import asyncio
import httpx
import json


async def test_chat():
    """Prueba múltiples mensajes con el endpoint de chat"""
    
    messages = [
        "Me siento triste hoy",
        "Tengo problemas para dormir",
        "¿Qué puedo hacer para mejorar?"
    ]
    
    async with httpx.AsyncClient() as client:
        for msg in messages:
            data = {
                "device_id": "test-device",
                "message": msg,
                "language": "es"
            }
            
            try:
                print(f"\n📝 Mensaje: {msg}")
                print("-" * 60)
                
                resp = await client.post(
                    "http://localhost:8000/api/chat",
                    json=data,
                    timeout=30
                )
                
                if resp.status_code == 200:
                    result = resp.json()
                    print(f"🤖 Ágora: {result['response']}")
                    print(f"✅ OpenAI activo: {not result['is_offline_mode']}")
                    print(f"📍 Conversación: {result['conversation_id']}")
                else:
                    print(f"❌ Error: {resp.status_code}")
                    
            except Exception as e:
                print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(test_chat())
