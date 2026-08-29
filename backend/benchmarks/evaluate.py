"""
Comprehensive AI Agro-Vision Benchmark Evaluator
Compares:
  - Architecture A: Pure LLM
  - Architecture B: Dedicated Vision Classifier
  - Architecture C: Hybrid Pipeline (Classifier + Preprocessing + LLM Explanation)
"""

import os
import sys
import json
import time
import asyncio
from pathlib import Path
from typing import List, Dict, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from benchmarks.dataset_loader import get_dataset_samples
from benchmarks.metrics import calculate_metrics, print_confusion_matrix, EvaluationMetrics
from ai.classifier.fruit_classifier import fruit_classifier
from ai.inference.hybrid_pipeline import hybrid_pipeline


async def run_evaluation():
    print("=" * 70)
    print("🏆 FRESH & STALE PRODUCE CLASSIFICATION BENCHMARK SUITE")
    print("   Evaluating on Kaggle Fresh & Stale Produce Dataset")
    print("=" * 70 + "\n")

    samples = get_dataset_samples(max_samples_per_class=10)
    print(f"📦 Total Test Samples Loaded: {len(samples)}")
    print(f"   - Fresh Samples: {sum(1 for s in samples if s['ground_truth'] == 'fresh')}")
    print(f"   - Stale Samples: {sum(1 for s in samples if s['ground_truth'] == 'stale')}")
    print("-" * 70 + "\n")

    # =========================================================================
    # 1. EVALUATE ARCHITECTURE B: Dedicated Vision Classifier
    # =========================================================================
    print("⚙️  EVALUATING ARCHITECTURE B: Dedicated Vision Classifier...")
    classifier_records = []
    clf_start_t = time.time()

    for s in samples:
        clf_res = fruit_classifier.predict(s["bytes"])
        predicted = "fresh" if clf_res.is_fresh else "stale"
        classifier_records.append({
            "filename": s["filename"],
            "ground_truth": s["ground_truth"],
            "predicted": predicted,
            "crop": s["crop"],
            "confidence": clf_res.confidence,
            "quality_score": clf_res.quality_score
        })
    clf_elapsed = time.time() - clf_start_t

    metrics_clf = calculate_metrics(classifier_records)
    print_confusion_matrix(metrics_clf, title="ARCHITECTURE B: DEDICATED VISION CLASSIFIER")

    # =========================================================================
    # 2. EVALUATE ARCHITECTURE C: Hybrid Pipeline (Preprocessing + Clf + LLM)
    # =========================================================================
    print("⚙️  EVALUATING ARCHITECTURE C: Hybrid Pipeline (Guardrails + Classifier + LLM)...")
    hybrid_records = []
    hyb_start_t = time.time()

    for s in samples:
        hyb_res = await hybrid_pipeline.scan_image(s["bytes"], user_language="en")
        predicted = "fresh" if hyb_res.is_fresh else "stale"
        hybrid_records.append({
            "filename": s["filename"],
            "ground_truth": s["ground_truth"],
            "predicted": predicted,
            "crop": s["crop"],
            "confidence": hyb_res.confidence_score,
            "quality_score": hyb_res.quality_score,
            "is_clear": hyb_res.is_image_clear,
            "explanation": hyb_res.farmer_explanation
        })
    hyb_elapsed = time.time() - hyb_start_t

    metrics_hyb = calculate_metrics(hybrid_records)
    print_confusion_matrix(metrics_hyb, title="ARCHITECTURE C: HYBRID (CLASSIFIER + LLM EXPLANATION)")

    # =========================================================================
    # 3. COMPARATIVE BENCHMARK SUMMARY TABLE
    # =========================================================================
    print("=" * 70)
    print("📊 ARCHITECTURAL COMPARISON MATRIX")
    print("=" * 70)
    print(f"{'Metric':<25} | {'Architecture B (Classifier)':<20} | {'Architecture C (Hybrid Pipeline)':<22}")
    print("-" * 70)
    print(f"{'Overall Accuracy':<25} | {f'{metrics_clf.accuracy:.1f}%':<20} | {f'{metrics_hyb.accuracy:.1f}%':<22}")
    print(f"{'Precision (Fresh)':<25} | {f'{metrics_clf.precision:.1f}%':<20} | {f'{metrics_hyb.precision:.1f}%':<22}")
    print(f"{'Recall (Fresh)':<25} | {f'{metrics_clf.recall:.1f}%':<20} | {f'{metrics_hyb.recall:.1f}%':<22}")
    print(f"{'F1 Score':<25} | {f'{metrics_clf.f1_score:.1f}%':<20} | {f'{metrics_hyb.f1_score:.1f}%':<22}")
    print(f"{'Avg Inference Time':<25} | {f'{int((clf_elapsed/len(samples))*1000)} ms/image':<20} | {f'{int((hyb_elapsed/len(samples))*1000)} ms/image':<22}")
    print(f"{'Quality Guardrails':<25} | {'None':<20} | {'Active (Blur/Lighting)':<22}")
    print(f"{'Farmer Explanation':<25} | {'Raw Probabilities':<20} | {'Natural Speech / Text':<22}")
    print("=" * 70 + "\n")

    # Save benchmark report to JSON
    results_dir = BACKEND_DIR / "benchmarks" / "results"
    results_dir.mkdir(parents=True, exist_ok=True)
    report_file = results_dir / "benchmark_report.json"

    report_data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_test_samples": len(samples),
        "models": {
            "dedicated_classifier": {
                "accuracy": metrics_clf.accuracy,
                "precision": metrics_clf.precision,
                "recall": metrics_clf.recall,
                "f1_score": metrics_clf.f1_score,
                "confusion_matrix": {
                    "true_fresh": metrics_clf.true_fresh,
                    "false_stale": metrics_clf.false_stale,
                    "false_fresh": metrics_clf.false_fresh,
                    "true_stale": metrics_clf.true_stale
                },
                "per_fruit": metrics_clf.per_fruit
            },
            "hybrid_pipeline": {
                "accuracy": metrics_hyb.accuracy,
                "precision": metrics_hyb.precision,
                "recall": metrics_hyb.recall,
                "f1_score": metrics_hyb.f1_score,
                "confusion_matrix": {
                    "true_fresh": metrics_hyb.true_fresh,
                    "false_stale": metrics_hyb.false_stale,
                    "false_fresh": metrics_hyb.false_fresh,
                    "true_stale": metrics_hyb.true_stale
                },
                "per_fruit": metrics_hyb.per_fruit
            }
        }
    }

    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    print(f"✅ Full benchmark report saved to: {report_file}")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
