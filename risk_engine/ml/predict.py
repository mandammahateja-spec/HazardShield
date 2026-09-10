"""
HazardShield - ML Inference & Real-Time Explainability Service
"""

import os
import sys
import json
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import joblib

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RISK_ENGINE_DIR = os.path.dirname(CURRENT_DIR)
WORKSPACE_DIR = os.path.dirname(RISK_ENGINE_DIR)
if WORKSPACE_DIR not in sys.path:
    sys.path.insert(0, WORKSPACE_DIR)

from risk_engine.ml.preprocess import (
    RAW_NUMERIC_FEATURES,
    ALL_MODEL_FEATURES,
    DEFAULT_FEATURE_VALUES,
    engineer_features,
    validate_input_dict,
)

# Global in-memory cache
_LOADED_MODEL = None
_LOADED_METADATA = None
_ARTIFACTS_DIR = os.path.join(CURRENT_DIR, "artifacts")

def get_artifacts_dir() -> str:
    return os.environ.get("HAZARDSHIELD_ML_ARTIFACTS", _ARTIFACTS_DIR)

def load_ml_pipeline(force_reload: bool = False):
    """
    Loads and caches the serialized model pipeline and metadata safely.
    Returns (pipeline, metadata) or (None, None) if not available.
    """
    global _LOADED_MODEL, _LOADED_METADATA

    if force_reload:
        _LOADED_MODEL = None
        _LOADED_METADATA = None

    if _LOADED_MODEL is not None:
        return _LOADED_MODEL, _LOADED_METADATA

    artifacts_dir = get_artifacts_dir()
    model_path = os.path.join(artifacts_dir, "flood_model.joblib")
    meta_path = os.path.join(artifacts_dir, "metadata.json")

    if not os.path.exists(model_path):
        return None, None

    try:
        _LOADED_MODEL = joblib.load(model_path)
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                _LOADED_METADATA = json.load(f)
        else:
            _LOADED_METADATA = {"model_version": "1.0.0", "target_hazard": "flood"}
        return _LOADED_MODEL, _LOADED_METADATA
    except Exception as e:
        print(f"[WARN] [ML Predictor] Failed to load model from {model_path}: {e}")
        return None, None

def is_model_available() -> bool:
    """Checks if a trained model is present and ready."""
    model, _ = load_ml_pipeline()
    return model is not None

def compute_local_explainability(
    raw_dict: Dict[str, float],
    engineered_df: pd.DataFrame,
    feature_importances: Dict[str, float],
    hazard_prob: float,
) -> List[str]:
    """
    Generates human-readable, domain-specific explainability statements
    highlighting the primary physical causes for elevated or reduced risk.
    """
    rf = raw_dict["rainfall_72h_mm"]
    thresh = raw_dict["rainfall_threshold_mm"]
    sat = raw_dict["soil_saturation_ratio"]
    slope = raw_dict["terrain_slope_degrees"]
    drainage = raw_dict["drainage_capacity_mm_day"]
    recurrence = raw_dict["past_recurrence_count"]
    river_dist = raw_dict["river_distance_meters"]
    rf_ratio = engineered_df["rainfall_to_threshold_ratio"].iloc[0]
    drainage_deficit = engineered_df["drainage_deficit_ratio"].iloc[0]

    candidate_explanations = []

    # Factor 1: Rainfall vs threshold
    if rf_ratio >= 1.0:
        surge_pct = int(round((rf_ratio - 1.0) * 100))
        imp = feature_importances.get("rainfall_to_threshold_ratio", 0.25) * (rf_ratio ** 1.5)
        candidate_explanations.append((
            imp,
            f"Precipitation Surge: 72h rainfall ({rf:.1f}mm) exceeds safe terrain threshold ({thresh:.1f}mm) by +{surge_pct}%"
        ))
    elif rf_ratio >= 0.75:
        imp = feature_importances.get("rainfall_72h_mm", 0.15)
        candidate_explanations.append((
            imp,
            f"Elevated Precipitation: 72h rainfall ({rf:.1f}mm) is approaching threshold ({thresh:.1f}mm)"
        ))

    # Factor 2: Drainage deficit
    if drainage_deficit >= 1.0:
        deficit_pct = int(round((drainage_deficit - 1.0) * 100))
        imp = feature_importances.get("drainage_deficit_ratio", 0.22) * (drainage_deficit ** 1.2)
        candidate_explanations.append((
            imp,
            f"Drainage Saturation Deficit: Incoming daily water rate exceeds drainage clearance by +{deficit_pct}%"
        ))

    # Factor 3: Soil saturation
    if sat >= 0.70:
        imp = feature_importances.get("soil_saturation_ratio", 0.18) * (sat / 0.5)
        candidate_explanations.append((
            imp,
            f"High Soil Saturation: Antecedent pore moisture at {int(sat * 100)}%, severely inhibiting further water infiltration"
        ))

    # Factor 4: Terrain Slope & Ponding
    if slope <= 4.0:
        imp = feature_importances.get("terrain_slope_degrees", 0.15) * (5.0 / max(0.5, slope))
        candidate_explanations.append((
            imp,
            f"Low-Lying Flat Topography: Gentle slope ({slope:.1f} deg) promotes localized pooling and slow stormwater clearance"
        ))

    # Factor 5: Historical Recurrence
    if recurrence >= 2:
        imp = feature_importances.get("past_recurrence_count", 0.10) * (recurrence / 2.0)
        candidate_explanations.append((
            imp,
            f"Historical Vulnerability: Zone has experienced {int(recurrence)} previous major inundation disasters"
        ))

    # Factor 6: River Proximity
    if river_dist <= 800:
        imp = feature_importances.get("river_distance_meters", 0.10) * (1500.0 / max(50.0, river_dist))
        candidate_explanations.append((
            imp,
            f"Waterway Proximity: Habitation is situated within {int(river_dist)}m of primary drainage corridor"
        ))

    # Low risk explanation if quiet
    if not candidate_explanations and hazard_prob < 0.35:
        candidate_explanations.append((
            1.0,
            f"Tolerable Precipitation: 72h rainfall ({rf:.1f}mm) remains comfortably within drainage absorption limits ({drainage:.1f}mm/day)"
        ))

    # Sort descending by calculated local importance
    candidate_explanations.sort(key=lambda x: x[0], reverse=True)
    return [text for _, text in candidate_explanations[:3]]

def predict_hazard(input_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Primary inference function.
    Accepts zone parameters, maps alternate naming aliases, validates, and runs model.
    Falls back gracefully if model artifact is unavailable.
    """
    # Map common aliases from HazardShield Zone data structures
    normalized_input = {
        "rainfall_72h_mm": input_payload.get("rainfall_72h_mm") or input_payload.get("rainfall_mm") or DEFAULT_FEATURE_VALUES["rainfall_72h_mm"],
        "rainfall_threshold_mm": input_payload.get("rainfall_threshold_mm") or input_payload.get("rainfall_thresh") or DEFAULT_FEATURE_VALUES["rainfall_threshold_mm"],
        "soil_saturation_ratio": input_payload.get("soil_saturation_ratio") or input_payload.get("soil_saturation") or DEFAULT_FEATURE_VALUES["soil_saturation_ratio"],
        "terrain_slope_degrees": input_payload.get("terrain_slope_degrees") or input_payload.get("slope_degrees") or DEFAULT_FEATURE_VALUES["terrain_slope_degrees"],
        "drainage_capacity_mm_day": input_payload.get("drainage_capacity_mm_day") or input_payload.get("drainage_capacity") or DEFAULT_FEATURE_VALUES["drainage_capacity_mm_day"],
        "elevation_meters": input_payload.get("elevation_meters") or DEFAULT_FEATURE_VALUES["elevation_meters"],
        "river_distance_meters": input_payload.get("river_distance_meters") or DEFAULT_FEATURE_VALUES["river_distance_meters"],
        "past_recurrence_count": input_payload.get("past_recurrence_count") or input_payload.get("disaster_history_recurrence") or DEFAULT_FEATURE_VALUES["past_recurrence_count"],
        "vulnerability_svi": input_payload.get("vulnerability_svi") or input_payload.get("vulnerability_score") or DEFAULT_FEATURE_VALUES["vulnerability_svi"],
    }

    # Validate inputs
    clean_dict = validate_input_dict(normalized_input)

    # Check model presence
    pipeline, metadata = load_ml_pipeline()
    if pipeline is None:
        return {
            "hazard_probability": None,
            "prediction": "unavailable",
            "risk_level": "unknown",
            "top_factors": ["ML model artifact offline or not trained; using deterministic baseline."],
            "model_version": None,
            "status": "fallback_unavailable",
            "prediction_window_hours": 72,
            "hazard_type": "flood",
        }

    try:
        # Preprocessing & feature engineering
        raw_df = pd.DataFrame([clean_dict])
        engineered_df = engineer_features(raw_df)
        X_sample = engineered_df[ALL_MODEL_FEATURES]

        # Model inference
        prob_array = pipeline.predict_proba(X_sample)[0]
        hazard_prob = float(np.round(prob_array[1], 3))

        # Categorize
        if hazard_prob >= 0.80:
            risk_level = "critical"
            prediction = "high"
        elif hazard_prob >= 0.60:
            risk_level = "high"
            prediction = "high"
        elif hazard_prob >= 0.35:
            risk_level = "moderate"
            prediction = "moderate"
        else:
            risk_level = "low"
            prediction = "low"

        # Local Explainability
        feat_importances = metadata.get("feature_importances", {}) if metadata else {}
        top_factors = compute_local_explainability(clean_dict, engineered_df, feat_importances, hazard_prob)

        return {
            "hazard_probability": hazard_prob,
            "prediction": prediction,
            "risk_level": risk_level,
            "top_factors": top_factors,
            "model_version": metadata.get("model_version", "1.0.0") if metadata else "1.0.0",
            "hazard_type": metadata.get("target_hazard", "flood") if metadata else "flood",
            "prediction_window_hours": metadata.get("prediction_window_hours", 72) if metadata else 72,
            "status": "active",
        }
    except Exception as e:
        print(f"[ERROR] [ML Inference Error]: {e}")
        return {
            "hazard_probability": None,
            "prediction": "unavailable",
            "risk_level": "unknown",
            "top_factors": [f"Inference computation error: {str(e)}"],
            "model_version": None,
            "status": "fallback_unavailable",
            "prediction_window_hours": 72,
            "hazard_type": "flood",
        }
