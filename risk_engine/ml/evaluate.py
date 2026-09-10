"""
HazardShield - ML Model Evaluation Suite
Computes precision, recall, F1, ROC-AUC, Brier score, and confusion matrix.
"""

from typing import Dict, Any
import json
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    brier_score_loss,
    confusion_matrix,
    classification_report,
)
from sklearn.pipeline import Pipeline

def evaluate_model(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> Dict[str, Any]:
    """
    Computes rigorous evaluation metrics for imbalanced hazard event classification.
    """
    # Predictions
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    # Metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    brier = float(brier_score_loss(y_test, y_prob))

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    report = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "brier_score": round(brier, 4),
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp,
        },
        "sample_counts": {
            "total_test_samples": int(len(y_test)),
            "actual_positive_hazards": int(y_test.sum()),
            "actual_negative_hazards": int((1 - y_test).sum()),
        }
    }

    return report

def print_evaluation_summary(report: Dict[str, Any]) -> None:
    """
    Prints a formatted summary of model performance.
    """
    print("\n" + "=" * 60)
    print("[EVALUATION] HAZARDSHIELD ML MODEL EVALUATION SUMMARY")
    print("=" * 60)
    print(f"  * ROC-AUC Score:        {report['roc_auc']:.4f} (Separation capacity)")
    print(f"  * Precision:            {report['precision']:.4f} (Purity of hazard alarms)")
    print(f"  * Recall (Sensitivity): {report['recall']:.4f} (Detection rate of actual breaches)")
    print(f"  * F1-Score:             {report['f1_score']:.4f} (Harmonic mean)")
    print(f"  * Accuracy:             {report['accuracy']:.4f}")
    print(f"  * Brier Score:          {report['brier_score']:.4f} (Lower = better calibration)")
    print("-" * 60)
    cm = report["confusion_matrix"]
    print("  Confusion Matrix:")
    print(f"    [TN: {cm['true_negatives']:4d}]  [FP: {cm['false_positives']:4d}] (Safe correctly vs false alarm)")
    print(f"    [FN: {cm['false_negatives']:4d}]  [TP: {cm['true_positives']:4d}] (Missed breach vs breach caught)")
    print("=" * 60 + "\n")

def main():
    import os
    import sys
    import argparse
    import joblib

    parser = argparse.ArgumentParser(description="Evaluate trained HazardShield ML Model.")
    parser.add_argument("--data", type=str, default=None, help="Path to evaluation dataset")
    parser.add_argument("--model", type=str, default=None, help="Path to serialized joblib model")
    args = parser.parse_args()

    current_dir = os.path.dirname(os.path.abspath(__file__))
    risk_engine_dir = os.path.dirname(current_dir)
    workspace_dir = os.path.dirname(risk_engine_dir)
    if workspace_dir not in sys.path:
        sys.path.insert(0, workspace_dir)

    default_data = os.path.join(risk_engine_dir, "data", "demo_flood_hazard_data.csv")
    default_model = os.path.join(current_dir, "artifacts", "flood_model.joblib")

    data_path = args.data or default_data
    model_path = args.model or default_model

    if not os.path.exists(model_path):
        print(f"[ERROR] Model artifact not found at: {model_path}. Run train.py first.")
        sys.exit(1)

    if not os.path.exists(data_path):
        print(f"[ERROR] Evaluation dataset not found at: {data_path}.")
        sys.exit(1)

    print(f"[INFO] Loading model from: {model_path}")
    pipeline = joblib.load(model_path)

    print(f"[INFO] Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    from risk_engine.ml.preprocess import prepare_data
    _, _, X_test, _, _, y_test = prepare_data(df, test_size=0.15, val_size=0.15, random_seed=42)

    report = evaluate_model(pipeline, X_test, y_test)
    print_evaluation_summary(report)

if __name__ == "__main__":
    main()
