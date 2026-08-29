"""
Kaggle Dataset Benchmark: Fresh & Stale Produce Classification
Dataset: swoyam2609/fresh-and-stale-classification

Runs our Agro-Vision Quality & Spoilage AI Pipeline across real-world fresh and stale crop images,
verifying AGMARK scores, pathogen detection, and shelf-life predictions.
"""

import os
import sys
import glob
import time
import json
from pathlib import Path
from typing import Dict, List, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import kagglehub
from engines.vision import run_vision_sensor_layer


def download_and_explore_dataset() -> str:
    print("=" * 70)
    print("📦 DOWNLOADING KAGGLE DATASET: swoyam2609/fresh-and-stale-classification")
    print("=" * 70)
    
    dataset_path = kagglehub.dataset_download("swoyam2609/fresh-and-stale-classification")
    print(f"✅ Dataset downloaded successfully to: {dataset_path}\n")
    return dataset_path


class MockUploadFile:
    """Wrapper to simulate FastAPI UploadFile for the vision pipeline."""
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.filename = os.path.basename(file_path)
        self._file = open(file_path, "rb")

    async def read(self) -> bytes:
        self._file.seek(0)
        return self._file.read()

    def close(self):
        self._file.close()


async def run_benchmark(dataset_root: str):
    print("=" * 70)
    print("🔬 RUNNING AI AGRO-VISION SCANNING BENCHMARK")
    print("=" * 70)

    # Search for image files in the dataset
    all_images = glob.glob(os.path.join(dataset_root, "**", "*.*"), recursive=True)
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    image_files = [f for f in all_images if Path(f).suffix.lower() in valid_exts]

    print(f"📊 Total image files found in dataset: {len(image_files)}")

    # Categorize images by class name from folder paths
    categories: Dict[str, List[str]] = {}
    for img_path in image_files:
        parent_name = Path(img_path).parent.name.lower()
        if parent_name not in categories:
            categories[parent_name] = []
        categories[parent_name].append(img_path)

    print(f"📂 Identified Dataset Classes ({len(categories)} classes):")
    for cat, files in categories.items():
        print(f"   - {cat}: {len(files)} sample images")
    print("-" * 70)

    results: List[Dict[str, Any]] = []
    
    # We benchmark a diverse balanced sample of images across classes
    sample_targets = [
        ("fresh", "fresh_tomatoes", "Tomato"),
        ("fresh", "freshtomatoes", "Tomato"),
        ("stale", "stale_tomatoes", "Tomato"),
        ("stale", "staletomatoes", "Tomato"),
        ("fresh", "fresh_apples", "Apple"),
        ("fresh", "freshapples", "Apple"),
        ("stale", "stale_apples", "Apple"),
        ("stale", "staleapples", "Apple"),
        ("fresh", "fresh_banana", "Banana"),
        ("fresh", "freshbanana", "Banana"),
        ("stale", "stale_banana", "Banana"),
        ("stale", "stalebanana", "Banana"),
        ("fresh", "fresh_oranges", "Orange"),
        ("stale", "stale_oranges", "Orange"),
    ]

    evaluated_count = 0
    correct_classification = 0
    fresh_correct = 0
    fresh_total = 0
    stale_correct = 0
    stale_total = 0

    print("\n🔍 BENCHMARKING SAMPLE PRODUCE IMAGES THROUGH AGRO-VISION ENGINE:\n")

    for ground_truth_status, folder_key, expected_crop in sample_targets:
        # Find matching folder in categories
        matching_key = None
        for cat in categories.keys():
            if folder_key.lower() in cat or cat in folder_key.lower():
                matching_key = cat
                break
        
        if not matching_key or not categories[matching_key]:
            continue

        sample_paths = categories[matching_key][:2] # evaluate 2 samples per class
        for file_path in sample_paths:
            mock_file = MockUploadFile(file_path)
            start_t = time.time()
            try:
                vision_out = await run_vision_sensor_layer(mock_file)
            finally:
                mock_file.close()
            elapsed_ms = int((time.time() - start_t) * 1000)

            score = vision_out.visual_quality_score
            ripeness = vision_out.ripeness_stage
            has_pathogen = vision_out.fungal_pathogen_presence
            crop_identified = vision_out.crop_identified
            confidence = vision_out.confidence

            # Evaluation logic:
            # Fresh should have score >= 70, no pathogen, Unripe/Optimal
            # Stale should have score < 70, pathogen True OR Overripe
            is_predicted_fresh = score >= 70 and not has_pathogen and ripeness.lower() in ["unripe", "optimal"]
            is_predicted_stale = score < 70 or has_pathogen or ripeness.lower() == "overripe"

            is_correct = False
            if ground_truth_status == "fresh":
                fresh_total += 1
                if is_predicted_fresh:
                    fresh_correct += 1
                    is_correct = True
            else:
                stale_total += 1
                if is_predicted_stale:
                    stale_correct += 1
                    is_correct = True

            evaluated_count += 1
            if is_correct:
                correct_classification += 1

            status_icon = "🟢 FRESH" if ground_truth_status == "fresh" else "🔴 STALE / SPOILED"
            pred_icon = "✅ MATCH" if is_correct else "⚠️ MISMATCH"

            print(f"[{pred_icon}] Image: {Path(file_path).name}")
            print(f"   - Class: {matching_key} (Ground Truth: {status_icon})")
            print(f"   - AI Detected Crop: {crop_identified} (Confidence: {int(confidence*100)}%)")
            print(f"   - Visual Quality Score: {score}/100 | Ripeness: {ripeness}")
            print(f"   - Pathogen / Rot Detected: {'⚠️ YES (Pathogen Found)' if has_pathogen else '🛡️ NO (Clean Produce)'}")
            print(f"   - Processing Latency: {elapsed_ms} ms\n")

            results.append({
                "file": Path(file_path).name,
                "ground_truth": ground_truth_status,
                "detected_crop": crop_identified,
                "score": score,
                "ripeness": ripeness,
                "pathogen": has_pathogen,
                "correct": is_correct,
                "latency_ms": elapsed_ms,
            })

    # Overall Summary Metrics
    accuracy = (correct_classification / evaluated_count) * 100 if evaluated_count > 0 else 0
    fresh_acc = (fresh_correct / fresh_total) * 100 if fresh_total > 0 else 0
    stale_acc = (stale_correct / stale_total) * 100 if stale_total > 0 else 0

    print("=" * 70)
    print("📈 AGRO-VISION SCANNING BENCHMARK SUMMARY REPORT")
    print("=" * 70)
    print(f"• Total Images Evaluated: {evaluated_count}")
    print(f"• Overall Classification Accuracy: {accuracy:.1f}%")
    print(f"• Fresh Produce Detection Accuracy: {fresh_acc:.1f}% ({fresh_correct}/{fresh_total})")
    print(f"• Stale / Spoilage / Rot Detection Accuracy: {stale_acc:.1f}% ({stale_correct}/{stale_total})")
    print(f"• Average Inference Latency: {sum(r['latency_ms'] for r in results)//len(results) if results else 0} ms")
    print("=" * 70)


if __name__ == "__main__":
    import asyncio
    path = download_and_explore_dataset()
    asyncio.run(run_benchmark(path))
