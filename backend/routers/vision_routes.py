"""
Vision Analysis Router

Single-image vision analysis endpoint for mobile app integration.
Supports WebP, JPEG, PNG formats.
"""

import hashlib
import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from auth import get_current_user
from engines.vision import run_vision_sensor_layer
from models import VisionAgronomySchema

logger = logging.getLogger("FreshGuardVisionRouter")
router = APIRouter(tags=["vision"])


@router.post("/api/v5/vision/analyze", response_model=VisionAgronomySchema)
async def analyze_image(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """
    Analyze a single crop image using the 3-tier vision pipeline.
    
    Returns structured AGMARK grading parameters:
    - crop_identified
    - visual_quality_score (0-100)
    - ripeness_stage (Unripe | Optimal | Overripe)
    - fungal_pathogen_presence (boolean)
    """
    try:
        # Validate file type
        allowed_types = {'image/jpeg', 'image/png', 'image/webp'}
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported image format. Allowed: {', '.join(allowed_types)}"
            )

        # Read and process image
        vision_metrics = await run_vision_sensor_layer(file)
        
        # Add confidence based on tier used
        # In production, track which tier was used
        return VisionAgronomySchema(
            crop_identified=vision_metrics.crop_identified,
            visual_quality_score=vision_metrics.visual_quality_score,
            ripeness_stage=vision_metrics.ripeness_stage,
            fungal_pathogen_presence=vision_metrics.fungal_pathogen_presence,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vision analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Vision analysis failed. Please try again.")


@router.post("/api/v5/vision/analyze-batch")
async def analyze_batch_images(
    files: list[UploadFile] = File(...),
    user: dict = Depends(get_current_user),
):
    """
    Analyze multiple crop images (5-sample protocol).
    Returns aggregated results with individual sample details.
    """
    if len(files) < 3:
        raise HTTPException(status_code=400, detail="Minimum 3 samples required")
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 samples allowed")

    try:
        results = []
        seen_hashes = set()
        for idx, file in enumerate(files):
            # Validate file type
            allowed_types = {'image/jpeg', 'image/png', 'image/webp'}
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Sample {idx+1}: Unsupported image format"
                )
                
            # Anti-fraud duplicate detection
            file_bytes = await file.read()
            file_hash = hashlib.md5(file_bytes).hexdigest()
            if file_hash in seen_hashes:
                raise HTTPException(
                    status_code=400,
                    detail="Duplicate sample images detected. Please provide distinct 5-fruit samples."
                )
            seen_hashes.add(file_hash)
            
            # Reset file pointer for downstream processing
            await file.seek(0)

            vision_metrics = await run_vision_sensor_layer(file)
            results.append({
                "sequence": idx + 1,
                "crop_identified": vision_metrics.crop_identified,
                "visual_quality_score": vision_metrics.visual_quality_score,
                "ripeness_stage": vision_metrics.ripeness_stage,
                "fungal_pathogen_presence": vision_metrics.fungal_pathogen_presence,
            })

        # Aggregate results
        avg_score = sum(r["visual_quality_score"] for r in results) / len(results)
        ripeness_votes = [r["ripeness_stage"] for r in results]
        ripeness_stage = max(set(ripeness_votes), key=ripeness_votes.count)
        pathogen_detected = any(r["fungal_pathogen_presence"] for r in results)

        return {
            "aggregated": {
                "crop_identified": results[0]["crop_identified"],
                "visual_quality_score": round(avg_score),
                "ripeness_stage": ripeness_stage,
                "fungal_pathogen_presence": pathogen_detected,
                "sample_count": len(results),
            },
            "individual_results": results,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch vision analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Batch vision analysis failed.")