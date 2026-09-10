"""
HazardShield - ML Model Training Pipeline
"""

import os
import sys
import json
import argparse
from datetime import datetime, timezone
import pandas as pd
import joblib

# Ensure risk_engine package is resolvable
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RISK_ENGINE_DIR = os.path.dirname(CURRENT_DIR)
WORKSPACE_DIR = os.path.dirname(RISK_ENGINE_DIR)
if WORKSPACE_DIR not in sys.path:
    sys.path.insert(0, WORKSPACE_DIR)

from risk_engine.ml.preprocess import prepare_data, ALL_MODEL_FEATURES, TARGET_COLUMN
from risk_engine.ml.model import create_hazard_model, extract_feature_importances
from risk_engine.ml.evaluate import evaluate_model, print_evaluation_summary

def run_training(
    data_path: str,
    artifacts_dir: str,
    random_seed: int = 42,
    n_estimators: int = 150,
    max_depth: int = 8,
) -> str:
    """
    Executes the end-to-end training, evaluation, and artifact serialization process.
    """
    os.makedirs(artifacts_dir, exist_ok=True)

    # 1. Check/load dataset
    if not os.path.exists(data_path):
        print(f"[INFO] Dataset '{data_path}' not found. Generating demo dataset...")
        from risk_engine.data.generate_demo_data import generate_flood_dataset
        df_demo = generate_flood_dataset(n_samples=3000, random_seed=random_seed)
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        df_demo.to_csv(data_path, index=False)
        print(f"[SUCCESS] Demo dataset created at: {data_path}")

    print(f"[INFO] Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"   Rows loaded: {len(df)}, Columns: {list(df.columns)}")

    # 2. Stratified Preprocessing Split
    print("[INFO] Preprocessing and engineering features (Train 70% / Val 15% / Test 15%)...")
    X_train, X_val, X_test, y_train, y_val, y_test = prepare_data(
        df, test_size=0.15, val_size=0.15, random_seed=random_seed
    )
    print(f"   Train: {len(X_train)} samples | Val: {len(X_val)} samples | Test: {len(X_test)} samples")

    # 3. Model Pipeline Instantiation & Fitting
    print(f"[TRAIN] Training Random Forest Classifier (n_estimators={n_estimators}, max_depth={max_depth})...")
    pipeline = create_hazard_model(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_seed=random_seed,
    )
    pipeline.fit(X_train, y_train)

    # 4. Evaluation
    print("[EVAL] Evaluating on unseen Test partition...")
    val_report = evaluate_model(pipeline, X_val, y_val)
    test_report = evaluate_model(pipeline, X_test, y_test)
    print_evaluation_summary(test_report)

    # 5. Extract Feature Importances
    feat_importances = extract_feature_importances(pipeline)
    print("[INFO] Top Contributing Feature Importances:")
    for feat, imp in list(feat_importances.items())[:5]:
        print(f"   * {feat:30s}: {imp * 100:.2f}%")

    # 6. Serialization
    model_filename = "flood_model.joblib"
    model_path = os.path.join(artifacts_dir, model_filename)
    joblib.dump(pipeline, model_path)
    print(f"[SAVED] Model artifact serialized to: {model_path}")

    # Metadata
    dataset_is_demo = "demo" in os.path.basename(data_path).lower()
    metadata = {
        "model_version": "1.0.0",
        "algorithm": "RandomForestClassifier",
        "target_hazard": "flood",
        "prediction_window_hours": 72,
        "features": ALL_MODEL_FEATURES,
        "feature_importances": feat_importances,
        "dataset_type": "synthetic_demo" if dataset_is_demo else "real_historical",
        "dataset_source": os.path.basename(data_path),
        "trained_timestamp": datetime.now(timezone.utc).isoformat(),
        "random_seed": random_seed,
        "hyperparameters": {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
            "class_weight": "balanced",
            "min_samples_split": 6,
            "min_samples_leaf": 3,
        },
        "evaluation_metrics": {
            "validation": val_report,
            "test": test_report,
        }
    }

    metadata_path = os.path.join(artifacts_dir, "metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[SAVED] Model metadata exported to: {metadata_path}")

    return model_path

def main():
    parser = argparse.ArgumentParser(description="Train HazardShield Flood Hazard Prediction Model.")
    parser.add_argument("--data", type=str, default=None, help="Path to input CSV dataset")
    parser.add_argument("--artifacts-dir", type=str, default=None, help="Directory to save artifacts")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--estimators", type=int, default=150, help="Number of trees (default: 150)")
    parser.add_argument("--depth", type=int, default=8, help="Max tree depth (default: 8)")
    args = parser.parse_args()

    default_data = os.path.join(RISK_ENGINE_DIR, "data", "demo_flood_hazard_data.csv")
    default_artifacts = os.path.join(CURRENT_DIR, "artifacts")

    data_path = args.data or default_data
    artifacts_dir = args.artifacts_dir or default_artifacts

    run_training(
        data_path=data_path,
        artifacts_dir=artifacts_dir,
        random_seed=args.seed,
        n_estimators=args.estimators,
        max_depth=args.depth,
    )

if __name__ == "__main__":
    main()
