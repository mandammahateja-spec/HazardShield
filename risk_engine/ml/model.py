"""
HazardShield - ML Model Definition & Pipeline Builder
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RISK_ENGINE_DIR = os.path.dirname(CURRENT_DIR)
WORKSPACE_DIR = os.path.dirname(RISK_ENGINE_DIR)
for p in (CURRENT_DIR, RISK_ENGINE_DIR, WORKSPACE_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from risk_engine.ml.preprocess import build_preprocessor_pipeline, ALL_MODEL_FEATURES
except ImportError:
    from ml.preprocess import build_preprocessor_pipeline, ALL_MODEL_FEATURES

def create_hazard_model(
    n_estimators: int = 150,
    max_depth: int = 8,
    min_samples_split: int = 6,
    min_samples_leaf: int = 3,
    random_seed: int = 42,
) -> Pipeline:
    """
    Creates a full scikit-learn Pipeline with preprocessing and Random Forest Classifier.
    
    Why Random Forest for Hazard Prediction?
    1. Tabular Environmental Structure: Environmental thresholds (e.g., rainfall surpassing
       local drainage capacity) represent non-linear step boundaries that tree ensembles model
       with high fidelity.
    2. Zero Scaling Sensitivity: Tree-based splits are invariant to monotonic transformations,
       preventing scaling skew between disparate physical dimensions (elevation in meters vs.
       soil saturation ratio 0.0-1.0).
    3. Balanced Class Weights: Natural handling of class imbalance in disaster reporting
       via balanced sample weighting.
    4. Deterministic Reproducibility: Seeded tree construction ensures deterministic outputs.
    5. Native Explainability: Gini importance / MDI readily pinpoints the exact physical
       drivers behind an escalated hazard probability.
    """
    preprocessor = build_preprocessor_pipeline()

    classifier = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        class_weight="balanced",
        random_state=random_seed,
        n_jobs=-1,
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier),
    ])

    return pipeline

def extract_feature_importances(pipeline: Pipeline) -> Dict[str, float]:
    """
    Extracts normalized feature importances from the fitted Random Forest classifier.
    """
    if "classifier" not in pipeline.named_steps:
        return {}

    classifier = pipeline.named_steps["classifier"]
    if not hasattr(classifier, "feature_importances_"):
        return {}

    importances = classifier.feature_importances_
    features = ALL_MODEL_FEATURES

    if len(importances) != len(features):
        return {f"feature_{i}": float(v) for i, v in enumerate(importances)}

    # Return sorted dictionary
    feat_imp = {feat: float(round(imp, 4)) for feat, imp in zip(features, importances)}
    return dict(sorted(feat_imp.items(), key=lambda item: item[1], reverse=True))
