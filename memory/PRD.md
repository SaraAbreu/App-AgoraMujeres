# Ágora Mujeres - Product Requirements Document

## Overview
Ágora Mujeres is a therapeutic companion mobile app specifically designed for women living with fibromyalgia. The app provides emotional support, daily journaling, and AI-powered conversation with a warm, empathetic virtual companion named Aurora.

## Core Philosophy
- **Privacy-first**: All data stored locally and encrypted
- **Non-invasive AI**: Conversations are warm, supportive - never clinical or prescriptive
- **Therapeutic design**: Soft, calming aesthetics creating a sense of refuge
- **No medical advice**: The app accompanies and supports, never diagnoses

## Technical Stack
- **Frontend**: React Native with Expo
- **Backend**: FastAPI with MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Payments**: Stripe (live keys configured)
- **Languages**: Spanish (default), English

## MVP Features

### 1. Emotional & Physical Diary (Priority: HIGH)
- Free-form text entries
- Soft emotional state tracking (calma, fatiga, niebla mental, dolor difuso, gratitud, tensión) - 0-5 scale
- Optional physical state (dolor, energía, sensibilidad) - 0-10 scale
- Weather integration for context
- Local pattern analysis

### 2. AI Companion (Aurora) (Priority: HIGH)
- Warm, empathetic conversation
- Spanish and English support
- Gentle suggestions (breathing, stretching, rest)
- Never gives medical advice
- Session tracked for trial period

### 3. Pattern Analysis (Priority: MEDIUM)
- Weekly emotional trends
- Physical state averages
- Common words/themes
- All processed locally

### 4. Subscription System (Priority: HIGH)
- 2-hour free trial (usage-based)
- 10€/month subscription via Stripe
- Trial countdown visible in settings

### 5. Weather Integration (Priority: LOW)
- Open-Meteo API (free)
- Temperature, humidity, pressure
- Linked to diary entries

### 6. Cycle Tracking (Priority: LOW)
- Basic date tracking
- No medical interpretation

## API Endpoints

### Diary
- `POST /api/diary` - Create diary entry
- `GET /api/diary/{device_id}` - Get entries
- `GET /api/diary/{device_id}/patterns` - Get patterns

### Chat
- `POST /api/chat` - Send message to Aurora
- `GET /api/chat/{device_id}/history` - Get chat history

### Subscription
- `GET /api/subscription/{device_id}` - Get status
- `POST /api/subscription/create-customer` - Create Stripe customer
- `POST /api/subscription/create-payment-intent` - Create payment intent
- `POST /api/subscription/activate` - Activate subscription

### Cycle
- `POST /api/cycle` - Create cycle entry
- `GET /api/cycle/{device_id}` - Get cycle entries

### Weather
- `GET /api/weather?lat={lat}&lon={lon}` - Get current weather

## Data Models

### DiaryEntry
- id, device_id, texto, emotional_state, physical_state, weather, created_at

### ChatMessage
- id, device_id, role, content, created_at

### SubscriptionStatus
- device_id, stripe_customer_id, subscription_id, status, trial_start, trial_end, usage_seconds

### CycleEntry
- id, device_id, start_date, end_date, notes, created_at

## Color Palette (Therapeutic)
- Primary: #B8A9C9 (Soft lavender)
- Secondary: #E8D5D5 (Warm blush)
- Accent: #C1D9C6 (Sage green)
- Background: #FDFBF9 (Warm cream)
- Text: #4A4A4A (Warm charcoal)

## Status: MVP COMPLETE

### Working Features:
- ✅ Home screen with quick actions
- ✅ Emotional diary with sliders
- ✅ Physical state tracking (optional)
- ✅ AI chat with Aurora (GPT-5.2)
- ✅ Pattern analysis
- ✅ Multi-language (ES/EN)
- ✅ Weather integration
- ✅ Subscription system with Stripe
- ✅ Trial tracking (2 hours)

### Next Steps:
- [ ] Cycle tracking UI implementation
- [ ] Push notifications for gentle reminders
- [ ] Offline mode improvements
- [ ] Dark mode support (optional)
