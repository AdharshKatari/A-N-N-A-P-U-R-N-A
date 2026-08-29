/**
 * Annapurna Multilingual Translation Dictionary
 * 
 * Provides comprehensive translations across Telugu, Hindi, Marathi, English, Tamil, and Kannada.
 */

export type SupportedLanguage = 'te' | 'hi' | 'mr' | 'en' | 'ta' | 'kn';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  greeting: string;
  subtext: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🌾',
    greeting: 'నమస్కారం, రైతు మిత్రమా',
    subtext: 'మీ పంటను సులభంగా నిర్వహించండి',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    greeting: 'नमस्ते, किसान भाई',
    subtext: 'फसल की सही कीमत और सुरक्षा',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🌱',
    greeting: 'नमस्कार, शेतकरी बांधवांनो',
    subtext: 'उत्तम शेती आणि स्मार्ट बाजार',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
    greeting: 'Welcome, Farmer',
    subtext: 'Smart crop tracking & market logistics',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🌾',
    greeting: 'வணக்கம், விவசாயி தோழரே',
    subtext: 'பயிர் கண்காணிப்பு மற்றும் சந்தை',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🌿',
    greeting: 'ನಮಸ್ಕಾರ, ರೈತ ಮಿತ್ರರೆ',
    subtext: 'ಬೆಳೆ ನಿರ್ವಹಣೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ',
  },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  te: {
    // App & Header
    app_name: 'అన్నపూర్ణ',
    greeting_farmer: 'శుభోదయం, రైతు మిత్రమా',
    greeting_sub: 'విత్తనం నుండి అమ్మకం వరకు ప్రతి పంటను ట్రాక్ చేయండి',
    select_language: 'మీ ప్రాధాన్య భాషను ఎంచుకోండి',
    select_language_sub: 'మీకు అనుకూలమైన భాషలో యాప్‌ను ఉపయోగించండి',
    continue: 'ముందుకు సాగండి',
    save_changes: 'మార్పులను సేవ్ చేయండి',
    change_language: 'భాషను మార్చండి',

    // Navigation Tabs
    tab_home: 'హోమ్',
    tab_crops: 'పంటలు',
    tab_scan: 'స్కాన్',
    tab_smart_move: 'స్మార్ట్ మూవ్',
    tab_market: 'మార్కెట్',
    tab_profile: 'ప్రొఫైల్',

    // Quick Actions
    action_add_crop: 'పంటను చేర్చండి',
    action_scan_crop: 'పంట నాణ్యత స్కాన్',
    action_smart_move: 'స్మార్ట్ మూవ్ సలహా',
    action_view_market: 'మార్కెట్ ధరలు',
    action_satellite_map: 'ఉపగ్రహ ఫీల్డ్ మ్యాప్',

    // Dashboard Cards
    card_active_crops: 'ప్రస్తుత పంటలు',
    card_weather_cond: 'వాతావరణం',
    card_harvest_ready: 'కోతకు సిద్ధం',
    card_potential_rev: 'అంచనా రాబడి',
    card_recent_activity: 'ఇటీవలి కార్యకలాపాలు',
    card_batches_count: 'బ్యాచులు',

    // Voice Assistant
    vaani_title: 'అన్నపూర్ణ వాణి',
    vaani_sub: 'స్వర సహాయకి (AI Voice Agent)',
    vaani_prompt_guide: 'ప్రశ్నను అడగండి లేదా కింద ట్యాప్ చేయండి:',
    vaani_speak: 'మాట్లాడటానికి మైక్ నొక్కండి',
    vaani_listening: 'వింటున్నాను... మాట్లాడండి',
    vaani_playing: 'సమాధానం చెబుతోంది...',
    vaani_listen_btn: 'వినండి',
    vaani_type_placeholder: 'మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి...',

    // Quality Scan
    scan_title: 'AI పంట నాణ్యత & తెగులు పరీక్ష',
    scan_sub: 'ఫోటో తీసి తాజాదనం మరియు నిల్వ సామర్థ్యాన్ని తనిఖీ చేయండి',
    scan_take_photo: 'కెమెరా తెరవండి',
    scan_upload_gallery: 'గ్యాలరీ నుండి ఎంచుకోండి',
    scan_quality_score: 'నాణ్యత స్కోర్',
    scan_ripeness: 'పక్వత స్థితి',
    scan_pathogen: 'శిలీంధ్ర / తెగులు',
    scan_shelf_life: 'మిగిలిన నిల్వ రోజులు',
    scan_grade_a: 'గ్రేడ్-A ప్రీమియం',

    // Smart Move & FPO Pooling
    smart_move_title: 'స్మార్ట్ మూవ్ లాజిస్టిక్స్',
    smart_move_sub: 'అధిక నికర లాభం కోసం మార్కెట్ సిఫార్సులు',
    fpo_pooling_title: 'FPO భాగస్వామ్య రవాణా పూలింగ్',
    fpo_pooling_desc: 'పొరుగు రైతులతో కలిసి రవాణా ఖర్చును 78% తగ్గించుకోండి',
    fpo_join_truck: 'భాగస్వామ్య ట్రక్ బుక్ చేయండి (₹850)',
    fpo_solo_truck: 'వ్యక్తిగత ప్రైవేట్ ట్రక్',
    fpo_shared_pool: 'FPO పూల్ రేటు',
    b2b_direct_contracts: 'నేరుగా పరిశ్రమలకు అమ్మకం',
    b2b_lock_contract: 'కనీస ధర ఒప్పందం లాక్ చేయండి',
    cold_storage_plan_b: 'ఎమర్జెన్సీ సోలార్ కోల్డ్ స్టోరేజ్',
    cold_storage_reserve: '1-ట్యాప్ నిల్వ బుకింగ్',

    // Mandi Radar
    market_radar_title: 'లైవ్ APMC మార్కెట్ రాడార్',
    market_filter_all: 'అన్ని మార్కెట్లు',
    market_filter_nearby: '15 కి.మీ లోపు',
    market_filter_best_price: 'అత్యధిక ధర',
    market_filter_premium: 'ప్రీమియం',
    market_price_per_qtl: 'ధర / క్వింటాల్',
    market_distance: 'దూరం',

    // Common / UI
    loading: 'లోడ్ అవుతోంది...',
    retry: 'మళ్లీ ప్రయత్నించండి',
    cancel: 'రద్దు చేయండి',
    confirm: 'ధృవీకరించండి',
    days: 'రోజులు',
    hours: 'గంటలు',
    kg: 'కిలోలు',
    verified: 'ధృవీకరించబడింది',
  },
  hi: {
    // App & Header
    app_name: 'अन्नपूर्णा',
    greeting_farmer: 'शुभ प्रभात, किसान भाई',
    greeting_sub: 'बुवाई से लेकर बिक्री तक हर फसल को ट्रैक करें',
    select_language: 'अपनी पसंदीदा भाषा चुनें',
    select_language_sub: 'अपनी सुविधानुसार भाषा में ऐप का उपयोग करें',
    continue: 'आगे बढ़ें',
    save_changes: 'बदलाव सहेजें',
    change_language: 'भाषा बदलें',

    // Navigation Tabs
    tab_home: 'होम',
    tab_crops: 'फसलें',
    tab_scan: 'स्कैन',
    tab_smart_move: 'स्मार्ट मूव',
    tab_market: 'मंडी',
    tab_profile: 'प्रोफाइल',

    // Quick Actions
    action_add_crop: 'फसल जोड़ें',
    action_scan_crop: 'गुणवत्ता जांच',
    action_smart_move: 'स्मार्ट मूव सलाह',
    action_view_market: 'मंडी भाव देखें',
    action_satellite_map: 'सैटेलाइट खेत मैप',

    // Dashboard Cards
    card_active_crops: 'सक्रिय फसलें',
    card_weather_cond: 'मौसम की स्थिति',
    card_harvest_ready: 'कटाई हेतु तैयार',
    card_potential_rev: 'अनुमानित आय',
    card_recent_activity: 'हाल की गतिविधियां',
    card_batches_count: 'बैच',

    // Voice Assistant
    vaani_title: 'अन्नपूर्णा वाणी',
    vaani_sub: 'आवाज सहायक (AI Voice Agent)',
    vaani_prompt_guide: 'बोलें या नीचे से कोई प्रश्न चुनें:',
    vaani_speak: 'बोलने के लिए माइक दबाएं',
    vaani_listening: 'सुन रहे हैं... बोलिए',
    vaani_playing: 'उत्तर सुना रहे हैं...',
    vaani_listen_btn: 'सुनें',
    vaani_type_placeholder: 'यहाँ अपना प्रश्न टाइप करें...',

    // Quality Scan
    scan_title: 'AI फसल गुणवत्ता व रोग जांच',
    scan_sub: 'फोटो खींचकर ताजगी और शेल्फ लाइफ जांचें',
    scan_take_photo: 'कैमरा खोलें',
    scan_upload_gallery: 'गैलरी से चुनें',
    scan_quality_score: 'गुणवत्ता स्कोर',
    scan_ripeness: 'पकाव अवस्था',
    scan_pathogen: 'फंगस / रोग',
    scan_shelf_life: 'शेष शेल्फ लाइफ',
    scan_grade_a: 'ग्रेड-A उत्तम माल',

    // Smart Move & FPO Pooling
    smart_move_title: 'स्मार्ट मूव लॉजिस्टिक्स',
    smart_move_sub: 'अधिकतम मुनाफे के लिए मंडी सलाह',
    fpo_pooling_title: 'FPO साझा ट्रक पूलिंग',
    fpo_pooling_desc: 'पड़ोसी किसानों के साथ भाड़ा 78% तक कम करें',
    fpo_join_truck: 'साझा ट्रक बुक करें (₹850)',
    fpo_solo_truck: 'निजी अकेला ट्रक',
    fpo_shared_pool: 'FPO साझा दर',
    b2b_direct_contracts: 'कंपनियों को सीधी बिक्री',
    b2b_lock_contract: 'न्यूनतम गारंटी भाव लॉक करें',
    cold_storage_plan_b: 'आपातकालीन सोलर कोल्ड रूम',
    cold_storage_reserve: '1-क्लिक स्टोरेज बुकिंग',

    // Mandi Radar
    market_radar_title: 'लाइव APMC मंडी रडार',
    market_filter_all: 'सभी मंडियां',
    market_filter_nearby: '15 किमी के अंदर',
    market_filter_best_price: 'सबसे अच्छा भाव',
    market_filter_premium: 'प्रीमियम',
    market_price_per_qtl: 'भाव / क्विंटल',
    market_distance: 'दूरी',

    // Common / UI
    loading: 'लोड हो रहा है...',
    retry: 'पुनः प्रयास करें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    days: 'दिन',
    hours: 'घंटे',
    kg: 'किलो',
    verified: 'प्रमाणित',
  },
  mr: {
    // App & Header
    app_name: 'अन्नपूर्णा',
    greeting_farmer: 'शुभ प्रभात, शेतकरी बांधवांनो',
    greeting_sub: 'पेरणीपासून ते विक्रीपर्यंत प्रत्येक पिकाचा मागोवा घ्या',
    select_language: 'आपली पसंतीची भाषा निवडा',
    select_language_sub: 'आपल्या सोयीनुसार भाषेत ॲप वापरा',
    continue: 'पुढे चला',
    save_changes: 'बदल जतन करा',
    change_language: 'भाषा बदला',

    // Navigation Tabs
    tab_home: 'मुख्य',
    tab_crops: 'पिके',
    tab_scan: 'स्कॅन',
    tab_smart_move: 'स्मार्ट वाहतूक',
    tab_market: 'बाजार',
    tab_profile: 'प्रोफाइल',

    // Quick Actions
    action_add_crop: 'पीक जोडा',
    action_scan_crop: 'गुणवत्ता तपासणी',
    action_smart_move: 'स्मार्ट वाहतूक सल्ला',
    action_view_market: 'बाजार भाव पहा',
    action_satellite_map: 'उपग्रह शेत नकाशा',

    // Dashboard Cards
    card_active_crops: 'सध्याची पिके',
    card_weather_cond: 'हवामान स्थिती',
    card_harvest_ready: 'कापणीसाठी तयार',
    card_potential_rev: 'अंदाजे उत्पन्न',
    card_recent_activity: 'अलीकडील हालचाली',
    card_batches_count: 'बॅच',

    // Voice Assistant
    vaani_title: 'अन्नपूर्णा वाणी',
    vaani_sub: 'स्वार सहाय्यक (AI Voice Agent)',
    vaani_prompt_guide: 'बोला किंवा खालील प्रश्न निवडा:',
    vaani_speak: 'बोलण्यासाठी माइक दाबा',
    vaani_listening: 'ऐकत आहे... बोला',
    vaani_playing: 'उत्तर ऐकवत आहे...',
    vaani_listen_btn: 'ऐका',
    vaani_type_placeholder: 'येथे प्रश्न टाइप करा...',

    // Quality Scan
    scan_title: 'AI पीक गुणवत्ता व रोग तपासणी',
    scan_sub: 'फोटो काढून ताजेपणा आणि टिकवण क्षमता तपासा',
    scan_take_photo: 'कॅमेरा उघडा',
    scan_upload_gallery: 'गॅलरीतून निवडा',
    scan_quality_score: 'गुणवत्ता स्कोर',
    scan_ripeness: 'पक्वता स्थिती',
    scan_pathogen: 'बुरशी / कीड',
    scan_shelf_life: 'उर्वरित टिकवण दिवस',
    scan_grade_a: 'दर्जेदार ग्रेड-A',

    // Smart Move & FPO Pooling
    smart_move_title: 'स्मार्ट वाहतूक व नफा व्यवस्थापन',
    smart_move_sub: 'जास्तीत जास्त नफ्यासाठी बाजार शिफारसी',
    fpo_pooling_title: 'FPO एकत्रित ट्रक वाहतूक',
    fpo_pooling_desc: 'सहकारी शेतकऱ्यांसह भाडे ७८% कमी करा',
    fpo_join_truck: 'एकत्रित ट्रक बुक करा (₹८५०)',
    fpo_solo_truck: 'एकट्याचा खाजगी ट्रक',
    fpo_shared_pool: 'FPO एकत्रित दर',
    b2b_direct_contracts: 'प्रक्रिया उद्योगांना थेट विक्री',
    b2b_lock_contract: 'किमान हमीभाव लॉक करा',
    cold_storage_plan_b: 'आपत्कालीन सोलर कोल्ड स्टोरेज',
    cold_storage_reserve: '१-क्लिक जागा आरक्षण',

    // Mandi Radar
    market_radar_title: 'थेट APMC बाजार समिती रडार',
    market_filter_all: 'सर्व बाजार',
    market_filter_nearby: '१५ किमीच्या आत',
    market_filter_best_price: 'उत्तम भाव',
    market_filter_premium: 'प्रीमियम',
    market_price_per_qtl: 'दर / क्विंटल',
    market_distance: 'अंतर',

    // Common / UI
    loading: 'लोड होत आहे...',
    retry: 'पुन्हा प्रयत्न करा',
    cancel: 'रद्द करा',
    confirm: 'निश्चित करा',
    days: 'दिवस',
    hours: 'तास',
    kg: 'किलो',
    verified: 'प्रमाणित',
  },
  en: {
    // App & Header
    app_name: 'Annapurna',
    greeting_farmer: 'Good morning, Farmer',
    greeting_sub: 'Track every crop from sowing to sale',
    select_language: 'Select Your Preferred Language',
    select_language_sub: 'Use the app in the language most comfortable for you',
    continue: 'Continue',
    save_changes: 'Save Changes',
    change_language: 'Change Language',

    // Navigation Tabs
    tab_home: 'Home',
    tab_crops: 'Crops',
    tab_scan: 'Scan',
    tab_smart_move: 'Smart Move',
    tab_market: 'Market',
    tab_profile: 'Profile',

    // Quick Actions
    action_add_crop: 'Add Crop',
    action_scan_crop: 'Scan Crop',
    action_smart_move: 'Smart Move',
    action_view_market: 'Mandi Radar',
    action_satellite_map: 'Satellite Field Map',

    // Dashboard Cards
    card_active_crops: 'Active Crops',
    card_weather_cond: 'Weather Conditions',
    card_harvest_ready: 'Harvest Ready',
    card_potential_rev: 'Potential Revenue',
    card_recent_activity: 'Recent Activity',
    card_batches_count: 'Batches',

    // Voice Assistant
    vaani_title: 'Annapurna Vaani',
    vaani_sub: 'AI Farming Voice Agent',
    vaani_prompt_guide: 'Ask anything or choose a question below:',
    vaani_speak: 'Tap mic to speak',
    vaani_listening: 'Listening... please speak',
    vaani_playing: 'Speaking answer...',
    vaani_listen_btn: 'Listen',
    vaani_type_placeholder: 'Type your question here...',

    // Quality Scan
    scan_title: 'AI Crop Quality & Spoilage Scan',
    scan_sub: 'Capture photo to evaluate freshness, grade & remaining shelf life',
    scan_take_photo: 'Open Camera',
    scan_upload_gallery: 'Choose from Gallery',
    scan_quality_score: 'Quality Score',
    scan_ripeness: 'Ripeness Stage',
    scan_pathogen: 'Fungal Pathogen',
    scan_shelf_life: 'Residual Shelf Life',
    scan_grade_a: 'AGMARK Grade-A',

    // Smart Move & FPO Pooling
    smart_move_title: 'Smart Move Logistics Optimizer',
    smart_move_sub: 'Risk-adjusted market arbitrage & profit maximization',
    fpo_pooling_title: 'FPO Shared Freight Pooling',
    fpo_pooling_desc: 'Pool truck payload with neighbors to slash freight by 78%',
    fpo_join_truck: 'Join Shared Truck (₹850)',
    fpo_solo_truck: 'Solo Private Truck',
    fpo_shared_pool: 'FPO Shared Pool',
    b2b_direct_contracts: 'Direct B2B Off-taker Contracts',
    b2b_lock_contract: 'Lock Floor Contract',
    cold_storage_plan_b: 'Emergency Solar Cold Storage',
    cold_storage_reserve: '1-Tap Space Reservation',

    // Mandi Radar
    market_radar_title: 'Live APMC Mandi Radar',
    market_filter_all: 'All Markets',
    market_filter_nearby: 'Within 15 km',
    market_filter_best_price: 'Best Price',
    market_filter_premium: 'Premium',
    market_price_per_qtl: 'Price / Quintal',
    market_distance: 'Distance',

    // Common / UI
    loading: 'Loading...',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    days: 'Days',
    hours: 'Hours',
    kg: 'kg',
    verified: 'Verified',
  },
  ta: {
    // App & Header
    app_name: 'அன்னபூர்ணா',
    greeting_farmer: 'காலை வணக்கம், விவசாயி தோழரே',
    greeting_sub: 'விதைப்பு முதல் விற்பனை வரை பயிரைக் கண்காணிக்கவும்',
    select_language: 'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்',
    select_language_sub: 'உங்களுக்கு வசதியான மொழியில் செயலியைப் பயன்படுத்தவும்',
    continue: 'தொடரவும்',
    save_changes: 'சேமிக்கவும்',
    change_language: 'மொழியை மாற்றவும்',

    // Navigation Tabs
    tab_home: 'முகப்பு',
    tab_crops: 'பயிர்கள்',
    tab_scan: 'ஸ்கேன்',
    tab_smart_move: 'ஸ்மார்ட் மூவ்',
    tab_market: 'சந்தை',
    tab_profile: 'சுயவிவரம்',

    // Quick Actions
    action_add_crop: 'பயிர் சேர்க்க',
    action_scan_crop: 'தரம் சோதிக்க',
    action_smart_move: 'ஸ்மார்ட் ஆலோசனை',
    action_view_market: 'சந்தை விலை',
    action_satellite_map: 'செயற்கைக்கோள் வரைபடம்',

    // Dashboard Cards
    card_active_crops: 'செயலில் உள்ள பயிர்கள்',
    card_weather_cond: 'வானிலை நிலை',
    card_harvest_ready: 'அறுவடைக்கு தயார்',
    card_potential_rev: 'எதிர்பார்க்கப்படும் வருவாய்',
    card_recent_activity: 'சமீபத்திய நிகழ்வுகள்',
    card_batches_count: 'தொகுதிகள்',

    // Voice Assistant
    vaani_title: 'அன்னபூர்ணா வாணி',
    vaani_sub: 'குரல் உதவியாளர் (AI Voice Agent)',
    vaani_prompt_guide: 'கேள்வி கேளுங்கள் அல்லது தேர்ந்தெடுக்கவும்:',
    vaani_speak: 'பேச மைக் அழுத்தவும்',
    vaani_listening: 'கேட்கிறது... பேசுங்கள்',
    vaani_playing: 'பதில் ஒலிக்கிறது...',
    vaani_listen_btn: 'கேளுங்கள்',
    vaani_type_placeholder: 'இங்கு தட்டச்சு செய்யவும்...',

    // Quality Scan
    scan_title: 'AI பயிர் தரம் மற்றும் நோய் பரிசோதனை',
    scan_sub: 'புகைப்படம் எடுத்து புத்துணர்ச்சி மற்றும் ஆயுளை சரிபார்க்கவும்',
    scan_take_photo: 'கேமரா திறக்க',
    scan_upload_gallery: 'கேலரியில் இருந்து தேர்வு',
    scan_quality_score: 'தர மதிப்பீடு',
    scan_ripeness: 'பழுத்த நிலை',
    scan_pathogen: 'பூஞ்சை / நோய்',
    scan_shelf_life: 'மீதமுள்ள ஆயுள்',
    scan_grade_a: 'தரம் Grade-A',

    // Smart Move & FPO Pooling
    smart_move_title: 'ஸ்மார்ட் மூவ் லாஜிஸ்டிக்ஸ்',
    smart_move_sub: 'அதிக லாபத்திற்கான சந்தை வழிகாட்டுதல்',
    fpo_pooling_title: 'FPO பகிரப்பட்ட சரக்கு போக்குவரத்து',
    fpo_pooling_desc: 'விவசாயிகளுடன் இணைந்து போக்குவரத்து செலவை 78% குறைக்கவும்',
    fpo_join_truck: 'பகிர்வு லாரி முன்பதிவு (₹850)',
    fpo_solo_truck: 'தனிப்பட்ட லாரி',
    fpo_shared_pool: 'FPO பகிரப்பட்ட கட்டணம்',
    b2b_direct_contracts: 'நேரடி நிறுவன விற்பனை',
    b2b_lock_contract: 'குறைந்தபட்ச விலை ஒப்பந்தம்',
    cold_storage_plan_b: 'அவசர சூரிய சக்தி குளிர்சாதன சேமிப்பு',
    cold_storage_reserve: '1-கிளிக் முன்பதிவு',

    // Mandi Radar
    market_radar_title: 'நேரடி APMC சந்தை நிலவரம்',
    market_filter_all: 'அனைத்து சந்தைகள்',
    market_filter_nearby: '15 கி.மீக்குள்',
    market_filter_best_price: 'சிறந்த விலை',
    market_filter_premium: 'பிரீமியம்',
    market_price_per_qtl: 'விலை / குவிண்டால்',
    market_distance: 'தொலைவு',

    // Common / UI
    loading: 'ஏற்றுகிறது...',
    retry: 'மீண்டும் முயற்சிக்கவும்',
    cancel: 'ரத்து செய்',
    confirm: 'உறுதி செய்',
    days: 'நாட்கள்',
    hours: 'மணிநேரம்',
    kg: 'கிலோ',
    verified: 'சரிபார்க்கப்பட்டது',
  },
  kn: {
    // App & Header
    app_name: 'ಅನ್ನಪೂರ್ಣ',
    greeting_farmer: 'ಶುಭೋದಯ, ರೈತ ಮಿತ್ರರೆ',
    greeting_sub: 'ಬಿತ್ತನೆಯಿಂದ ಮಾರಾಟದವರೆಗೆ ಪ್ರತಿಯೊಂದು ಬೆಳೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    select_language: 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    select_language_sub: 'ನಿಮಗೆ ಅನುಕೂಲಕರವಾದ ಭಾಷೆಯಲ್ಲಿ ಆ್ಯಪ್ ಬಳಸಿ',
    continue: 'ಮುಂದುವರಿಯಿರಿ',
    save_changes: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    change_language: 'ಭಾಷೆ ಬದಲಾಯಿಸಿ',

    // Navigation Tabs
    tab_home: 'ಮುಖಪುಟ',
    tab_crops: 'ಬೆಳೆಗಳು',
    tab_scan: 'ಸ್ಕ್ಯಾನ್',
    tab_smart_move: 'ಸ್ಮಾರ್ಟ್ ಮೂವ್',
    tab_market: 'ಮಾರುಕಟ್ಟೆ',
    tab_profile: 'ಪ್ರೊಫೈಲ್',

    // Quick Actions
    action_add_crop: 'ಬೆಳೆ ಸೇರಿಸಿ',
    action_scan_crop: 'ಗುಣಮಟ್ಟ ತಪಾಸಣೆ',
    action_smart_move: 'ಸ್ಮಾರ್ಟ್ ಸಲಹೆ',
    action_view_market: 'ಮಾರುಕಟ್ಟೆ ದರಗಳು',
    action_satellite_map: 'ಉಪಗ್ರಹ ಫೀಲ್ಡ್ ಮ್ಯಾಪ್',

    // Dashboard Cards
    card_active_crops: 'ಸಕ್ರಿಯ ಬೆಳೆಗಳು',
    card_weather_cond: 'ಹವಾಮಾನ ಸ್ಥಿತಿ',
    card_harvest_ready: 'ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧ',
    card_potential_rev: 'ಅಂದಾಜು ಆದಾಯ',
    card_recent_activity: 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆಗಳು',
    card_batches_count: 'ಬ್ಯಾಚ್‌ಗಳು',

    // Voice Assistant
    vaani_title: 'ಅನ್ನಪೂರ್ಣ ವಾಣಿ',
    vaani_sub: 'ಧ್ವನಿ ಸಹಾಯಕ (AI Voice Agent)',
    vaani_prompt_guide: 'ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಕೆಳಗೆ ಆಯ್ಕೆಮಾಡಿ:',
    vaani_speak: 'ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ',
    vaani_listening: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ... ಮಾತನಾಡಿ',
    vaani_playing: 'ಉತ್ತರ ಹೇಳುತ್ತಿದೆ...',
    vaani_listen_btn: 'ಕೇಳಿ',
    vaani_type_placeholder: 'ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...',

    // Quality Scan
    scan_title: 'AI ಬೆಳೆ ಗುಣಮಟ್ಟ & ರೋಗ ತಪಾಸಣೆ',
    scan_sub: 'ಫೋಟೋ ತೆಗೆದು ತಾಜಾತನ ಮತ್ತು ಶೇಖರಣಾ ಅವಧಿಯನ್ನು ಪರಿಶೀಲಿಸಿ',
    scan_take_photo: 'ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ',
    scan_upload_gallery: 'ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ',
    scan_quality_score: 'ಗುಣಮಟ್ಟ ಸ್ಕೋರ್',
    scan_ripeness: 'ಪಕ್ವತೆಯ ಸ್ಥಿತಿ',
    scan_pathogen: 'ಶಿಲೀಂಧ್ರ / ರೋಗ',
    scan_shelf_life: 'ಉಳಿದ ಶೇಖರಣಾ ದಿನಗಳು',
    scan_grade_a: 'ಗ್ರೇಡ್-A ಗುಣಮಟ್ಟ',

    // Smart Move & FPO Pooling
    smart_move_title: 'ಸ್ಮಾರ್ಟ್ ಮೂವ್ ಲಾಜಿಸ್ಟಿಕ್ಸ್',
    smart_move_sub: 'ಗರಿಷ್ಠ ಲಾಭಕ್ಕಾಗಿ ಮಾರುಕಟ್ಟೆ ಶಿಫಾರಸುಗಳು',
    fpo_pooling_title: 'FPO ಹಂಚಿಕೆಯ ಟ್ರಕ್ ಪೂಲಿಂಗ್',
    fpo_pooling_desc: 'ರೈತರೊಂದಿಗೆ ಸೇರಿ ಸಾರಿಗೆ ವೆಚ್ಚವನ್ನು 78% ರಷ್ಟು ಉಳಿಸಿ',
    fpo_join_truck: 'ಹಂಚಿಕೆಯ ಟ್ರಕ್ ಬುಕ್ ಮಾಡಿ (₹850)',
    fpo_solo_truck: 'ವೈಯಕ್ತಿಕ ಖಾಸಗಿ ಟ್ರಕ್',
    fpo_shared_pool: 'FPO ಪೂಲ್ ದರ',
    b2b_direct_contracts: 'ಕಂಪನಿಗಳಿಗೆ ನೇರ ಮಾರಾಟ',
    b2b_lock_contract: 'ಖಾತರಿ ಕನಿಷ್ಠ ದರ ಲಾಕ್ ಮಾಡಿ',
    cold_storage_plan_b: 'ತುರ್ತು ಸೋಲಾರ್ ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್',
    cold_storage_reserve: '1-ಕ್ಲಿಕ್ ಶೇಖರಣಾ ಕಾಯ್ದಿರಿಸುವಿಕೆ',

    // Mandi Radar
    market_radar_title: 'ನೇರ APMC ಮಾರುಕಟ್ಟೆ ರೇಡಾರ್',
    market_filter_all: 'ಎಲ್ಲ ಮಾರುಕಟ್ಟೆಗಳು',
    market_filter_nearby: '15 ಕಿ.ಮೀ ಒಳಗೆ',
    market_filter_best_price: 'ಉತ್ತಮ ಬೆಲೆ',
    market_filter_premium: 'ಪ್ರೀಮಿಯಂ',
    market_price_per_qtl: 'ದರ / ಕ್ವಿಂಟಾಲ್',
    market_distance: 'ದೂರ',

    // Common / UI
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    confirm: 'ಖಚಿತಪಡಿಸಿ',
    days: 'ದಿನಗಳು',
    hours: 'ಗಂಟೆಗಳು',
    kg: 'ಕೆಜಿ',
    verified: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
  },
};
