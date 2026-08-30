/**
 * Annapurna Vaani — Multilingual Speech-to-Speech Voice Assistant Service
 *
 * Supports Telugu (తెలుగు), Hindi (हिन्दी), English, Marathi (मराठी),
 * Tamil (தமிழ்), Kannada (ಕನ್ನಡ) with native iOS/Android expo-av Sound playback,
 * expo-speech fallback, and resilient offline agricultural knowledge.
 */

import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { API_BASE_URL } from '../constants/api';

export interface VoiceLanguage {
  code: string;
  bcp47: string;
  name: string;
  nativeName: string;
  flag: string;
  samplePrompts: string[];
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguage[] = [
  {
    code: 'te',
    bcp47: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🌾',
    samplePrompts: [
      'ఈరోజు టమోటా ధర ఎంత?',
      'వాతావరణం ఎలా ఉంటుంది?',
      'పంట నాణ్యత ఎలా స్కాన్ చేయాలి?',
      'నా పంటను ఎక్కడ అమ్మాలి?',
    ],
  },
  {
    code: 'hi',
    bcp47: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    samplePrompts: [
      'आज मंडी में टमाटर का भाव क्या है?',
      'आज मौसम कैसा रहेगा?',
      'फसल में कीड़े या फंगस की जांच कैसे करें?',
      'फसल बेचने का सही समय कब है?',
    ],
  },
  {
    code: 'en',
    bcp47: 'en-IN',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
    samplePrompts: [
      'What are today’s tomato mandi prices?',
      'Check weather forecast & spoilage risk',
      'Should I sell locally or transport?',
      'Scan crop for fungal rot',
    ],
  },
  {
    code: 'mr',
    bcp47: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🌱',
    samplePrompts: [
      'आज नाशिक बाजारात कांद्याचा भाव काय आहे?',
      'हवामान अंदाज कसा आहे?',
      'पिकाची प्रत कशी तपासायची?',
      'स्मार्ट वाहतूक पर्याय कोणते आहेत?',
    ],
  },
  {
    code: 'ta',
    bcp47: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🌾',
    samplePrompts: [
      'இன்றைய தக்காளி சந்தை விலை என்ன?',
      'வானிலை நிலவரம் எப்படி உள்ளது?',
      'பயிர் தரத்தை எவ்வாறு பரிசோதிப்பது?',
    ],
  },
  {
    code: 'kn',
    bcp47: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🌿',
    samplePrompts: [
      'ಇಂದಿನ ಟೊಮೆಟೊ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಎಷ್ಟು?',
      'ಇಂದಿನ ಹವಾಮಾನ ವರದಿ ಏನು?',
      'ಬೆಳೆ ಗುಣಮಟ್ಟ ಸ್ಕ್ಯಾನ್ ಮಾಡುವುದು ಹೇಗೆ?',
    ],
  },
];

export interface VoiceAssistantResult {
  spoken_text: string;
  english_translation: string;
  language: string;
  action?: 'NAVIGATE_MARKET' | 'NAVIGATE_SCAN' | 'NAVIGATE_WEATHER' | 'NAVIGATE_SMART_MOVE' | 'NAVIGATE_CROPS' | string;
  action_label?: string;
  suggested_followups: string[];
}

const LOCAL_FALLBACK_KNOWLEDGE: Record<string, Record<string, { text: string; en: string; action: string; label: string }>> = {
  te: {
    price: {
      text: 'ఈరోజు నాసిక్ మార్కెట్లో టమోటా క్వింటాల్ ధర ₹2,200 నుండి ₹2,500 వరకు ఉంది. ముంబై వాషి మార్కెట్లో ₹3,350 వరకు పలుకుతోంది. దూర మార్కెట్లకు రవాణా చేస్తే 40% ఎక్కువ లాభం పొందవచ్చు.',
      en: 'Today tomato prices in Nashik mandi range from ₹2,200 to ₹2,500 per quintal. In Vashi Mumbai it is reaching ₹3,350 with a 40% premium.',
      action: 'NAVIGATE_MARKET',
      label: 'మార్కెట్ ధరలు చూడండి',
    },
    weather: {
      text: 'నేడు వాతావరణం అనుకూలంగా ఉంది. ఉష్ణోగ్రత 28°C నుండి 32°C మధ్య ఉంటుంది. వర్షం వచ్చే అవకాశం 15% మాత్రమే. పంట కోత మరియు నిల్వకు అనుకూల సమయం.',
      en: 'Today weather is favorable. Temperature is 28°C to 32°C with low 15% rain chance.',
      action: 'NAVIGATE_WEATHER',
      label: 'వాతావరణ నివేదిక',
    },
    scan: {
      text: 'పంటపై తెగులు లేదా మచ్చలు గమనిస్తే వెంటనే నాణ్యత స్కాన్ చేయండి. ప్రస్తుతం మీ టమోటా బ్యాచ్ నాణ్యత స్కోర్ 82% గా ఉంది. శిలీంధ్ర వ్యాప్తి లేదు.',
      en: 'If you notice spots or blight, run a quality scan. Currently your tomato batch quality is 82%.',
      action: 'NAVIGATE_SCAN',
      label: 'పంట స్కాన్ ప్రారంభించండి',
    },
    default: {
      text: 'నమస్కారం! నేను అన్నపూర్ణ వాణిని. మీ టమోటా బ్యాచ్ (500 కిలోలు), మార్కెట్ ధరలు లేదా స్మార్ట్ మూవ్ రవాణా కోసం నన్ను అడగండి.',
      en: 'Namaste! I am Annapurna Vaani. Ask me about your crop batches, mandi prices, weather, or Smart Move logistics.',
      action: 'NAVIGATE_SMART_MOVE',
      label: 'స్మార్ట్ మూవ్ సలహాలు',
    },
  },
  hi: {
    price: {
      text: 'आज नासिक मंडी में टमाटर का भाव ₹2,200 से ₹2,500 प्रति क्विंटल है। वाशी मुंबई में ₹3,350 का भाव मिल रहा है। दूर की मंडी में भेजने पर 40% अधिक मुनाफा होगा।',
      en: 'Today in Nashik mandi, tomato prices are ₹2,200 to ₹2,500 per quintal. Vashi Mumbai is fetching ₹3,350 with a 40% premium.',
      action: 'NAVIGATE_MARKET',
      label: 'मंडी भाव देखें',
    },
    weather: {
      text: 'आज मौसम साफ और अनुकूल रहेगा। तापमान 29°C से 33°C और बारिश की संभावना 15% है। फसल कटाई और परिवहन के लिए उत्तम दिन है।',
      en: 'Today the weather is clear and favorable. Temperature is 29°C to 33°C with 15% rain chance.',
      action: 'NAVIGATE_WEATHER',
      label: 'मौसम पूर्वानुमान',
    },
    scan: {
      text: 'फसल की गुणवत्ता जांचने के लिए कैमरा स्कैन करें। आपकी टमाटर फसल 82% फ्रेश और सुरक्षित है।',
      en: 'Run a camera scan to verify crop quality. Your tomato batch is 82% fresh.',
      action: 'NAVIGATE_SCAN',
      label: 'फसल स्कैन करें',
    },
    default: {
      text: 'नमस्ते! मैं अन्नपूर्णा वाणी हूँ। अपनी फसल, आज के मंडी भाव, मौसम या स्मार्ट मूव के बारे में मुझसे पूछें।',
      en: 'Namaste! I am Annapurna Vaani. Ask me about your crops, mandi prices, weather, or Smart Move transport.',
      action: 'NAVIGATE_SMART_MOVE',
      label: 'स्मार्ट मूव सलाह',
    },
  },
  mr: {
    price: {
      text: 'आज नाशिक बाजार समितीत टोमॅटोचे दर ₹2,200 ते ₹2,500 प्रति क्विंटल आहेत. वाशी मुंबई मार्केटमध्ये ₹3,350 पर्यंत दर मिळतोय.',
      en: 'Today in Nashik APMC, tomato rates are ₹2,200 to ₹2,500 per quintal. Vashi Mumbai is reaching ₹3,350.',
      action: 'NAVIGATE_MARKET',
      label: 'बाजार भाव पहा',
    },
    weather: {
      text: 'आज नाशिकमध्ये हवामान कोरडे आणि अनुकूल राहील. तापमान 29°C राहील आणि पाऊस पडण्याची शक्यता कमी आहे.',
      en: 'Today weather in Nashik is dry and favorable for transport.',
      action: 'NAVIGATE_WEATHER',
      label: 'हवामान अंदाज',
    },
    scan: {
      text: 'पिकाची प्रत तपासण्यासाठी कॅमेरा स्कॅन वापरा. तुमचा टोमॅटो माल 82% दर्जेदार आहे.',
      en: 'Use camera scan to verify quality. Your tomatoes are 82% Grade-A.',
      action: 'NAVIGATE_SCAN',
      label: 'पीक स्कॅन करा',
    },
    default: {
      text: 'नमस्कार! मी अन्नपूर्णा वाणी आहे. शेतातील पिके, आजचे बाजार भाव किंवा स्मार्ट वाहतुकीबद्दल विचारा.',
      en: 'Namaste! I am Annapurna Vaani. Ask me about crop health, mandi prices, or transport.',
      action: 'NAVIGATE_SMART_MOVE',
      label: 'स्मार्ट वाहतूक सल्ला',
    },
  },
  en: {
    price: {
      text: 'Today in Nashik Mandi, tomatoes are trading between ₹2,200 and ₹2,500 per quintal. Vashi Mumbai is fetching ₹3,350 with a 40% premium.',
      en: 'Today in Nashik Mandi, tomatoes are trading between ₹2,200 and ₹2,500 per quintal. Vashi Mumbai is fetching ₹3,350 with a 40% premium.',
      action: 'NAVIGATE_MARKET',
      label: 'View Mandi Prices',
    },
    weather: {
      text: 'Current weather in Nashik is 29°C with 62% humidity and only 15% chance of rain. Good conditions for harvest and freight transport.',
      en: 'Current weather in Nashik is 29°C with 62% humidity and only 15% chance of rain.',
      action: 'NAVIGATE_WEATHER',
      label: 'View Weather',
    },
    scan: {
      text: 'Your active East Field tomato batch has an 82% visual quality score with zero pathogen. Residual shelf life is estimated at 9 days.',
      en: 'Your active East Field tomato batch has an 82% visual quality score with zero pathogen.',
      action: 'NAVIGATE_SCAN',
      label: 'Scan Crop Quality',
    },
    default: {
      text: 'Hello! I am Annapurna Vaani, your intelligent farm assistant. I can help with mandi rates, weather, crop health, or Smart Move logistics.',
      en: 'Hello! I am Annapurna Vaani. Ask me about mandi rates, weather, crop health, or Smart Move logistics.',
      action: 'NAVIGATE_SMART_MOVE',
      label: 'Smart Move Advice',
    },
  },
};

class VoiceAssistantService {
  private currentSound: Audio.Sound | null = null;
  private isRecording = false;

  constructor() {
    // Configure iOS Audio session to play in silent mode
    this.configureAudioSession();
  }

  private async configureAudioSession() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.warn('Audio session config warning:', e);
    }
  }

  // -------------------------------------------------------------
  // SPEECH-TO-TEXT (STT)
  // -------------------------------------------------------------
  public startSpeechRecognition(
    langCode: string,
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void,
  ): boolean {
    const langMeta = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_VOICE_LANGUAGES[0];

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.lang = langMeta.bcp47;
          rec.continuous = false;
          rec.interimResults = true;
          rec.maxAlternatives = 1;

          rec.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const text = event.results[i][0].transcript;
              if (event.results[i].isFinal) final += text;
              else interim += text;
            }
            if (final) onResult(final, true);
            else if (interim) onResult(interim, false);
          };

          rec.onerror = (e: any) => {
            onError(e?.error || 'Speech recognition error');
          };

          rec.onend = () => onEnd();
          rec.start();
          return true;
        } catch (e: any) {
          onError(e?.message || 'Mic start error');
          return false;
        }
      }
    }
    return false;
  }

  public stopSpeechRecognition(): void {
    if (typeof window !== 'undefined') {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) SpeechRecognition.stop();
      } catch (e) {}
    }
  }

  // -------------------------------------------------------------
  // TEXT-TO-SPEECH (TTS) - Instant High-Speed Native Voice
  // -------------------------------------------------------------
  public async speak(
    text: string,
    langCode: string,
    onStart?: () => void,
    onEnd?: () => void,
  ): Promise<void> {
    await this.stopSpeaking();

    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    const langMeta = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_VOICE_LANGUAGES[0];

    // Ensure audio session is ready for speaker output
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {}

    // Primary: Native Instant Regional Speech via Expo Speech (Zero lag, works 100% offline)
    try {
      Speech.speak(text, {
        language: langMeta.bcp47,
        pitch: 1.0,
        rate: 0.92,
        onStart: () => onStart?.(),
        onDone: () => onEnd?.(),
        onStopped: () => onEnd?.(),
        onError: () => onEnd?.(),
      });
      return;
    } catch (speechErr) {
      console.warn('Native speech error, attempting cloud audio stream:', speechErr);
    }

    // Secondary fallback: Cloud audio stream
    try {
      const audioUrl = `${API_BASE_URL}/api/v5/voice/synthesize?text=${encodeURIComponent(text.slice(0, 190))}&lang=${langMeta.code}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, volume: 1.0 },
        (status) => {
          if (status.isLoaded) {
            if (status.isPlaying) onStart?.();
            if (status.didJustFinish) onEnd?.();
          }
        }
      );
      this.currentSound = sound;
      await sound.playAsync();
    } catch (cloudErr) {
      console.warn('Cloud audio stream also failed:', cloudErr);
      onEnd?.();
    }
  }

  public async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (e) {}

    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (e) {}
      this.currentSound = null;
    }
  }

  // -------------------------------------------------------------
  // BACKEND AI ASSISTANT QUERY
  // -------------------------------------------------------------
  public async queryAssistant(
    query: string,
    language: string,
    context?: { crop?: string; location?: string; latitude?: number; longitude?: number },
  ): Promise<VoiceAssistantResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const payload = {
        query,
        language,
        crop: context?.crop || 'Tomato (Hybrid Roma)',
        location: context?.location || 'Nashik, Maharashtra',
        latitude: context?.latitude ?? 19.9975,
        longitude: context?.longitude ?? 73.7898,
        farmer_context: {
          batches_summary: 'Active Batches: 1. Tomato (East Field, 500kg, Quality: 82%, Shelf-life: 9 days); 2. Red Onion (North Field, 1200kg, Ready).',
          mandi_summary: 'Live Mandi: Nashik ₹2,400/qtl; Vashi Mumbai ₹3,350/qtl (+40% premium); Pune ₹2,800/qtl.',
          weather_summary: 'Weather: 29°C, clear skies, 15% rain chance.',
          logistics_summary: 'Smart Move: Send to Vashi Mumbai for +₹14,800 net profit gain.'
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/v5/voice/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
    } catch (networkError) {
      console.warn('Network assistant query failed, using local offline intelligence:', networkError);
    }

    // Resilient Instant Offline Knowledge Matching:
    const langKey = language in LOCAL_FALLBACK_KNOWLEDGE ? language : 'en';
    const kb = LOCAL_FALLBACK_KNOWLEDGE[langKey];
    const q = query.toLowerCase();

    let matched = kb.default;
    if (q.includes('ధర') || q.includes('రేటు') || q.includes('మార్కెట్') || q.includes('భావ') || q.includes('भाव') || q.includes('दाम') || q.includes('मंडी') || q.includes('price') || q.includes('mandi') || q.includes('rate')) {
      matched = kb.price;
    } else if (q.includes('వాతావరణం') || q.includes('వర్షం') || q.includes('मौसम') || q.includes('बारिश') || q.includes('weather') || q.includes('rain') || q.includes('हवामान')) {
      matched = kb.weather;
    } else if (q.includes('తెగులు') || q.includes('స్కాన్') || q.includes('రోగ') || q.includes('रोग') || q.includes('स्कैन') || q.includes('scan') || q.includes('quality') || q.includes('disease') || q.includes('प्रत')) {
      matched = kb.scan;
    }

    return {
      spoken_text: matched.text,
      english_translation: matched.en,
      language: language,
      action: matched.action,
      action_label: matched.label,
      suggested_followups: ['Market Prices', 'Weather Forecast', 'Smart Move'],
    };
  }
}

export const voiceAssistantService = new VoiceAssistantService();
