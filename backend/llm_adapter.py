"""
LLM Adapter - Capa de abstracción propia que encapsula las dependencias de LLM

Este módulo proporciona una interfaz consistente para interactuar con proveedores de LLM.
Inicialmente utiliza emergentintegrations, pero puede reemplazarse fácilmente con otro
proveedor (OpenAI, Anthropic, etc.) sin cambiar el código que lo utiliza.

Esto es código PROPIO que abstrae la complejidad de las dependencias externas.
"""

import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Importamos las clases de emergentintegrations
try:
    from .emergentintegrations.llm.chat import LlmChat, UserMessage as EmergentUserMessage
except ImportError:
    from emergentintegrations.llm.chat import LlmChat, UserMessage as EmergentUserMessage

# Exportamos UserMessage para mantener compatibilidad
UserMessage = EmergentUserMessage


class MyLLMInterface:
    """
    Interfaz propia para interactuar con servicios de LLM.
    
    Esta clase encapsula la lógica de emergentintegrations permitiendo:
    - Abstraer la dependencia de Emergent
    - Facilitar cambios futuros a otros proveedores de LLM
    - Mantener la funcionalidad actual sin cambios
    
    Uso:
        llm = MyLLMInterface(api_key="sk-xxx")
        response = await llm.chat(messages)
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        session_id: Optional[str] = None,
        system_message: Optional[str] = None,
        engine: Optional[str] = None
    ):
        """
        Inicializa la interfaz de LLM.
        
        Args:
            api_key: Clave API (por defecto desde OPENAI_API_KEY)
            session_id: ID de sesión para tracking
            system_message: Mensaje del sistema/prompt
            engine: Motor a usar ('openai' o 'llama')
        """
        self.chat_client = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message,
            engine=engine
        )
    
    @property
    def client(self):
        """Acceso directo al cliente del LLM interno (OpenAI, etc)."""
        return self.chat_client.client
    
    @property
    def messages(self) -> List[Dict[str, str]]:
        """Acceso directo al historial de mensajes del cliente."""
        return self.chat_client.messages
    
    @messages.setter
    def messages(self, value: List[Dict[str, str]]) -> None:
        """Establece el historial de mensajes."""
        self.chat_client.messages = value
    
    def set_model(self, provider: str, model: str) -> 'MyLLMInterface':
        """
        Configura el modelo y proveedor a usar.
        
        Args:
            provider: Proveedor ('openai' o 'llama')
            model: Nombre del modelo
            
        Returns:
            self para encadenamiento de métodos
        """
        self.chat_client.with_model(provider, model)
        return self
    
    async def chat(self, messages: List[Dict[str, str]]) -> str:
        """
        Envía mensajes al LLM y obtiene una respuesta.
        
        Args:
            messages: Lista de mensajes en formato OpenAI
            
        Returns:
            Respuesta del LLM como string
        """
        return await self.chat_client.chat(messages)
    
    async def send_message(self, user_message: UserMessage) -> str:
        """
        Envía un UserMessage al LLM.
        
        Args:
            user_message: Objeto UserMessage con el contenido
            
        Returns:
            Respuesta del LLM como string
        """
        return await self.chat_client.send_message(user_message)
    
    def add_message(self, role: str, content: str) -> None:
        """
        Añade un mensaje al historial de la conversación.
        
        Args:
            role: 'user', 'assistant', o 'system'
            content: Contenido del mensaje
        """
        self.chat_client.messages.append({
            "role": role,
            "content": content
        })
    
    def get_messages(self) -> List[Dict[str, str]]:
        """
        Obtiene el historial de mensajes.
        
        Returns:
            Lista de mensajes de la conversación
        """
        return self.chat_client.messages.copy()
    
    def clear_messages(self) -> None:
        """Limpia el historial de mensajes."""
        self.chat_client.messages = []
