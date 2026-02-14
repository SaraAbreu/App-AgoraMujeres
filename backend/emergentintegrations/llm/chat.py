import os
import logging
from typing import Optional, List
import importlib

logger = logging.getLogger(__name__)

# Importa AsyncOpenAI y excepciones solo si openai está instalado
try:
    from openai import AsyncOpenAI
    from openai import AuthenticationError, RateLimitError, APIConnectionError, APIError
except ImportError:
    AsyncOpenAI = None
    AuthenticationError = None
    RateLimitError = None
    APIConnectionError = None
    APIError = None

# Importa la función chat_llama si está disponible
try:
    from backend.server_simple import chat_llama
except ImportError:
    chat_llama = None
class UserMessage:
    def __init__(self, text: str = None, role: str = "user", content: str = None):
        self.role = role
        # Support both 'text' and 'content' parameters for compatibility
        self.content = text or content
        self.text = text or content

class LlmChat:
    def __init__(self, api_key: str = None, session_id: str = None, system_message: str = None, engine: str = None):
        """
        Inicializa el chat LLM, compatible con OpenAI y Llama-cpp.
        Args:
            api_key: clave de OpenAI (usa local si no hay)
            session_id: id de sesión
            system_message: prompt de sistema
            engine: 'openai' o 'llama' (auto si None)
        """
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        self.session_id = session_id
        self.system_message = system_message or "You are a helpful assistant."
        self.model = "gpt-4o-mini"  # Default model
        self.messages: List[dict] = []
        
        # Determina el motor disponible
        if engine:
            self.engine = engine
        else:
            # Auto-detect: OpenAI si hay API_KEY e instalado, else Llama
            if self.api_key and AsyncOpenAI is not None:
                self.engine = "openai"
            elif chat_llama is not None:
                self.engine = "llama"
            else:
                raise RuntimeError("No hay motor LLM disponible: instala openai o llama-cpp")
        
        # Inicializa el cliente según el motor
        if self.engine == "openai":
            if AsyncOpenAI is None:
                raise RuntimeError("AsyncOpenAI no está instalado. Instala: pip install openai")
            if not self.api_key:
                raise RuntimeError("OPENAI_API_KEY no está configurada")
            self.client = AsyncOpenAI(api_key=self.api_key)
        elif self.engine == "llama":
            if chat_llama is None:
                raise RuntimeError("chat_llama no está disponible. Verifica server_simple.py")
            self.client = None
        else:
            raise ValueError(f"Motor LLM no conocido: {self.engine}")

        # Añade el mensaje de sistema si existe
        if self.system_message:
            self.messages.append({
                "role": "system",
                "content": self.system_message
            })
    
    def with_model(self, provider: str, model: str):
        """Configura el modelo y motor a usar."""
        self.engine = provider
        self.model = model
        
        # Reconfigura el cliente si es necesario
        if provider == "openai":
            if AsyncOpenAI is None:
                raise RuntimeError("AsyncOpenAI no está instalado. Instala: pip install openai")
            if not self.api_key:
                raise RuntimeError("OPENAI_API_KEY no está configurada")
            self.client = AsyncOpenAI(api_key=self.api_key)
        elif provider == "llama":
            if chat_llama is None:
                raise RuntimeError("chat_llama no está disponible. Verifica server_simple.py")
            self.client = None
        else:
            raise ValueError(f"Motor no conocido: {provider}")
        
        return self
    
    async def send_message(self, message: UserMessage) -> str:
        """Envía un mensaje y obtiene respuesta del motor configurado."""
        self.messages.append({
            "role": "user",
            "content": message.content
        })

        if self.engine == "openai" and self.client:
            try:
                logger.info(f"Sending message to OpenAI model: {self.model}")
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=self.messages,
                    temperature=0.7,
                    max_tokens=1000
                )
                assistant_message = response.choices[0].message.content
                self.messages.append({
                    "role": "assistant",
                    "content": assistant_message
                })
                logger.info("Successfully received OpenAI response")
                return assistant_message
            except AuthenticationError as e:
                error_message = f"OpenAI API Key inválida o expirada. Verifica tu OPENAI_API_KEY en .env. Error: {str(e)}"
                logger.error(error_message)
                raise RuntimeError(error_message) from e
            except RateLimitError as e:
                error_message = f"Límite de cuota de OpenAI alcanzado. Verifica tu plan o espera un momento. Error: {str(e)}"
                logger.error(error_message)
                raise RuntimeError(error_message) from e
            except APIConnectionError as e:
                error_message = f"No se puede conectar a la API de OpenAI. Verifica tu conexión a internet. Error: {str(e)}"
                logger.error(error_message)
                raise RuntimeError(error_message) from e
            except APIError as e:
                error_message = f"Error de la API de OpenAI: {str(e)}"
                logger.error(error_message)
                raise RuntimeError(error_message) from e
            except Exception as e:
                error_message = f"Error inesperado llamando a OpenAI: {type(e).__name__}: {str(e)}"
                logger.error(error_message)
                raise RuntimeError(error_message) from e
        elif self.engine == "llama" and chat_llama:
            # Usa solo el último mensaje de usuario y el system prompt
            prompt = f"Sistema: {self.system_message}\nUsuario: {message.content}\nÁgora:"
            try:
                response = chat_llama(prompt)
                self.messages.append({
                    "role": "assistant",
                    "content": response
                })
                return response
            except Exception as e:
                error_message = f"Error llamando a Llama-cpp: {str(e)}"
                print(error_message)
                raise
        else:
            raise RuntimeError("No hay motor LLM disponible (ni OpenAI ni Llama-cpp)")
    
    async def call(self, message: UserMessage = None, *args, **kwargs) -> str:
        """
        Alternative method to send message (for compatibility).
        Alias for send_message.
        """
        if message is None:
            raise ValueError("Message is required")
        return await self.send_message(message)
