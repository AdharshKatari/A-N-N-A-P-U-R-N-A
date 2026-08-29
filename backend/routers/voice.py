"""
Annapurna Vaani — Multilingual Speech-to-Speech Voice Assistant Router

Endpoints:
  POST /api/v5/voice/assistant   — Natural language agricultural assistant (Gemini + Fallback)
  GET  /api/v5/voice/synthesize  — TTS audio proxy for regional Indian languages
"""

import json
import logging
import os
import urllib.parse
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, Query, Response, HTTPException
from pydantic import BaseModel

from config import settings
from engines.vision import get_genai_client

logger = logging.getLogger("AnnapurnaVaani")
router = APIRouter(tags=["voice"])


class VoiceQueryRequest(BaseModel):
    query: str
    language: str = "te"  # 'te' (Telugu), 'hi' (Hindi), 'en' (English), 'mr' (Marathi), 'ta' (Tamil), 'kn' (Kannada)
    crop: Optional[str] = "Tomato"
    location: Optional[str] = "Nashik"
    latitude: Optional[float] = 19.9975
    longitude: Optional[float] = 73.7898
    farmer_context: Optional[Dict[str, Any]] = None


class VoiceAssistantResponse(BaseModel):
    spoken_text: str
    english_translation: str
    language: str
    action: Optional[str] = None
    action_label: Optional[str] = None
    suggested_followups: List[str] = []
    engine: Optional[str] = "gemini-2.5-flash"


LANGUAGE_NAMES = {
    "te": "Telugu (తెలుగు)",
    "hi": "Hindi (हिन्दी)",
    "en": "English",
    "mr": "Marathi (मराठी)",
    "ta": "Tamil (தமிழ்)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "bn": "Bengali (বাংলা)",
    "gu": "Gujarati (ગુજરાતી)",
}

FALLBACK_KNOWLEDGE: Dict[str, Dict[str, Dict[str, Any]]] = {
    "te": {
        "price": {
            "text": "ఈరోజు నాసిక్ మార్కెట్లో టమోటా క్వింటాల్ ధర ₹2,200 నుండి ₹2,500 వరకు ఉంది. ముంబై వాషి మార్కెట్లో ₹3,350 వరకు పలుకుతోంది. దూర మార్కెట్లకు రవాణా చేస్తే 40% ఎక్కువ లాభం పొందవచ్చు.",
            "en": "Today tomato prices in Nashik mandi range from ₹2,200 to ₹2,500 per quintal. In Vashi Mumbai it is reaching ₹3,350 with a 40% premium.",
            "action": "NAVIGATE_MARKET",
            "action_label": "మార్కెట్ ధరలు చూడండి (View Mandi Prices)",
            "followups": ["ముంబై మార్కెట్ ధర ఎంత?", "రవాణా ఖర్చు ఎంత అవుతుంది?"]
        },
        "weather": {
            "text": "నేడు వాతావరణం అనుకూలంగా ఉంది. ఉష్ణోగ్రత 28°C నుండి 32°C మధ్య ఉంటుంది. వర్షం వచ్చే అవకాశం 15% మాత్రమే. పంట కోత మరియు నిల్వకు అనుకూల సమయం.",
            "en": "Today weather is favorable. Temperature will be 28°C to 32°C with low 15% rain chance. Good time for harvest and transport.",
            "action": "NAVIGATE_WEATHER",
            "action_label": "వాతావరణ నివేదిక చూడండి (View Weather)",
            "followups": ["7 రోజుల సూచన", "రక్షణ చర్యలు"]
        },
        "disease": {
            "text": "పంటపై తెగులు లేదా మచ్చలు గమనిస్తే వెంటనే నాణ్యత స్కాన్ చేయండి. ప్రస్తుతం మీ టమోటా బ్యాచ్ నాణ్యత స్కోర్ 82% గా ఉంది. శిలీంధ్ర వ్యాప్తి లేదు.",
            "en": "If you notice spots or blight, run a quality scan. Currently your tomato batch quality is 82% with no active pathogen.",
            "action": "NAVIGATE_SCAN",
            "action_label": "పంట స్కాన్ ప్రారంభించండి (Scan Crop)",
            "followups": ["శిలీంధ్ర నివారణ ఎలా?", "నిల్వ ఉంచవచ్చా?"]
        },
        "default": {
            "text": "నమస్కారం! నేను అన్నపూర్ణ వాణిని. మీ ఈస్ట్ ఫీల్డ్ టమోటాలు (500 కిలోలు) మరియు నార్త్ ఫీల్డ్ ఉల్లిపాయల వివరాలు, మార్కెట్ ధరలు, వాతావరణం లేదా స్మార్ట్ మూవ్ కోసం నన్ను అడగండి.",
            "en": "Namaste! I am Annapurna Vaani. Ask me about your East Field tomatoes (500kg), North Field onions, mandi prices, weather, or Smart Move logistics.",
            "action": "NAVIGATE_SMART_MOVE",
            "action_label": "స్మార్ట్ మూవ్ సలహాలు (Smart Move)",
            "followups": ["ఈరోజు టమోటా ధర ఎంత?", "నా పంట పరిస్థితి ఎలా ఉంది?", "ఎప్పుడు అమ్మాలి?"]
        }
    },
    "hi": {
        "price": {
            "text": "आज नासिक मंडी में टमाटर का भाव ₹2,200 से ₹2,500 प्रति क्विंटल है। वाशी मुंबई में ₹3,350 का भाव मिल रहा है। दूर की मंडी में भेजने पर 40% अधिक मुनाफा होगा।",
            "en": "Today in Nashik mandi, tomato prices are ₹2,200 to ₹2,500 per quintal. Vashi Mumbai is fetching ₹3,350 with a 40% price premium.",
            "action": "NAVIGATE_MARKET",
            "action_label": "मंडी भाव देखें (View Mandi Prices)",
            "followups": ["नासिक मंडी भाव क्या है?", "फसल कब बेचनी चाहिए?"]
        },
        "weather": {
            "text": "आज मौसम साफ और अनुकूल रहेगा। तापमान 29°C से 33°C और बारिश की संभावना 15% है। फसल कटाई और परिवहन के लिए उत्तम दिन है।",
            "en": "Today the weather is clear and favorable. Temperature is 29°C to 33°C with 15% rain chance. Ideal day for harvest and dispatch.",
            "action": "NAVIGATE_WEATHER",
            "action_label": "मौसम पूर्वानुमान देखें (View Weather)",
            "followups": ["7 दिन का मौसम", "सिंचाई की सलाह"]
        },
        "disease": {
            "text": "आपकी ईस्ट फील्ड टमाटर की फसल का विजुअल स्कोर 82% है और कोई फंगल संक्रमण नहीं मिला है। फिर भी नियमित गुणवत्ता स्कैन करते रहें।",
            "en": "Your East Field tomato crop visual quality score is 82% with no fungal infection detected. Continue periodic scans.",
            "action": "NAVIGATE_SCAN",
            "action_label": "फसल स्कैन करें (Scan Crop)",
            "followups": ["दवा का छिड़काव कब करें?", "स्टोरेज लाइफ कितनी है?"]
        },
        "default": {
            "text": "नमस्ते! मैं अन्नपूर्णा वाणी हूँ। आपके खेतों के टमाटर (500 किग्रा), प्याज, आज के मंडी भाव, मौसम या स्मार्ट मूव ट्रांसपोर्ट के बारे में पूछिए।",
            "en": "Namaste! I am Annapurna Vaani. Ask me about your farm crops, live mandi rates, weather, or Smart Move transport recommendations.",
            "action": "NAVIGATE_SMART_MOVE",
            "action_label": "स्मार्ट मूव सलाह (Smart Move)",
            "followups": ["आज टमाटर का भाव क्या है?", "मेरी फसल की क्या स्थिति है?", "फसल कब बेचनी चाहिए?"]
        }
    },
    "mr": {
        "price": {
            "text": "आज नाशिक बाजार समितीत टोमॅटोचे दर ₹2,200 ते ₹2,500 प्रति क्विंटल आहेत. वाशी मुंबई मार्केटमध्ये ₹3,350 पर्यंत दर मिळतोय. दूरच्या बाजारात माल पाठवल्यास अधिक नफा होईल.",
            "en": "Today in Nashik APMC, tomato rates are ₹2,200 to ₹2,500 per quintal. Vashi Mumbai is reaching ₹3,350.",
            "action": "NAVIGATE_MARKET",
            "action_label": "बाजार भाव पहा (View Mandi Prices)",
            "followups": ["नाशिक बाजार भाव", "वाहतूक खर्च किती?"]
        },
        "default": {
            "text": "नमस्कार! मी अन्नपूर्णा वाणी आहे. आपल्या शेतातील पिके (टोमॅटो 500 किलो, कांदा), आजचे बाजार भाव, हवामान किंवा स्मार्ट मूव्हबद्दल काहीही विचारा.",
            "en": "Namaste! I am Annapurna Vaani. Ask me anything about your farm crops, market prices, weather, or transport recommendations.",
            "action": "NAVIGATE_SMART_MOVE",
            "action_label": "स्मार्ट मूव्ह सल्ला (Smart Move)",
            "followups": ["टोमॅटो बाजार भाव किती आहे?", "पिकाची प्रत कशी आहे?"]
        }
    },
    "en": {
        "price": {
            "text": "Today in Nashik Mandi, tomatoes are trading between ₹2,200 and ₹2,500 per quintal. Vashi Mumbai is fetching ₹3,350 with a ~40% premium. Distant transport yields maximum net profit.",
            "en": "Today in Nashik Mandi, tomatoes are trading between ₹2,200 and ₹2,500 per quintal. Vashi Mumbai is fetching ₹3,350 with a ~40% premium.",
            "action": "NAVIGATE_MARKET",
            "action_label": "View Mandi Prices",
            "followups": ["What is Vashi Mumbai price?", "What is the freight cost?"]
        },
        "weather": {
            "text": "Current weather in Nashik is 29°C with 62% humidity and only 15% chance of rain. Good conditions for harvesting and freight transport.",
            "en": "Current weather in Nashik is 29°C with 62% humidity and only 15% chance of rain. Good conditions for harvesting and freight transport.",
            "action": "NAVIGATE_WEATHER",
            "action_label": "View Weather Forecast",
            "followups": ["7-day forecast", "Heat alerts"]
        },
        "disease": {
            "text": "Your active East Field tomato batch has an 82% visual quality score with zero pathogen detected. Residual shelf life is estimated at 9 days.",
            "en": "Your active East Field tomato batch has an 82% visual quality score with zero pathogen detected. Residual shelf life is estimated at 9 days.",
            "action": "NAVIGATE_SCAN",
            "action_label": "Run Crop Scan",
            "followups": ["How to store safely?", "When to harvest next batch?"]
        },
        "default": {
            "text": "You are Ramesh Patel (Kisan ID: ANN-98234) located in Nashik, Maharashtra. You have 500kg of Roma Tomatoes in East Field and 1200kg of Red Onions in North Field under active telemetry.",
            "en": "You are Ramesh Patel (Kisan ID: ANN-98234) located in Nashik, Maharashtra. You have 500kg of Roma Tomatoes in East Field and 1200kg of Red Onions in North Field under active telemetry.",
            "action": "NAVIGATE_CROPS",
            "action_label": "View Farm Crops",
            "followups": ["What is today's tomato mandi price?", "How is my crop health?", "Should I sell locally or transport?"]
        }
    }
}


def _get_fallback_response(query: str, language: str) -> VoiceAssistantResponse:
    lang = language if language in FALLBACK_KNOWLEDGE else "en"
    kb = FALLBACK_KNOWLEDGE[lang]
    q_lower = query.lower()

    if any(w in q_lower for w in ["ధర", "రేటు", "మార్కెట్", "భావ", "भाव", "दाम", "मंडी", "price", "rate", "mandi", "cost", "market"]):
        item = kb["price"]
    elif any(w in q_lower for w in ["వాతావరణం", "వర్షం", "ఎండ", "मौसम", "बारिश", "तापमान", "weather", "rain", "forecast", "temp"]):
        item = kb["weather"]
    elif any(w in q_lower for w in ["తెగులు", "రోగం", "మచ్చలు", "స్కాన్", "रोग", "बीमारी", "दाग", "स्कैन", "disease", "scan", "rot", "blight"]):
        item = kb["disease"]
    else:
        item = kb["default"]

    return VoiceAssistantResponse(
        spoken_text=item["text"],
        english_translation=item["en"],
        language=language,
        action=item.get("action"),
        action_label=item.get("action_label"),
        suggested_followups=item.get("followups", []),
    )


async def _query_inworld_ai(query_text: str, system_context: str, lang_code: str) -> Optional[Dict[str, Any]]:
    """
    Inworld AI LLM Router — OpenAI-compatible /v1/chat/completions endpoint.
    Uses Basic Auth with the INWORLD_BASE64_AUTH credential.
    Supports 220+ models via Inworld's unified gateway.
    """
    import base64
    base64_auth = os.getenv("INWORLD_BASE64_AUTH")
    if not base64_auth:
        key = settings.INWORLD_API_KEY or os.getenv("INWORLD_API_KEY", "")
        secret = settings.INWORLD_API_SECRET or os.getenv("INWORLD_API_SECRET", "")
        if key and secret:
            base64_auth = base64.b64encode(f"{key}:{secret}".encode()).decode()
        elif key:
            base64_auth = key

    if not base64_auth:
        return None

    try:
        # Inworld AI OpenAI-compatible Chat Completions endpoint
        inworld_url = "https://api.inworld.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Basic {base64_auth}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {"role": "system", "content": system_context},
                {"role": "user", "content": f"Farmer says: {query_text}"},
            ],
            "temperature": 0.3,
            "max_tokens": 400,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(inworld_url, json=payload, headers=headers)
            logger.info(f"Inworld AI response status: {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if content:
                    # Parse the JSON response from the LLM
                    clean = content.strip()
                    if clean.startswith("```json"):
                        clean = clean.split("```json")[1].split("```")[0].strip()
                    elif clean.startswith("```"):
                        clean = clean.split("```")[1].split("```")[0].strip()
                    parsed = json.loads(clean)
                    return {
                        "spoken_text": parsed.get("spoken_text", content),
                        "english_translation": parsed.get("english_translation", content),
                        "action": parsed.get("action"),
                        "action_label": parsed.get("action_label"),
                        "suggested_followups": parsed.get("suggested_followups", []),
                    }
            else:
                logger.warning(f"Inworld AI returned {res.status_code}: {res.text[:300]}")
    except json.JSONDecodeError as e:
        logger.warning(f"Inworld AI JSON parse error: {e}")
    except Exception as e:
        logger.warning(f"Inworld AI call error: {e}")
    return None


@router.post("/api/v5/voice/assistant", response_model=VoiceAssistantResponse)
async def voice_assistant(req: VoiceQueryRequest):
    """
    Multilingual Agronomy Voice Assistant with Inworld AI + Gemini 2.5 Flash + Complete Farmer Context.
    Understands and speaks Telugu, Hindi, English, Marathi, Tamil, Kannada.
    """
    target_lang_name = LANGUAGE_NAMES.get(req.language, "Telugu")
    query_text = req.query.strip()
    if not query_text:
        return _get_fallback_response("hello", req.language)

    # Build Comprehensive Live Farmer Context
    farmer_ctx = req.farmer_context or {}
    crop_info = req.crop or "Tomato (Hybrid Roma)"
    location_info = req.location or "Madanapalle, Andhra Pradesh"
    active_batches_summary = (
        farmer_ctx.get("batches_summary") or 
        "Active batches: 1. Tomato (Madanapalle Plot 1, 500kg, Sown: 15 July, Ripeness: Turning Pink/Firm, Quality: 88%, Shelf-life: 8 days, No Pathogen); 2. Red Onion (North Plot, 1200kg, Harvest Ready, Quality: 91%)."
    )
    mandi_summary = (
        farmer_ctx.get("mandi_summary") or 
        "Live APMC Mandi Rates: Madanapalle APMC: ₹2,800/qtl (Rising +12%); Kolar Mandi: ₹2,650/qtl; Chennai APMC: ₹3,400/qtl (+30% premium); Bangalore Market: ₹3,200/qtl."
    )
    weather_summary = (
        farmer_ctx.get("weather_summary") or 
        "Current Weather in Madanapalle: 22°C, 75% humidity, overcast clouds, 20% precipitation chance, favorable harvest conditions."
    )
    logistics_summary = (
        farmer_ctx.get("logistics_summary") or 
        "Smart Move Recommendation: Send to Chennai APMC / Bangalore Terminal for maximum profit. Net profit gain is +₹16,200."
    )

    system_context = (
        f"You are Annapurna Vaani (అన్నపూర్ణ వాణి / अन्नपूर्णा वाणी), the conversational AI assistant for Indian farmers. "
        f"You have FULL REAL-TIME ACCESS to all farm records for this farmer:\n"
        f"- Farmer Name: Ramesh Patel (Kisan ID: ANN-98234)\n"
        f"- Location: {location_info} ({req.latitude}, {req.longitude})\n"
        f"- Farmer's Active Crops & Batches: {active_batches_summary}\n"
        f"- Live Regional Mandi Prices: {mandi_summary}\n"
        f"- Live Microclimate & Weather: {weather_summary}\n"
        f"- Best Logistics Decision: {logistics_summary}\n\n"
        f"Language requirement: Respond in authentic, natural, conversational {target_lang_name} (language code: {req.language}).\n"
        f"STRICT RULES:\n"
        f"1. NEVER say 'Hello! I am Annapurna Vaani' or introduce yourself repeatedly. Jump straight into the direct answer or advice.\n"
        f"2. Speak naturally like an experienced agricultural friend and expert.\n"
        f"3. When asked about what you know about the farmer, tell them about their farm, crops (Tomatoes, Onions), land in Nashik, and active batches.\n"
        f"4. Keep the spoken response concise (under 45 words) so it is clear and quick when spoken aloud.\n"
        f"5. Provide the English translation as well.\n"
        f"6. Assign the best navigation action: 'NAVIGATE_MARKET' (for price/rates), 'NAVIGATE_SCAN' (for health/disease/quality), 'NAVIGATE_WEATHER' (for weather/rain), 'NAVIGATE_SMART_MOVE' (for transport/selling), or 'NAVIGATE_CROPS' (for batch tracking).\n"
        f"7. Output STRICTLY JSON matching this schema: "
        f'{{"spoken_text": "...", "english_translation": "...", "action": "NAVIGATE_MARKET" | "NAVIGATE_SCAN" | "NAVIGATE_WEATHER" | "NAVIGATE_SMART_MOVE" | "NAVIGATE_CROPS" | null, "action_label": "short button label", "suggested_followups": ["followup 1", "followup 2"]}}'
    )

    # 1. Direct High-Speed Async Gemini Multimodal Engine
    client = get_genai_client()
    if client:
        # Prioritize fastest lightweight flash models with token limits
        for candidate_model in ["gemini-2.5-flash", "gemini-flash-latest"]:
            try:
                # Use non-blocking async call
                response = await client.aio.models.generate_content(
                    model=candidate_model,
                    contents=[f"Farmer question: {query_text}"],
                    config={
                        "system_instruction": system_context,
                        "response_mime_type": "application/json",
                        "temperature": 0.2,
                        "max_output_tokens": 600,
                    },
                )

                if response and response.text:
                    clean_text = response.text.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text.split("```json")[1].split("```")[0].strip()
                    elif clean_text.startswith("```"):
                        clean_text = clean_text.split("```")[1].split("```")[0].strip()
                    data = json.loads(clean_text)
                    if data.get("spoken_text"):
                        return VoiceAssistantResponse(
                            spoken_text=data["spoken_text"],
                            english_translation=data.get("english_translation", data["spoken_text"]),
                            language=req.language,
                            action=data.get("action"),
                            action_label=data.get("action_label"),
                            suggested_followups=data.get("suggested_followups", []),
                            engine=candidate_model
                        )
            except Exception as e:
                logger.warning(f"Candidate model {candidate_model} error: {e}")
                continue

    # 3. Dynamic Knowledge Engine Fallback
    return _get_fallback_response(query_text, req.language)


@router.get("/api/v5/voice/synthesize")
async def synthesize_speech(
    text: str = Query(..., description="Text to synthesize"),
    lang: str = Query("te", description="Language code (e.g. te, hi, en, mr, ta, kn)"),
):
    """
    Streams TTS audio bytes from Google Speech proxy for regional Indian languages.
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    encoded_text = urllib.parse.quote(text.strip()[:200])
    google_tts_url = (
        f"https://translate.google.com/translate_tts?ie=UTF-8&tl={lang}&client=tw-ob&q={encoded_text}"
    )

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(google_tts_url, headers=headers)
            if resp.status_code == 200 and len(resp.content) > 100:
                return Response(
                    content=resp.content,
                    media_type="audio/mpeg",
                    headers={
                        "Cache-Control": "public, max-age=86400",
                        "Content-Disposition": "inline; filename=speech.mp3",
                    },
                )
    except Exception as e:
        logger.warning(f"TTS synthesis stream failed: {e}")

    raise HTTPException(status_code=502, detail="TTS service temporarily unavailable")
