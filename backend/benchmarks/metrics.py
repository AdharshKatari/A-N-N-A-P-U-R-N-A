"""
Benchmark Metrics Calculator
Calculates Accuracy, Precision, Recall, F1 Score, Confusion Matrix, and Per-Fruit breakdowns.
"""

from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class EvaluationMetrics:
    total_samples: int
    true_fresh: int
    false_stale: int   # Type I error (False Negative for Fresh)
    false_fresh: int   # Type II error (False Positive for Fresh)
    true_stale: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    per_fruit: Dict[str, Dict[str, float]]


def calculate_metrics(records: List[Dict[str, Any]]) -> EvaluationMetrics:
    """
    Computes classification performance metrics from test evaluation records.
    Each record must have:
      - 'ground_truth': 'fresh' | 'stale'
      - 'predicted': 'fresh' | 'stale'
      - 'crop': 'Tomato' | 'Apple' | 'Banana' | 'Orange' etc.
    """
    tp = 0 # Ground truth Fresh, Predicted Fresh
    fn = 0 # Ground truth Fresh, Predicted Stale
    fp = 0 # Ground truth Stale, Predicted Fresh
    tn = 0 # Ground truth Stale, Predicted Stale

    fruit_buckets: Dict[str, Dict[str, int]] = {}

    for r in records:
        gt = r["ground_truth"].lower()
        pred = r["predicted"].lower()
        crop = r.get("crop", "Unknown").capitalize()

        if crop not in fruit_buckets:
            fruit_buckets[crop] = {"total": 0, "correct": 0, "tp": 0, "fn": 0, "fp": 0, "tn": 0}
        fruit_buckets[crop]["total"] += 1

        is_correct = False
        if gt == "fresh" and pred == "fresh":
            tp += 1
            fruit_buckets[crop]["tp"] += 1
            fruit_buckets[crop]["correct"] += 1
        elif gt == "fresh" and pred == "stale":
            fn += 1
            fruit_buckets[crop]["fn"] += 1
        elif gt == "stale" and pred == "fresh":
            fp += 1
            fruit_buckets[crop]["fp"] += 1
        elif gt == "stale" and pred == "stale":
            tn += 1
            fruit_buckets[crop]["tn"] += 1
            fruit_buckets[crop]["correct"] += 1

    total = len(records)
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    # Per-fruit breakdown
    per_fruit_stats: Dict[str, Dict[str, float]] = {}
    for crop_name, b in fruit_buckets.items():
        c_acc = b["correct"] / b["total"] if b["total"] > 0 else 0.0
        c_prec = b["tp"] / (b["tp"] + b["fp"]) if (b["tp"] + b["fp"]) > 0 else 0.0
        c_rec = b["tp"] / (b["tp"] + b["fn"]) if (b["tp"] + b["fn"]) > 0 else 0.0
        c_f1 = (2 * c_prec * c_rec) / (c_prec + c_rec) if (c_prec + c_rec) > 0 else 0.0
        per_fruit_stats[crop_name] = {
            "samples": b["total"],
            "accuracy": round(c_acc * 100, 2),
            "precision": round(c_prec * 100, 2),
            "recall": round(c_rec * 100, 2),
            "f1_score": round(c_f1 * 100, 2)
        }

    return EvaluationMetrics(
        total_samples=total,
        true_fresh=tp,
        false_stale=fn,
        false_fresh=fp,
        true_stale=tn,
        accuracy=round(accuracy * 100, 2),
        precision=round(precision * 100, 2),
        recall=round(recall * 100, 2),
        f1_score=round(f1 * 100, 2),
        per_fruit=per_fruit_stats
    )


def print_confusion_matrix(metrics: EvaluationMetrics, title: str = "CONFUSION MATRIX"):
    """Prints a formatted ASCII confusion matrix table."""
    print("=" * 65)
    print(f"📊 {title}")
    print("=" * 65)
    print(f"                      Predicted Fresh     Predicted Stale")
    print(f"  Actual Fresh (🟢)        {metrics.true_fresh:<16}  {metrics.false_stale:<16}")
    print(f"  Actual Stale (🔴)        {metrics.false_fresh:<16}  {metrics.true_stale:<16}")
    print("-" * 65)
    print(f"  Overall Accuracy : {metrics.accuracy:.1f}%")
    print(f"  Precision (Fresh): {metrics.precision:.1f}%")
    print(f"  Recall (Fresh)   : {metrics.recall:.1f}%")
    print(f"  F1 Score         : {metrics.f1_score:.1f}%")
    print("-" * 65)
    print("  Per-Fruit Classification Breakdown:")
    for crop, stats in metrics.per_fruit.items():
        print(f"   • {crop:<10}: Acc {stats['accuracy']}% | Prec {stats['precision']}% | Rec {stats['recall']}% | F1 {stats['f1_score']}% (N={stats['samples']})")
    print("=" * 65 + "\n")
