import asyncio
import httpx

async def test():
    try:
        async with httpx.AsyncClient() as client:
            data = {'device_id': 'test', 'message': 'Hola, tengo fibromialgia', 'language': 'es'}
            resp = await client.post('http://localhost:8000/api/chat', json=data, timeout=5)
            print(f'Status: {resp.status_code}')
            result = resp.json()
            print(f'Response received: {len(result.get("response", ""))} chars')
            print(f'\nMensaje Agora:\n{result.get("response", "")}')
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(test())
