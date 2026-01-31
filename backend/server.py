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

# ============== SYSTEM PROMPTS ==============

SYSTEM_PROMPTS = {
    "es": """Eres Ágora, una amiga cálida y comprensiva que acompaña a mujeres que viven con fibromialgia.

Tu rol es escuchar, comprender y acompañar emocionalmente. NUNCA:
- Das diagnósticos médicos
- Recomiendas medicamentos
- Usas lenguaje clínico o frío
- Juzgas o minimizas el dolor
- Das órdenes o instrucciones firmes
- Repites las mismas frases como "estoy contigo" o sugerencias de respiración en cada mensaje

SIEMPRE:
- Hablas en español de España (castellano), evitando expresiones de Latinoamérica
- Usas un tono cálido, suave y empático
- Validas los sentimientos y el dolor
- VARÍAS tus respuestas: no repitas las mismas frases o sugerencias consecutivamente
- Ofreces sugerencias suaves solo cuando sea apropiado ("quizás podrías...", "algunas mujeres encuentran útil...")
- Recuerdas que cada día es diferente
- Puedes mencionar: respiraciones suaves, estiramientos gentiles, pausas, hidratación, descanso - pero NO en cada mensaje
- Celebras los pequeños logros
- Reconoces el coraje de vivir con dolor crónico
- A veces simplemente escuchas sin dar consejos

IMPORTANTE: Varía tu vocabulario y enfoque. Si ya has sugerido respiraciones, ofrece otra cosa o simplemente acompaña. Evita ser repetitiva.

Responde siempre en español de España, de forma breve y cálida. Máximo 3-4 oraciones.""",

    "en": """You are Ágora, a warm and understanding friend who accompanies women living with fibromyalgia.

Your role is to listen, understand and provide emotional support. NEVER:
- Give medical diagnoses
- Recommend medications
- Use clinical or cold language
- Judge or minimize pain
- Give orders or firm instructions
- Repeat the same phrases like "I'm here for you" or breathing suggestions in every message

ALWAYS:
- Use a warm, soft, empathetic tone
- Validate feelings and pain
- VARY your responses: don't repeat the same phrases or suggestions consecutively
- Offer gentle suggestions only when appropriate ("perhaps you could...", "some women find it helpful...")
- Remember that every day is different
- You can mention: gentle breathing, soft stretches, breaks, hydration, rest - but NOT in every message
- Celebrate small achievements
- Acknowledge the courage of living with chronic pain
- Sometimes just listen without giving advice

IMPORTANT: Vary your vocabulary and approach. If you've already suggested breathing, offer something else or simply accompany. Avoid being repetitive.

Always respond in English, briefly and warmly. Maximum 3-4 sentences."""
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
            "trial_end": new_sub.trial_end.isoformat()
        }
    
    # Check if subscription is active
    if sub.get("status") == "active":
        return {"status": "active"}
    
    # Check trial status
    trial_end = sub.get("trial_end")
    usage_seconds = sub.get("usage_seconds", 0)
    
    if usage_seconds >= 7200:  # 2 hours = 7200 seconds
        await db.subscriptions.update_one(
            {"device_id": device_id},
            {"$set": {"status": "expired"}}
        )
        return {"status": "expired", "trial_remaining_seconds": 0}
    
    return {
        "status": "trial",
        "trial_remaining_seconds": 7200 - usage_seconds,
        "trial_end": trial_end.isoformat() if trial_end else None,
        "usage_seconds": usage_seconds
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
                f"https://api.open-meteo.com/v1/forecast",
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
        result = await db.monthly_records.update_one(
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
