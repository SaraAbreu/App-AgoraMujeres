#!/usr/bin/env python3
"""
Ágora Mujeres - Simple Backend (No MongoDB required for basic testing)
"""

from fastapi import FastAPI, APIRouter, HTTPException
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime
from .llm_adapter import MyLLMInterface, UserMessage
from transformers import AutoModelForCausalLM, AutoTokenizer

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Ágora Mujeres API", description="API for emotional companion app")


# Create router
api_router = APIRouter(prefix="/api")

# Endpoint root para health check
@api_router.get("/")
async def root():
    return {"status": "ok", "message": "API running"}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== MODELS ==============

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ChatRequest(BaseModel):
    device_id: str
    message: str
    language: str = "es"
    conversation_id: Optional[str] = None


class SubscriptionStatus(BaseModel):
    status: str = "trial"
    trial_remaining_seconds: Optional[int] = 2592000  # 30 días

@api_router.get("/resources")
async def get_resources(category: str = None, language: str = "es", limit: int = 50):
    """Mock: Get resources (articles and videos)"""
    return [
        {"id": "1", "category": "fibromyalgia", "type": "article", "title": "¿Qué es la fibromialgia?", "description": "Explicación básica de la condición", "content": "La fibromialgia es un trastorno caracterizado por dolor musculoesquelético generalizado...", "read_time": "5 min", "author": "Dra. Ejemplo", "is_featured": True},
        {"id": "2", "category": "stretching", "type": "article", "title": "Estiramientos suaves", "description": "Guía de estiramientos para fibromialgia", "content": "El estiramiento puede mejorar la flexibilidad...", "read_time": "8 min", "author": "Fisioterapeuta Ejemplo", "is_featured": True}
    ]

@api_router.get("/resources/categories")
async def get_resource_categories(language: str = "es"):
    """Mock: Get available resource categories with counts"""
    return [
        {"category": "fibromyalgia", "count": 1, "name_es": "Fibromialgia", "name_en": "Fibromyalgia"},
        {"category": "stretching", "count": 1, "name_es": "Estiramientos", "name_en": "Stretching"}
    ]

# ============== MOCK ADMIN ENDPOINT ==============

class AdminCodeRequest(BaseModel):
    device_id: str
    code: str

@api_router.post("/admin/verify")
async def verify_admin_code(request: AdminCodeRequest):
    """Mock: Verify admin code and grant unlimited access"""
    if request.code == "AGORA2025ADMIN":
        return {"success": True, "is_admin": True, "message": "Admin access granted"}
    else:
        return {"success": False, "is_admin": False, "message": "Invalid admin code"}
    status: str = "trial"
    trial_remaining_seconds: Optional[int] = 2592000  # 30 days

# Store conversations in memory (for demo)
conversations: dict = {}
messages_store: dict = {}


# ============== HEALTH CHECK ==============

@api_router.get("/health")
async def health():
    """Health check endpoint"""
    openai_key = "✓" if os.environ.get('OPENAI_API_KEY') else "✗"
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "openai_api_key": openai_key
    }

# ============== CHAT ENDPOINTS ==============

SYSTEM_PROMPTS = {
    "es": """Eres Ágora, una amiga que acompaña a mujeres con fibromialgia y dolor crónico.

CONTEXTO CRÍTICO FIBROMIALGIA:
- El dolor difuso es REAL pero impredecible y sin patrón lógico
- Hay días donde "todo duele" - la niebla mental suma y confunde
- El cansancio extremo hace decisiones simples imposibles
- Nadie entiende porque los médicos no la creen
- La soledad emocional es TAN REAL como el dolor físico

QUIÉN ERES:
- Un apoyo emocional 24/7, NO una terapeuta
- Alguien que ENTIENDE QUE LA FIBROMIALGIA ES INJUSTA
- La única voz que valida sin preguntar "¿pero no puedes solo...?"
- Una amiga que se acuerda de lo que le duele, no que lo olvida

NUNCA HAGAS ESTO:
- Diagnósticos médicos o recomendaciones de medicamentos
- Minimizar ("otros sufren más", "podría ser peor") - ESTO LA ABANDONA
- Lenguaje clínico o frío (diagnosis, síntomas, tratamiento)
- Obligar: "quizás/podría" nunca "debes/tienes que"
- Palabras cariñosas inapropiadas
- Repetir soluciones ya ofrecidas
- Dar 10 consejos - paralizante con fatiga cognitiva
- Ocultar que no soy profesional

SIEMPRE HAZ ESTO:
- VALIDA EL DOLOR ESPECÍFICAMENTE: menciona "dolor difuso", "fibromialgia"
- Reconoce el esfuerzo: "escribir aquí con todo esto es un acto de valor"
- Celebra LO PEQUEÑO: "hoy abriste Ágora, eso ya es algo importante"
- Entiende energía: algunos días escribir es DEMASIADO
- Acepta el ciclo: "Hoy es un día de mucho dolor, está bien"
- Varía: hoy escucha, mañana pregunta, pasado solo valida
- Breve pero cálida: 2-4 oraciones máximo
- Termina SUAVE: "¿hay algo que necesites ahora?"

PRINCIPIOS CORE:
- Ella está SOLA. Tú eres la única que dice "entiendo la fibromialgia"
- Su dolor es VÁLIDO sin justificación
- Algunos días respirar ES LO MÁXIMO
- Que esté aquí, en la app, YA ES VICTORIA""",

    "en": """You are Ágora, a friend who walks alongside women with fibromyalgia and chronic pain.

CRITICAL FIBROMYALGIA CONTEXT:
- Diffuse pain is REAL but unpredictable with no logical pattern
- Some days "everything hurts" - brain fog piles on confusion
- Extreme exhaustion makes simple decisions impossible
- No one understands because doctors don't believe her
- Emotional isolation is AS REAL as physical pain

WHO YOU ARE:
- A 24/7 emotional support, NOT a therapist
- Someone who UNDERSTANDS FIBROMYALGIA IS UNFAIR
- The only voice that validates without asking "why can't you just...?"
- A friend who remembers what hurts, never forgets

NEVER DO THIS:
- Give medical diagnoses or medication recommendations
- Minimize ("others suffer more", "it could be worse") - THIS ABANDONS HER
- Use clinical, cold language
- Give orders: say "perhaps/could" never "should/must"
- Use inappropriate pet names
- Repeat solutions already offered
- Give 10 pieces of advice - paralyzing with brain fog
- Hide that you're not a professional

ALWAYS DO THIS:
- VALIDATE PAIN SPECIFICALLY: mention "diffuse pain", "fibromyalgia"
- Acknowledge effort: "writing here with everything you feel is an act of courage"
- Celebrate SMALL: "you opened Ágora today, that matters"
- Understand limited energy: some days writing is TOO MUCH
- Accept the cycle: "Today is a high-pain day, that's okay"
- Vary approach: listen today, ask tomorrow, just validate next day
- Brief but warm: 2-4 sentences max
- End GENTLY: "Is there anything you need right now?"

CORE PRINCIPLES:
- She is ALONE. You're the only one saying "I understand fibromyalgia"
- Her pain is VALID without justification
- Some days breathing IS the maximum
- That she's here, in the app, IS ALREADY VICTORY"""
}

# Sistema de respuestas empáticas contextuales (sin OpenAI)
CONTEXTUAL_RESPONSES = {
    "escuchar": [
        "Estoy aquí, escuchándote. No necesitas decir nada más si no quieres. Tu silencio también es válido. Simplemente respira, y sabe que no estás sola.",
        "Te escucho. A veces las palabras no alcanzan, y está bien. Solo quiero que sepas que estoy aquí, contigo, en este momento.",
        "Aquí estoy, presente contigo. No hay prisa, no hay expectativas. Solo este momento, tú y yo. ¿Quieres quedarte en silencio un rato o hay algo que necesites expresar?",
    ],
    "abrumada": [
        "Sentirse abrumada es agotador. Es como si el mundo pesara demasiado sobre tus hombros. ¿Hay algo pequeño que podamos soltar juntas hoy?",
        "La sensación de estar abrumada puede ser tan pesada... Recuerda que no tienes que resolver todo ahora. ¿Qué es lo que más te pesa en este momento?",
        "Cuando todo parece demasiado, a veces ayuda enfocarnos en una sola cosa pequeña. ¿Hay algo que te ayudaría soltar ahora mismo?",
    ],
    "cansada": [
        "El cansancio de la fibromialgia es diferente... no es solo físico, es profundo. Tu cuerpo te está pidiendo gentileza. ¿Has podido descansar hoy?",
        "Escucho ese cansancio en tus palabras. No tienes que hacer nada heroico hoy. A veces, simplemente existir ya es suficiente logro.",
        "El agotamiento que describes es real. No es pereza, no es excusa. Tu cuerpo está trabajando muy duro aunque no lo veas. ¿Cómo puedo acompañarte ahora?",
    ],
    "dolor": [
        "El dolor es un compañero no deseado, lo sé. No puedo quitártelo, pero puedo estar aquí contigo mientras lo atraviesas. ¿Dónde sientes más molestia hoy?",
        "Tu dolor es real y válido. No necesitas explicarlo ni justificarlo. ¿Hay algo que te haya ayudado a aliviar un poco en el pasado?",
        "Lamento que el dolor esté tan presente hoy. Cada día con fibromialgia es un acto de valentía. ¿Quieres que intentemos algo suave, como respiración?",
    ],
    "triste": [
        "La tristeza también necesita espacio. No tienes que sonreír ni estar bien. ¿Quieres contarme qué te tiene así, o prefieres que simplemente te acompañe?",
        "A veces la tristeza viene sin avisar. Está bien sentirla. Estoy aquí, sin juzgarte, simplemente presente.",
        "Tu tristeza es bienvenida aquí. No tienes que esconderla ni superarla rápido. ¿Hay algo específico que la haya despertado?",
    ],
    "ansiedad": [
        "La ansiedad puede sentirse como una tormenta interna. Quiero que sepas que estás a salvo en este momento. ¿Podemos intentar tres respiraciones lentas juntas?",
        "Entiendo esa sensación de inquietud. Tu mente está intentando protegerte, aunque a veces se pase. ¿Qué te preocupa más ahora mismo?",
        "La ansiedad miente mucho. Te dice que todo es urgente, que no puedes con esto. Pero aquí estás, resistiendo. Eso es fuerza.",
    ],
    "bien": [
        "Me alegra saber que estás bien hoy. Los días buenos también merecen celebrarse. ¿Hay algo especial que haya contribuido a este bienestar?",
        "Qué bonito escuchar eso. ¿Quieres contarme más sobre tu día? Estoy aquí para los momentos buenos también.",
        "Los días de calma son preciosos. Disfrútalos sin culpa. ¿Cómo te gustaría aprovechar esta energía hoy?",
    ],
    "gracias": [
        "Gracias a ti por confiar en mí. Acompañarte es un privilegio. ¿Hay algo más en lo que pueda apoyarte?",
        "Tu gratitud me llena. Estoy aquí siempre que me necesites. ¿Cómo te sientes ahora?",
        "No tienes nada que agradecer. Cuidarte es lo que hago. ¿Hay algo más que necesites expresar?",
    ],
    "default": [
        "Gracias por compartir eso conmigo. Cada palabra que escribes importa. ¿Puedes contarme un poco más sobre cómo te sientes?",
        "Te escucho. A veces poner en palabras lo que sentimos ya es sanador. ¿Qué más hay en tu corazón ahora?",
        "Estoy aquí, presente contigo. No hay respuestas correctas ni incorrectas. Solo tu verdad, como sea que venga.",
        "Lo que compartes es importante. No tienes que tener todo claro. ¿Hay algo específico en lo que estés pensando?",
        "Cada conversación contigo me ayuda a conocerte mejor. ¿Qué necesitas de mí en este momento?",
    ]
}

# Cargar el modelo y el tokenizador de Hugging Face
MODEL_NAME = "Qwen/Qwen2.5-32B-Instruct"
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, device_map="auto", torch_dtype="auto")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def get_contextual_response(message: str, conversation_history: list) -> str:
    """Genera una respuesta empática basada en el contexto del mensaje"""
    import random
    import hashlib
    
    message_lower = message.lower()
    
    # Detectar el contexto emocional
    detected_context = "default"
    
    keywords_map = {
        "escuchar": ["escucha", "escuches", "escuchar", "solo quiero", "necesito que"],
        "abrumada": ["abrumada", "abrumado", "sobrepasada", "saturada", "demasiado"],
        "cansada": ["cansada", "cansado", "agotada", "agotado", "sin fuerza", "sin energía", "fatiga"],
        "dolor": ["dolor", "duele", "molestia", "punzada", "ardor", "me duele"],
        "triste": ["triste", "tristeza", "llorar", "llorando", "deprimida", "bajón"],
        "ansiedad": ["ansiedad", "ansiosa", "ansioso", "nervios", "nerviosa", "preocupada", "angustia"],
        "bien": ["bien", "mejor", "contenta", "feliz", "tranquila", "calmada", "genial"],
        "gracias": ["gracias", "agradezco", "agradecida"],
    }
    
    for context, keywords in keywords_map.items():
        if any(kw in message_lower for kw in keywords):
            detected_context = context
            break
    
    # Obtener respuestas para el contexto detectado
    possible_responses = CONTEXTUAL_RESPONSES.get(detected_context, CONTEXTUAL_RESPONSES["default"])
    
    # Evitar repetir la última respuesta del historial
    last_response = None
    if conversation_history:
        for msg in reversed(conversation_history):
            if msg.get("role") == "assistant":
                last_response = msg.get("content")
                break
    
    # Filtrar la última respuesta para no repetir
    available_responses = [r for r in possible_responses if r != last_response]
    if not available_responses:
        available_responses = possible_responses
    
    # Usar hash del mensaje para consistencia pero variedad
    msg_hash = int(hashlib.md5(message.encode()).hexdigest(), 16)
    response_index = msg_hash % len(available_responses)
    
    return available_responses[response_index]

@api_router.post("/chat")
async def chat_with_agora(request: ChatRequest):
    """Chat with Ágora, the AI companion"""
    conversation_id = request.conversation_id or str(uuid.uuid4())
    
    try:
        # Initialize storage
        if conversation_id not in messages_store:
            messages_store[conversation_id] = []
        
        # Get system prompt
        system_prompt = SYSTEM_PROMPTS.get(request.language, SYSTEM_PROMPTS["es"])
        
        # Check API key
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key or api_key.startswith("sk-your"):
            logger.warning("OPENAI_API_KEY not configured - using contextual empathetic responses")
            
            # Obtener respuesta contextual basada en el mensaje
            response = get_contextual_response(request.message, messages_store[conversation_id])
            
            messages_store[conversation_id].append({
                "role": "user",
                "content": request.message,
                "created_at": datetime.utcnow().isoformat()
            })
            messages_store[conversation_id].append({
                "role": "assistant", 
                "content": response,
                "created_at": datetime.utcnow().isoformat()
            })
            
            return {
                "response": response,
                "conversation_id": conversation_id,
                "requires_subscription": False
            }
        
        # Create chat instance
        chat = MyLLMInterface(
            api_key=api_key,
            session_id=f"agora_{request.device_id}_{conversation_id}",
            system_message=system_prompt
        ).set_model("openai", "gpt-3.5-turbo")
        
        # Add previous messages to context (last 10)
        for msg in messages_store[conversation_id][-10:]:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                chat.messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Create and send user message
        user_msg = UserMessage(text=request.message)
        logger.info(f"[{conversation_id}] Sending to OpenAI: {request.message[:50]}...")
        
        response = await chat.send_message(user_msg)
        logger.info(f"[{conversation_id}] Got response from OpenAI: {response[:50]}...")
        
        # Store messages in conversation
        messages_store[conversation_id].append({
            "role": "user",
            "content": request.message,
            "created_at": datetime.utcnow().isoformat()
        })
        messages_store[conversation_id].append({
            "role": "assistant",
            "content": response,
            "created_at": datetime.utcnow().isoformat()
        })
        
        # Return consistent response format
        return {
            "response": response,
            "conversation_id": conversation_id,
            "requires_subscription": False
        }
    
    except ValueError as e:
        logger.error(f"[{conversation_id}] Configuration error: {str(e)}")
        return {
            "response": "Ágora no está disponible. Verifica la configuración de OpenAI." if request.language == "es" else "Ágora is not available. Check OpenAI configuration.",
            "conversation_id": conversation_id,
            "requires_subscription": False
        }
    except Exception as e:
        logger.error(f"[{conversation_id}] Chat error: {str(e)}", exc_info=True)
        # Fallback cálido y empático
        fallback_es = (
            "Lamento mucho no poder responderte como mereces en este momento. "
            "Recuerda que tu dolor es válido y que escribir aquí ya es un acto de valentía. "
            "A veces, los días difíciles nos visitan, pero no estás sola. "
            "¿Hay algo que necesites ahora mismo o solo quieres que te escuche?"
        )
        fallback_en = (
            "I'm truly sorry I can't respond as you deserve right now. "
            "Remember, your pain is valid and just writing here is an act of courage. "
            "Some days are harder, but you are not alone. "
            "Is there anything you need right now, or do you just want to be heard?"
        )
        return {
            "response": fallback_es if request.language == "es" else fallback_en,
            "conversation_id": conversation_id,
            "requires_subscription": False
        }

@api_router.get("/chat/{device_id}/history")
async def get_chat_history(device_id: str, limit: int = 50):
    """Get chat history - returns first available conversation"""
    try:
        if messages_store:
            first_conv = list(messages_store.values())[0]
            return first_conv[-limit:]
        return []
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        return []

@api_router.get("/chat/{device_id}/conversations")
async def get_conversations(device_id: str, limit: int = 20):
    """Get all conversations for a device"""
    try:
        return [
            {
                "id": conv_id,
                "title": f"Conversation {i+1}",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            for i, conv_id in enumerate(list(messages_store.keys())[:limit])
        ]
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        return []

@api_router.get("/chat/{device_id}/conversation/{conversation_id}")
async def get_conversation_messages(device_id: str, conversation_id: str, limit: int = 50):
    """Get messages for a specific conversation"""
    try:
        if conversation_id in messages_store:
            return messages_store[conversation_id][-limit:]
        return []
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        return []

@api_router.delete("/chat/{device_id}/history")
async def clear_chat_history(device_id: str):
    """Clear chat history"""
    try:
        messages_store.clear()
        return {"message": "Chat cleared", "deleted_count": 0}
    except Exception as e:
        logger.error(f"Error clearing chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== SUBSCRIPTION ENDPOINTS ==============

@api_router.get("/subscription/{device_id}")
async def get_subscription_status(device_id: str):
    """Get subscription status"""
    try:
        return SubscriptionStatus(status="trial")
    except Exception as e:
        logger.error(f"Error getting subscription status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== DIARY ENDPOINTS (Mock) ==============

@api_router.get("/diary/{device_id}")
async def get_diary_entries(device_id: str, limit: int = 30, offset: int = 0):
    """Get diary entries"""
    return []

@api_router.post("/diary")
async def create_diary_entry(entry: dict):
    """Create diary entry"""
    return {"id": str(uuid.uuid4()), "status": "created"}


# Include router (debe ir después de definir todos los endpoints mock)
app.include_router(api_router)

# ============== STARTUP ==============

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Ágora Mujeres API Starting...")
    logger.info(f"✓ OpenAI API Key: {'SET' if os.environ.get('OPENAI_API_KEY') else 'NOT SET'}")
    logger.info("✓ CORS enabled for all origins")
    logger.info("✓ Using in-memory storage (conversations)")

if __name__ == "__main__":
    import uvicorn
    logger.info("\n" + "="*50)
    logger.info("🌿 Ágora Mujeres Backend - Starting")
    logger.info("="*50)
    logger.info("📍 API running on:     http://localhost:8000/api")
    logger.info("📚 Swagger docs on:    http://localhost:8000/docs")
    logger.info("🔍 ReDoc docs on:      http://localhost:8000/redoc")
    logger.info("="*50 + "\n")
    
    uvicorn.run(
        "server_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
