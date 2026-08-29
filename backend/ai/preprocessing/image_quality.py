"""
AI Vision Preprocessing & Image Quality Guardrails
Validates blur, lighting, resolution, and exposure before passing to inference.
"""

from dataclasses import dataclass
from typing import Optional, Tuple
import io
import numpy as np
from PIL import Image, ImageStat


@dataclass
class ImageQualityResult:
    is_valid: bool
    blur_score: float
    brightness_score: float
    contrast_score: float
    confidence_penalty: float
    user_guidance: Optional[str] = None


def evaluate_image_quality(image_bytes: bytes) -> ImageQualityResult:
    """
    Evaluates image lighting, sharpness, and viability for agricultural scanning.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = img.size

        # 1. Resolution Check
        if width < 80 or height < 80:
            return ImageQualityResult(
                is_valid=False,
                blur_score=0.0,
                brightness_score=0.0,
                contrast_score=0.0,
                confidence_penalty=0.8,
                user_guidance="Image resolution is too low. Please move closer to the produce and take a higher resolution photo."
            )

        # 2. Convert to Grayscale & Numpy Array for Spectral Analysis
        gray_img = img.convert("L")
        gray_arr = np.array(gray_img, dtype=np.float32)

        # 3. Brightness & Contrast Calculation (Mean & Std Dev of Luminance)
        stat = ImageStat.Stat(gray_img)
        mean_brightness = stat.mean[0]  # 0 to 255
        contrast = stat.stddev[0]        # Contrast spread

        # 4. Blur / Sharpness Estimation via Laplacian Gradient Variance
        dy, dx = np.gradient(gray_arr[::2, ::2])
        blur_variance = float(np.var(dx) + np.var(dy))

        # 5. Quality Guardrail Rules
        is_too_dark = mean_brightness < 35.0
        is_too_bright = mean_brightness > 235.0
        is_blurry = blur_variance < 30.0

        if is_too_dark:
            return ImageQualityResult(
                is_valid=False,
                blur_score=blur_variance,
                brightness_score=mean_brightness,
                contrast_score=contrast,
                confidence_penalty=0.6,
                user_guidance="Image is too dark. Please take photo under sunlight or turn on flashlight."
            )

        if is_too_bright:
            return ImageQualityResult(
                is_valid=False,
                blur_score=blur_variance,
                brightness_score=mean_brightness,
                contrast_score=contrast,
                confidence_penalty=0.5,
                user_guidance="Image is washed out by glare. Please shade the fruit and retake."
            )

        if is_blurry:
            return ImageQualityResult(
                is_valid=False,
                blur_score=blur_variance,
                brightness_score=mean_brightness,
                contrast_score=contrast,
                confidence_penalty=0.45,
                user_guidance="Photo is blurry. Please hold phone steady and tap to focus on the produce."
            )

        # Image passed all guardrails
        return ImageQualityResult(
            is_valid=True,
            blur_score=blur_variance,
            brightness_score=mean_brightness,
            contrast_score=contrast,
            confidence_penalty=0.0,
            user_guidance=None
        )

    except Exception as e:
        return ImageQualityResult(
            is_valid=False,
            blur_score=0.0,
            brightness_score=0.0,
            contrast_score=0.0,
            confidence_penalty=0.7,
            user_guidance="Could not parse image file. Please upload a valid JPG/PNG photo."
        )
