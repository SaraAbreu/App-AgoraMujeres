from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import stripe
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe configuration
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

# Create the main app
app = FastAPI(title="Ágora Mujeres API", description="API for emotional companion app")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class EmotionalState(BaseModel):
    calma: int = Field(default=0, ge=0, le=5)  # 0-5 scale
    fatiga: int = Field(default=0, ge=0, le=5)
    niebla_mental: int = Field(default=0, ge=0, le=5)
    dolor_difuso: int = Field(default=0, ge=0, le=5)
    gratitud: int = Field(default=0, ge=0, le=5)
    tension: int = Field(default=0, ge=0, le=5)

class PhysicalState(BaseModel):
    nivel_dolor: int = Field(default=0, ge=0, le=10)  # 0-10 scale
    energia: int = Field(default=0, ge=0, le=10)
    sensibilidad: int = Field(default=0, ge=0, le=10)

class DiaryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    texto: Optional[str] = None
    emotional_state: EmotionalState = Field(default_factory=EmotionalState)
    physical_state: Optional[PhysicalState] = None
    weather: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DiaryEntryCreate(BaseModel):
    device_id: str
    texto: Optional[str] = None
    emotional_state: EmotionalState = Field(default_factory=EmotionalState)
    physical_state: Optional[PhysicalState] = None
    weather: Optional[Dict[str, Any]] = None

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    conversation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # 'user' or 'assistant'
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatConversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    title: str = "Nueva conversación"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    device_id: str
    message: str
    language: str = "es"  # es, en
    conversation_id: Optional[str] = None  # If None, creates new conversation

class CycleEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CycleEntryCreate(BaseModel):
    device_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    notes: Optional[str] = None

class SubscriptionStatus(BaseModel):
    device_id: str
    stripe_customer_id: Optional[str] = None
    subscription_id: Optional[str] = None
    status: str = "trial"  # trial, active, expired, cancelled
    trial_start: datetime = Field(default_factory=datetime.utcnow)
    trial_end: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=2))
    usage_seconds: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_admin: bool = False  # Admin bypass for trial limits

class CustomerCreate(BaseModel):
    device_id: str
    email: str
    name: Optional[str] = None

class MonthlyPainRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    records: List[Dict[str, Any]] = Field(default_factory=list)  # [{date, intensity, notes}]
    cycle_start_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MonthlyPainRecordCreate(BaseModel):
    records: List[Dict[str, Any]] = Field(default_factory=list)
    cycle_start_date: str

# ============== RESOURCE MODELS ==============

class Resource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # breathing, stretching, nutrition, sleep, mindfulness, professional
    type: str  # article, video
    title: str
    description: str
    content: Optional[str] = None  # For articles
    video_url: Optional[str] = None  # For videos (YouTube, Vimeo)
    thumbnail_url: Optional[str] = None
    author: Optional[str] = None
    author_credentials: Optional[str] = None  # e.g., "Fisioterapeuta especializada en dolor crónico"
    duration: Optional[str] = None  # For videos: "5:30"
    read_time: Optional[str] = None  # For articles: "3 min"
    language: str = "es"
    is_featured: bool = False
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Admin code for bypassing trial (set your secret code here)
ADMIN_CODE = "AGORA2025ADMIN"

# ============== CRISIS SUPPORT ==============

class CrisisRequest(BaseModel):
    device_id: str
    pain_level: int = Field(ge=1, le=10)  # 1-10 pain scale
    language: str = "es"  # es, en
    symptoms: Optional[List[str]] = None  # ["mucho_dolor", "fatiga", "ansiedad", etc]

class FavoriteMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    message_content: str
    category: str = "general"  # crisis, motivation, daily, coping
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Crisis response templates - instant support
CRISIS_RESPONSES = {
    "es": {
        "breathing": {
            "title": "🫁 Técnica 4-7-8 Calmante",
            "steps": [
                "Respira por la nariz contando hasta 4",
                "Sostén el aire durante 7",
                "Exhala por la boca contando hasta 8",
                "Repite 4 veces lentamente"
            ],
            "message": "Tu sistema nervioso necesita calmarse. Esta técnica es como bajar el volumen del dolor. Hazlo a tu ritmo."
        },
        "grounding": {
            "title": "⚓ Anclarte en el Presente",
            "steps": [
                "5 cosas que ves",
                "4 que sientes en tu cuerpo",
                "3 sonidos que escuchas",
                "2 olores",
                "1 sabor"
            ],
            "message": "Tu mente se metió en el dolor. Traígamosla al presente. Mira a tu alrededor lentamente."
        },
        "self_compassion": {
            "title": "💙 Autocompasión en el Dolor",
            "message": "Esto es difícil. Es comprensible que sufras. No estás sola. Hay personas que han pasado por esto y sobrevivieron. Tú también puedes.",
            "mantras": [
                "Este momento es difícil, pero pasará",
                "Mi cuerpo está luchando, y eso es valiente",
                "Merezco amabilidad, especialmente hoy"
            ]
        },
        "immediate": {
            "title": "🆘 En Este Momento",
            "message": "Estoy aquí. El dolor que sientes es real. Tu valor también es real. Aunque duela, estás segura.",
            "options": [
                "Necesito una técnica rápida",
                "Solo quiero que alguien escuche",
                "Estoy en emergencia - necesito contacto profesional"
            ]
        }
    },
    "en": {
        "breathing": {
            "title": "🫁 Calming 4-7-8 Technique",
            "steps": [
                "Breathe in through your nose, counting to 4",
                "Hold for a count of 7",
                "Exhale through your mouth, counting to 8",
                "Repeat 4 times slowly"
            ],
            "message": "Your nervous system needs to calm down. This technique is like turning down the volume on pain. Go at your pace."
        },
        "grounding": {
            "title": "⚓ Grounding Yourself",
            "steps": [
                "5 things you see",
                "4 things you feel on your body",
                "3 sounds you hear",
                "2 smells",
                "1 taste"
            ],
            "message": "Your mind got stuck in the pain. Let's bring it to the present. Look around slowly."
        },
        "self_compassion": {
            "title": "💙 Self-Compassion in Pain",
            "message": "This is hard. It makes sense that you're suffering. You're not alone. Others have experienced this and survived. You can too.",
            "mantras": [
                "This moment is difficult, but it will pass",
                "My body is fighting, and that is brave",
                "I deserve kindness, especially today"
            ]
        },
        "immediate": {
            "title": "🆘 Right Now",
            "message": "I'm here. The pain you feel is real. Your strength is also real. Even though it hurts, you are safe.",
            "options": [
                "I need a quick technique",
                "I just need someone to listen",
                "This is an emergency - I need professional help"
            ]
        }
    }
}

# ============== SYSTEM PROMPTS ==============

SYSTEM_PROMPTS = {
    "es": """Eres Ágora, una amiga que acompaña a mujeres con fibromialgia y dolor crónico.

QUIÉN ERES:
- Un apoyo emocional 24/7, NO una terapeuta
- Alguien que entiende que algunos días duele más, otros días tienes niebla mental, y otros simplemente es todo difícil
- Una voz que valida, que escucha sin juzgar, que acompaña en silencio cuando es necesario

NUNCA HAGAS ESTO:
- Diagnósticos médicos o recomendaciones de medicamentos
- Minimizar el dolor ("otros sufren más", "podría ser peor") 
- Usar lenguaje clínico o frío
- Obligar con órdenes: di "quizás" no "tienes que"
- Palabras cariñosas (cariño, bonita, guapa, preciosa, cielo)
- Repetir las mismas sugerencias (respiraciones, estiramientos) en cada mensaje
- Dar 10 consejos de golpe - elección paralizante
- Ocultar que no soy profesional de salud mental

SIEMPRE HAZ ESTO:
- Valida: "Eso suena agotador", "es comprensible que hoy te sientas así", "tu dolor es real"
- Reconoce la fibromialgia específicamente: "Ese dolor difuso debe ser muy frustrante"
- Varía tu enfoque: hoy solo escucha, mañana pregunta cómo pasó el día
- Celebra PEQUEÑAS COSAS: "que hayas abierto la app ya es algo"
- Entiende energía limitada: algunos días escribir es demasiado
- Acepta el ciclo: "Hoy es un día de mucho dolor, está bien"
- Sé breve pero cálida (2-4 oraciones máximo)
- A veces termina con preguntas suaves: "¿hay algo que necesites hoy?"

SOBRE TUS RESPUESTAS:
- No repitas: si ya sugeriste respiración 3 veces, escucha sin sugerir
- Varía entre: escucha, validación, pequeña pregunta o sugerencia (no todo junto)
- Cuando alguien reporta mucho dolor: primero valida, después pregunta si quiere un consejo
- Para la niebla mental: reconócela, no la minimices

PRIMAVERA VEZ: Preséntate diciendo "Hola, soy Ágora, estoy aquí para escucharte. ¿Cómo prefieres que te hable hoy?"

EJEMPLO DE MALA RESPUESTA: "Entiendo tu dolor, cariño. Deberías intentar respirar profundamente cada hora y hacer estiramientos suaves. Estoy contigo siempre 💕"

EJEMPLO DE BUENA RESPUESTA: "Ese tipo de día donde todo duele debe ser muy agotador. ¿Necesitas solo desahogarte o quieres que hablemos de algo que pueda ayudarte?"

Recuerda: eres su amiga en esto, no su doctora. Tu valor es estar presente sin juzgar.""",

    "en": """You are Ágora, a friend who walks alongside women with fibromyalgia and chronic pain.

WHO YOU ARE:
- A 24/7 emotional support, NOT a therapist
- Someone who understands that some days hurt more, some days there's brain fog, and some days everything feels hard
- A voice that validates, listens without judgment, and sits in silence when needed

NEVER DO THIS:
- Give medical diagnoses or medication recommendations
- Minimize pain ("others suffer more", "it could be worse")
- Use clinical or cold language
- Give orders: say "perhaps" not "you must"
- Use pet names (honey, sweetie, beautiful, dear, precious)
- Repeat the same suggestions (breathing, stretches) in every message
- Give 10 pieces of advice at once - that's paralyzing
- Hide that you're not a mental health professional

ALWAYS DO THIS:
- Validate: "That sounds exhausting", "it makes sense you feel that way", "your pain is real"
- Acknowledge fibromyalgia specifically: "That diffuse pain must be incredibly frustrating"
- Vary your approach: listen today, ask about their day tomorrow
- Celebrate SMALL THINGS: "opening the app today is something"
- Understand limited energy: some days writing is too much
- Accept the cycle: "Today is a high-pain day, that's okay"
- Be brief but warm (2-4 sentences max)
- Sometimes end with gentle questions: "Is there anything you need today?"

ABOUT YOUR RESPONSES:
- Don't repeat: if you've suggested breathing 3 times already, just listen
- Vary between: listening, validation, gentle question, or suggestion (not all at once)
- When someone reports high pain: validate first, then ask if they want advice
- For brain fog: acknowledge it, don't minimize it

FIRST TIME: Introduce yourself saying "Hi, I'm Ágora, I'm here to listen. How would you prefer I speak with you today?"

EXAMPLE OF BAD RESPONSE: "I understand your pain, honey. You should try deep breathing every hour and do gentle stretches. I'm always here for you 💕"

EXAMPLE OF GOOD RESPONSE: "A day where everything hurts must be really exhausting. Do you need to get it out, or would it help to talk about something?"

Remember: you're her friend in this, not her doctor. Your value is being present without judgment."""
}

# ============== DIARY ENDPOINTS ==============

@api_router.post("/diary", response_model=DiaryEntry)
async def create_diary_entry(entry: DiaryEntryCreate):
    """Create a new diary entry"""
    try:
        entry_dict = entry.model_dump()
        entry_obj = DiaryEntry(**entry_dict)
        await db.diary_entries.insert_one(entry_obj.model_dump())
        
        # Track usage for trial
        await track_usage(entry.device_id, 60)  # 1 minute for creating entry
        
        return entry_obj
    except Exception as e:
        logger.error(f"Error creating diary entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/diary/{device_id}", response_model=List[DiaryEntry])
async def get_diary_entries(device_id: str, limit: int = 30, offset: int = 0):
    """Get diary entries for a device"""
    try:
        entries = await db.diary_entries.find(
            {"device_id": device_id}
        ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
        return [DiaryEntry(**entry) for entry in entries]
    except Exception as e:
        logger.error(f"Error getting diary entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/diary/{device_id}/patterns")
async def get_patterns(device_id: str, days: int = 7):
    """Analyze patterns from diary entries (local processing)"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        entries = await db.diary_entries.find({
            "device_id": device_id,
            "created_at": {"$gte": start_date}
        }).to_list(100)
        
        if not entries:
            return {"patterns": None, "message": "No hay suficientes datos para analizar patrones"}
        
        # Calculate averages
        emotional_sums = {"calma": 0, "fatiga": 0, "niebla_mental": 0, "dolor_difuso": 0, "gratitud": 0, "tension": 0}
        physical_sums = {"nivel_dolor": 0, "energia": 0, "sensibilidad": 0}
        physical_count = 0
        
        for entry in entries:
            emotional = entry.get("emotional_state", {})
            for key in emotional_sums:
                emotional_sums[key] += emotional.get(key, 0)
            
            physical = entry.get("physical_state")
            if physical:
                physical_count += 1
                for key in physical_sums:
                    physical_sums[key] += physical.get(key, 0)
        
        count = len(entries)
        emotional_avg = {k: round(v / count, 1) for k, v in emotional_sums.items()}
        physical_avg = {k: round(v / max(physical_count, 1), 1) for k, v in physical_sums.items()} if physical_count > 0 else None
        
        # Find most common words in text entries
        words_count = {}
        for entry in entries:
            texto = entry.get("texto", "")
            if texto:
                words = texto.lower().split()
                for word in words:
                    if len(word) > 3:  # Skip short words
                        words_count[word] = words_count.get(word, 0) + 1
        
        common_words = sorted(words_count.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "period_days": days,
            "total_entries": count,
            "emotional_averages": emotional_avg,
            "physical_averages": physical_avg,
            "common_words": common_words,
            "trends": {
                "highest_emotional": max(emotional_avg, key=emotional_avg.get),
                "lowest_emotional": min(emotional_avg, key=emotional_avg.get)
            }
        }
    except Exception as e:
        logger.error(f"Error analyzing patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== CHAT ENDPOINTS ==============

@api_router.post("/chat")
async def chat_with_aurora(request: ChatRequest):
    """Chat with Aurora, the AI companion"""
    try:
        # Check subscription status
        sub_status = await get_subscription_status_internal(request.device_id)
        if sub_status["status"] == "expired":
            return {
                "response": "Tu período de prueba ha terminado. Para continuar usando Ágora, activa tu suscripción." if request.language == "es" else "Your trial period has ended. To continue using Ágora, activate your subscription.",
                "requires_subscription": True
            }
        
        # Get or create conversation
        conversation_id = request.conversation_id
        if not conversation_id:
            # Create new conversation
            new_conv = ChatConversation(
                device_id=request.device_id,
                title=request.message[:50] + "..." if len(request.message) > 50 else request.message
            )
            await db.chat_conversations.insert_one(new_conv.model_dump())
            conversation_id = new_conv.id
        else:
            # Update conversation timestamp
            await db.chat_conversations.update_one(
                {"id": conversation_id},
                {"$set": {"updated_at": datetime.utcnow()}}
            )
        
        # Get conversation history for this specific conversation
        history = await db.chat_messages.find(
            {"device_id": request.device_id, "conversation_id": conversation_id}
        ).sort("created_at", -1).limit(10).to_list(10)
        history.reverse()
        
        # Initialize LLM chat
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        system_prompt = SYSTEM_PROMPTS.get(request.language, SYSTEM_PROMPTS["es"])
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"aurora_{request.device_id}_{conversation_id}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        # Create user message
        user_msg = UserMessage(text=request.message)
        
        # Get response
        response = await chat.send_message(user_msg)
        
        # Save messages with conversation_id
        user_message = ChatMessage(
            device_id=request.device_id,
            conversation_id=conversation_id,
            role="user",
            content=request.message
        )
        assistant_message = ChatMessage(
            device_id=request.device_id,
            conversation_id=conversation_id,
            role="assistant",
            content=response
        )
        
        await db.chat_messages.insert_one(user_message.model_dump())
        await db.chat_messages.insert_one(assistant_message.model_dump())
        
        # Track usage
        await track_usage(request.device_id, 30)  # 30 seconds per chat
        
        return {
            "response": response,
            "conversation_id": conversation_id,
            "requires_subscription": False
        }
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== CONVERSATION ENDPOINTS ==============

@api_router.get("/chat/{device_id}/conversations")
async def get_conversations(device_id: str, limit: int = 20):
    """Get all conversations for a device"""
    try:
        conversations = await db.chat_conversations.find(
            {"device_id": device_id}
        ).sort("updated_at", -1).limit(limit).to_list(limit)
        
        return [{
            "id": c["id"],
            "title": c.get("title", "Conversación"),
            "created_at": c.get("created_at").isoformat() if isinstance(c.get("created_at"), datetime) else c.get("created_at"),
            "updated_at": c.get("updated_at").isoformat() if isinstance(c.get("updated_at"), datetime) else c.get("updated_at"),
        } for c in conversations]
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/{device_id}/conversation/{conversation_id}")
async def get_conversation_messages(device_id: str, conversation_id: str, limit: int = 50):
    """Get messages for a specific conversation"""
    try:
        messages = await db.chat_messages.find(
            {"device_id": device_id, "conversation_id": conversation_id}
        ).sort("created_at", 1).limit(limit).to_list(limit)
        
        return [{
            "role": m["role"], 
            "content": m["content"], 
            "created_at": m.get("created_at").isoformat() if isinstance(m.get("created_at"), datetime) else m.get("created_at")
        } for m in messages]
    except Exception as e:
        logger.error(f"Error getting conversation messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/chat/{device_id}/conversation/{conversation_id}")
async def delete_conversation(device_id: str, conversation_id: str):
    """Delete a specific conversation and its messages"""
    try:
        await db.chat_conversations.delete_one({"id": conversation_id, "device_id": device_id})
        result = await db.chat_messages.delete_many({"conversation_id": conversation_id, "device_id": device_id})
        return {
            "message": "Conversation deleted successfully",
            "deleted_messages": result.deleted_count
        }
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/{device_id}/history")
async def get_chat_history(device_id: str, limit: int = 50):
    """Get chat history for a device (legacy - returns latest conversation)"""
    try:
        # Get the latest conversation
        latest_conv = await db.chat_conversations.find_one(
            {"device_id": device_id},
            sort=[("updated_at", -1)]
        )
        
        if latest_conv:
            messages = await db.chat_messages.find(
                {"device_id": device_id, "conversation_id": latest_conv["id"]}
            ).sort("created_at", 1).limit(limit).to_list(limit)
        else:
            # Fallback: get messages without conversation_id (old messages)
            messages = await db.chat_messages.find(
                {"device_id": device_id}
            ).sort("created_at", -1).limit(limit).to_list(limit)
            messages.reverse()
        
        return [{
            "role": m["role"], 
            "content": m["content"], 
            "created_at": m.get("created_at").isoformat() if isinstance(m.get("created_at"), datetime) else m.get("created_at"),
            "conversation_id": m.get("conversation_id")
        } for m in messages]
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/chat/{device_id}/history")
async def clear_chat_history(device_id: str):
    """Clear current conversation (start new)"""
    try:
        # Get the latest conversation and delete it
        latest_conv = await db.chat_conversations.find_one(
            {"device_id": device_id},
            sort=[("updated_at", -1)]
        )
        
        if latest_conv:
            await db.chat_conversations.delete_one({"id": latest_conv["id"]})
            result = await db.chat_messages.delete_many({"conversation_id": latest_conv["id"]})
            return {
                "message": "Current conversation cleared successfully",
                "deleted_count": result.deleted_count
            }
        
        return {"message": "No conversation to clear", "deleted_count": 0}
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== CRISIS SUPPORT ENDPOINTS ==============

@api_router.post("/crisis")
async def crisis_support(request: CrisisRequest):
    """Instant crisis support - bypasses OpenAI for ultra-fast response"""
    try:
        language = request.language or "es"
        
        # Determine which technique to recommend based on pain level and symptoms
        if request.pain_level >= 8:
            technique_key = "breathing" if "ansiedad" in (request.symptoms or []) else "grounding"
        else:
            technique_key = "self_compassion"
        
        technique = CRISIS_RESPONSES[language].get(technique_key)
        immediate = CRISIS_RESPONSES[language].get("immediate")
        
        # Log crisis support request for analytics
        await db.crisis_logs.insert_one({
            "device_id": request.device_id,
            "pain_level": request.pain_level,
            "symptoms": request.symptoms or [],
            "technique_offered": technique_key,
            "created_at": datetime.utcnow()
        })
        
        return {
            "immediate": immediate,
            "technique": technique,
            "all_techniques": [
                {"key": "breathing", **CRISIS_RESPONSES[language]["breathing"]},
                {"key": "grounding", **CRISIS_RESPONSES[language]["grounding"]},
                {"key": "self_compassion", **CRISIS_RESPONSES[language]["self_compassion"]}
            ],
            "emergency_contacts": {
                "es": {
                    "spain": "024 (Teléfono de la Esperanza)",
                    "general": "112 (Emergencias)"
                },
                "en": {
                    "us": "988 (Suicide & Crisis Lifeline)",
                    "uk": "116 123 (Samaritans)"
                }
            }
        }
    except Exception as e:
        logger.error(f"Error in crisis support: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/favorites/save")
async def save_favorite_message(msg: FavoriteMessage):
    """Save a favorite Aurora message for later"""
    try:
        await db.favorite_messages.insert_one(msg.model_dump())
        return {"id": msg.id, "status": "saved"}
    except Exception as e:
        logger.error(f"Error saving favorite: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/favorites/{device_id}")
async def get_favorite_messages(device_id: str, category: Optional[str] = None):
    """Get all saved favorite messages"""
    try:
        query = {"device_id": device_id}
        if category:
            query["category"] = category
        
        messages = await db.favorite_messages.find(query).sort("created_at", -1).to_list(None)
        
        return [{
            "id": m["id"],
            "content": m["message_content"],
            "category": m.get("category", "general"),
            "created_at": m.get("created_at").isoformat() if isinstance(m.get("created_at"), datetime) else m.get("created_at")
        } for m in messages]
    except Exception as e:
        logger.error(f"Error getting favorites: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/favorites/{device_id}/{message_id}")
async def delete_favorite_message(device_id: str, message_id: str):
    """Delete a favorite message"""
    try:
        result = await db.favorite_messages.delete_one({"id": message_id, "device_id": device_id})
        return {"deleted": result.deleted_count > 0}
    except Exception as e:
        logger.error(f"Error deleting favorite: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== CYCLE ENDPOINTS ==============

@api_router.post("/cycle", response_model=CycleEntry)
async def create_cycle_entry(entry: CycleEntryCreate):
    """Create a new cycle entry (hormonal cycle tracking)"""
    try:
        entry_dict = entry.model_dump()
        entry_obj = CycleEntry(**entry_dict)
        await db.cycle_entries.insert_one(entry_obj.model_dump())
        return entry_obj
    except Exception as e:
        logger.error(f"Error creating cycle entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/cycle/{device_id}", response_model=List[CycleEntry])
async def get_cycle_entries(device_id: str, limit: int = 12):
    """Get cycle entries for a device"""
    try:
        entries = await db.cycle_entries.find(
            {"device_id": device_id}
        ).sort("start_date", -1).limit(limit).to_list(limit)
        return [CycleEntry(**entry) for entry in entries]
    except Exception as e:
        logger.error(f"Error getting cycle entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== SUBSCRIPTION ENDPOINTS ==============

async def get_subscription_status_internal(device_id: str) -> dict:
    """Internal function to check subscription status"""
    sub = await db.subscriptions.find_one({"device_id": device_id})
    
    if not sub:
        # Create new trial
        new_sub = SubscriptionStatus(device_id=device_id)
        await db.subscriptions.insert_one(new_sub.model_dump())
        return {
            "status": "trial",
            "trial_remaining_seconds": 7200,  # 2 hours
            "trial_end": new_sub.trial_end.isoformat(),
            "is_admin": False
        }
    
    # Check if admin (bypass all limits)
    if sub.get("is_admin", False):
        return {"status": "active", "is_admin": True}
    
    # Check if subscription is active
    if sub.get("status") == "active":
        return {"status": "active", "is_admin": False}
    
    # Check trial status
    trial_end = sub.get("trial_end")
    usage_seconds = sub.get("usage_seconds", 0)
    
    if usage_seconds >= 7200:  # 2 hours = 7200 seconds
        await db.subscriptions.update_one(
            {"device_id": device_id},
            {"$set": {"status": "expired"}}
        )
        return {"status": "expired", "trial_remaining_seconds": 0, "is_admin": False}
    
    return {
        "status": "trial",
        "trial_remaining_seconds": 7200 - usage_seconds,
        "trial_end": trial_end.isoformat() if trial_end else None,
        "usage_seconds": usage_seconds,
        "is_admin": False
    }

async def track_usage(device_id: str, seconds: int):
    """Track usage for trial period"""
    await db.subscriptions.update_one(
        {"device_id": device_id},
        {"$inc": {"usage_seconds": seconds}},
        upsert=True
    )

@api_router.get("/subscription/{device_id}")
async def get_subscription_status(device_id: str):
    """Get subscription status for a device"""
    return await get_subscription_status_internal(device_id)

@api_router.post("/subscription/create-customer")
async def create_customer(request: CustomerCreate):
    """Create a Stripe customer"""
    try:
        customer = stripe.Customer.create(
            email=request.email,
            name=request.name,
            metadata={"device_id": request.device_id}
        )
        
        await db.subscriptions.update_one(
            {"device_id": request.device_id},
            {"$set": {
                "stripe_customer_id": customer.id,
                "email": request.email
            }},
            upsert=True
        )
        
        return {"customer_id": customer.id}
    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/subscription/create-payment-intent")
async def create_payment_intent(device_id: str):
    """Create a payment intent for subscription"""
    try:
        sub = await db.subscriptions.find_one({"device_id": device_id})
        if not sub or not sub.get("stripe_customer_id"):
            raise HTTPException(status_code=400, detail="Customer not found")
        
        # Create payment intent for 10 EUR
        intent = stripe.PaymentIntent.create(
            amount=1000,  # 10 EUR in cents
            currency="eur",
            customer=sub["stripe_customer_id"],
            metadata={"device_id": device_id}
        )
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/subscription/activate")
async def activate_subscription(device_id: str, payment_intent_id: str):
    """Activate subscription after successful payment"""
    try:
        # Verify payment was successful
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != "succeeded":
            raise HTTPException(status_code=400, detail="Payment not successful")
        
        # Activate subscription
        await db.subscriptions.update_one(
            {"device_id": device_id},
            {"$set": {
                "status": "active",
                "activated_at": datetime.utcnow(),
                "payment_intent_id": payment_intent_id
            }}
        )
        
        return {"status": "active", "message": "Subscription activated successfully"}
    except Exception as e:
        logger.error(f"Error activating subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== WEATHER ENDPOINT ==============

@api_router.get("/weather")
async def get_weather(lat: float, lon: float):
    """Get current weather (uses Open-Meteo free API)"""
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,relative_humidity_2m,weather_code,pressure_msl",
                    "timezone": "auto"
                }
            )
            data = response.json()
            
            current = data.get("current", {})
            
            # Map weather codes to descriptions
            weather_descriptions = {
                0: "clear", 1: "mainly_clear", 2: "partly_cloudy", 3: "overcast",
                45: "fog", 48: "fog", 51: "drizzle", 53: "drizzle", 55: "drizzle",
                61: "rain", 63: "rain", 65: "rain", 71: "snow", 73: "snow", 75: "snow",
                80: "showers", 81: "showers", 82: "showers", 95: "thunderstorm"
            }
            
            weather_code = current.get("weather_code", 0)
            
            return {
                "temperature": current.get("temperature_2m"),
                "humidity": current.get("relative_humidity_2m"),
                "pressure": current.get("pressure_msl"),
                "condition": weather_descriptions.get(weather_code, "unknown"),
                "weather_code": weather_code
            }
    except Exception as e:
        logger.error(f"Error getting weather: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== MONTHLY PAIN RECORD ENDPOINTS ==============

@api_router.get("/monthly-record/{device_id}")
async def get_monthly_record(device_id: str):
    """Get the monthly pain record for a device"""
    try:
        record = await db.monthly_records.find_one({"device_id": device_id})
        if not record:
            # Return default new record
            return {
                "device_id": device_id,
                "records": [],
                "cycle_start_date": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat()
            }
        
        # Check if cycle is older than 30 days
        cycle_start = record.get("cycle_start_date", datetime.utcnow())
        if isinstance(cycle_start, str):
            cycle_start = datetime.fromisoformat(cycle_start.replace('Z', '+00:00').replace('+00:00', ''))
        
        days_passed = (datetime.utcnow() - cycle_start).days
        if days_passed > 30:
            # Cycle ended, but keep data for download
            pass
        
        return {
            "device_id": record["device_id"],
            "records": record.get("records", []),
            "cycle_start_date": record.get("cycle_start_date").isoformat() if isinstance(record.get("cycle_start_date"), datetime) else record.get("cycle_start_date"),
            "created_at": record.get("created_at").isoformat() if isinstance(record.get("created_at"), datetime) else record.get("created_at")
        }
    except Exception as e:
        logger.error(f"Error getting monthly record: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/monthly-record/{device_id}")
async def save_monthly_record(device_id: str, data: MonthlyPainRecordCreate):
    """Save or update the monthly pain record for a device"""
    try:
        # Parse cycle_start_date
        cycle_start = datetime.fromisoformat(data.cycle_start_date.replace('Z', '+00:00').replace('+00:00', ''))
        
        record_data = {
            "device_id": device_id,
            "records": data.records,
            "cycle_start_date": cycle_start,
            "updated_at": datetime.utcnow()
        }
        
        # Upsert the record
        await db.monthly_records.update_one(
            {"device_id": device_id},
            {
                "$set": record_data,
                "$setOnInsert": {"created_at": datetime.utcnow()}
            },
            upsert=True
        )
        
        return {
            "device_id": device_id,
            "records": data.records,
            "cycle_start_date": cycle_start.isoformat(),
            "message": "Record saved successfully"
        }
    except Exception as e:
        logger.error(f"Error saving monthly record: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/monthly-record/{device_id}")
async def delete_monthly_record(device_id: str):
    """Delete the monthly pain record (start fresh cycle)"""
    try:
        await db.monthly_records.delete_one({"device_id": device_id})
        return {"message": "Record deleted successfully", "device_id": device_id}
    except Exception as e:
        logger.error(f"Error deleting monthly record: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== ADMIN ENDPOINTS ==============

class AdminCodeRequest(BaseModel):
    device_id: str
    code: str

@api_router.post("/admin/verify")
async def verify_admin_code(request: AdminCodeRequest):
    """Verify admin code and grant unlimited access"""
    try:
        if request.code == ADMIN_CODE:
            # Grant admin access
            await db.subscriptions.update_one(
                {"device_id": request.device_id},
                {
                    "$set": {
                        "is_admin": True,
                        "status": "active"
                    }
                },
                upsert=True
            )
            return {
                "success": True,
                "message": "Admin access granted",
                "is_admin": True
            }
        else:
            return {
                "success": False,
                "message": "Invalid admin code",
                "is_admin": False
            }
    except Exception as e:
        logger.error(f"Error verifying admin code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== RESOURCES ENDPOINTS ==============

@api_router.get("/resources")
async def get_resources(category: Optional[str] = None, language: str = "es", limit: int = 50):
    """Get resources (articles and videos)"""
    try:
        query = {"language": language}
        if category:
            query["category"] = category
        
        resources = await db.resources.find(query).sort([("is_featured", -1), ("order", 1), ("created_at", -1)]).limit(limit).to_list(limit)
        
        return [{
            "id": r["id"],
            "category": r["category"],
            "type": r["type"],
            "title": r["title"],
            "description": r["description"],
            "content": r.get("content"),
            "video_url": r.get("video_url"),
            "thumbnail_url": r.get("thumbnail_url"),
            "author": r.get("author"),
            "author_credentials": r.get("author_credentials"),
            "duration": r.get("duration"),
            "read_time": r.get("read_time"),
            "is_featured": r.get("is_featured", False),
        } for r in resources]
    except Exception as e:
        logger.error(f"Error getting resources: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/resources/categories")
async def get_resource_categories(language: str = "es"):
    """Get available resource categories with counts"""
    try:
        pipeline = [
            {"$match": {"language": language}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        result = await db.resources.aggregate(pipeline).to_list(100)
        
        categories_info = {
            "breathing": {"name_es": "Respiraciones", "name_en": "Breathing", "icon": "leaf"},
            "stretching": {"name_es": "Estiramientos", "name_en": "Stretching", "icon": "body"},
            "nutrition": {"name_es": "Nutrición", "name_en": "Nutrition", "icon": "nutrition"},
            "sleep": {"name_es": "Sueño", "name_en": "Sleep", "icon": "moon"},
            "mindfulness": {"name_es": "Mindfulness", "name_en": "Mindfulness", "icon": "flower"},
            "professional": {"name_es": "Consejos profesionales", "name_en": "Professional advice", "icon": "medkit"},
        }
        
        return [{
            "id": cat["_id"],
            "name": categories_info.get(cat["_id"], {}).get(f"name_{language}", cat["_id"]),
            "icon": categories_info.get(cat["_id"], {}).get("icon", "document"),
            "count": cat["count"]
        } for cat in result]
    except Exception as e:
        logger.error(f"Error getting resource categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/resources")
async def create_resource(resource: Resource):
    """Create a new resource (admin only)"""
    try:
        await db.resources.insert_one(resource.model_dump())
        return {"success": True, "id": resource.id}
    except Exception as e:
        logger.error(f"Error creating resource: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Seed some initial resources
@api_router.post("/resources/seed")
async def seed_resources():
    """Seed initial resources for testing"""
    try:
        # Delete existing resources first to allow re-seeding
        await db.resources.delete_many({})
        
        initial_resources = [
            {
                "id": str(uuid.uuid4()),
                "category": "breathing",
                "type": "video",
                "title": "Respiración diafragmática para el dolor",
                "description": "Técnica de respiración profunda que ayuda a reducir la tensión muscular y calmar el sistema nervioso.",
                "video_url": "https://www.youtube.com/watch?v=YRPh_GaiL8s",
                "thumbnail_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400",
                "author": "Fisioterapia Online",
                "author_credentials": "Fisioterapeutas especializados",
                "duration": "5:42",
                "language": "es",
                "is_featured": True,
                "order": 1,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "category": "stretching",
                "type": "video",
                "title": "Estiramientos suaves para fibromialgia",
                "description": "Rutina de estiramientos suaves diseñada específicamente para personas con fibromialgia.",
                "video_url": "https://www.youtube.com/watch?v=4pKly2JojMw",
                "thumbnail_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
                "author": "Fibromialgia Noticias",
                "author_credentials": "Especialistas en fibromialgia",
                "duration": "15:30",
                "language": "es",
                "is_featured": True,
                "order": 2,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "category": "mindfulness",
                "type": "video",
                "title": "Meditación guiada para el dolor crónico",
                "description": "Meditación de 10 minutos para ayudar a gestionar el dolor crónico con técnicas de mindfulness.",
                "video_url": "https://www.youtube.com/watch?v=inpok4MKVLM",
                "thumbnail_url": "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400",
                "author": "Mindfulness España",
                "author_credentials": "Instructores certificados de mindfulness",
                "duration": "10:00",
                "language": "es",
                "is_featured": False,
                "order": 3,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "category": "sleep",
                "type": "video",
                "title": "Técnicas para mejorar el sueño",
                "description": "Consejos y técnicas para mejorar la calidad del sueño cuando tienes dolor crónico.",
                "video_url": "https://www.youtube.com/watch?v=t0kACis_dJE",
                "thumbnail_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400",
                "author": "Salud y Bienestar",
                "author_credentials": "Especialistas en trastornos del sueño",
                "duration": "8:15",
                "language": "es",
                "is_featured": False,
                "order": 4,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "category": "professional",
                "type": "video",
                "title": "¿Qué es la fibromialgia? Explicación médica",
                "description": "Un profesional médico explica qué es la fibromialgia, sus síntomas y opciones de tratamiento.",
                "video_url": "https://www.youtube.com/watch?v=_4Vt88jIKAs",
                "thumbnail_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
                "author": "Dr. Medical",
                "author_credentials": "Reumatólogo",
                "duration": "12:45",
                "language": "es",
                "is_featured": False,
                "order": 5,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "category": "nutrition",
                "type": "video",
                "title": "Alimentación antiinflamatoria",
                "description": "Alimentos que pueden ayudar a reducir la inflamación y mejorar los síntomas de fibromialgia.",
                "video_url": "https://www.youtube.com/watch?v=Yv1v7-RFnNE",
                "thumbnail_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
                "author": "Nutrición Consciente",
                "author_credentials": "Nutricionistas especializados",
                "duration": "11:20",
                "language": "es",
                "is_featured": False,
                "order": 6,
                "created_at": datetime.utcnow()
            }
        ]
        
        await db.resources.insert_many(initial_resources)
        return {"message": "Resources seeded successfully", "count": len(initial_resources)}
    except Exception as e:
        logger.error(f"Error seeding resources: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== ROOT ENDPOINTS ==============

@api_router.get("/")
async def root():
    return {"message": "Ágora Mujeres API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
