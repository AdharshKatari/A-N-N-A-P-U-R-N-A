from fastapi import APIRouter
from typing import Dict, List, Any

router = APIRouter(prefix="/api/v5", tags=["Metadata"])

@router.get("/faq")
async def get_faq():
    """Return list of FAQs."""
    return {
        "faq": [
            {
                "question": "How do I add a new crop?",
                "answer": "Tap the 'Add Crop' button on the home screen. You can then enter details about your crop including type, planting date, and expected harvest date."
            },
            {
                "question": "How accurate is the weather forecast?",
                "answer": "Our weather data is sourced from multiple meteorological services and updated every 6 hours. For farming-specific forecasts, we provide 7-day predictions with hourly updates during critical growth periods."
            },
            {
                "question": "What does the Smart Move feature do?",
                "answer": "Smart Move analyzes market prices, weather conditions, and crop health to recommend the best time to sell your produce for maximum profit."
            }
        ]
    }

@router.get("/crops/metadata")
@router.get("/metadata/crops")
@router.get("/crops")
async def get_crops_metadata():
    """Return supported crop types and varieties."""
    return {
        "crops": [
            {"label": "Paddy / Rice", "value": "Paddy", "icon": "grass"},
            {"label": "Wheat", "value": "Wheat", "icon": "grass"},
            {"label": "Tomatoes", "value": "Tomatoes", "icon": "nutrition"},
            {"label": "Mangoes", "value": "Mangoes", "icon": "nutrition"},
            {"label": "Onions", "value": "Onions", "icon": "nutrition"},
            {"label": "Potatoes", "value": "Potatoes", "icon": "nutrition"},
            {"label": "Cotton", "value": "Cotton", "icon": "grass"},
            {"label": "Sugarcane", "value": "Sugarcane", "icon": "grass"}
        ],
        "varieties": {
            "Paddy": ["BPT 5204", "Swarna", "IR-64", "Basmati 370", "Sona Masuri"],
            "Wheat": ["HD-2967", "PBW-723", "WH-1105", "DBW-187", "C-306"],
            "Tomatoes": ["Roma VF", "Pusa Ruby", "Arka Rakshak", "Hybrid-100", "Co-3"],
            "Mangoes": ["Alphonso", "Dashehari", "Langra", "Chausa", "Neelam"],
            "Onions": ["Nasik Red", "Bhima Red", "Agrifound Dark Red", "Co-3", "Punjab Selection"],
            "Potatoes": ["Kufri Jyoti", "Kufri Chandramukhi", "Kufri Pukhraj", "Kufri Lalima", "Atlantic"],
            "Cotton": ["Bt Cotton", "Desi Cotton", "Mesilla", "Suregrow", "DP-428 Bt"],
            "Sugarcane": ["Co-86032", "CoJ-85", "Co-0238", "CoSe-92423", "ISH-10"]
        }
    }
