"""
HazardShield - ML Pipeline Unit Tests
"""

import os
import sys
import pytest
import pandas as pd
import numpy as np

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if WORKSPACE_DIR not in sys.path:
    sys.path.insert(0, WORKSPACE_DIR)

from risk_engine.ml.preprocess import (
    engineer_features,
    prepare_data,
    validate_input_dict,
    RAW_NUMERIC_FEATURES,
    ALL_MODEL_FEATURES,
    TARGET_COLUMN,
    DEFAULT_FEATURE_VALUES,
)
from risk_engine.ml.model import create_hazard_model, extract_feature_importances
from risk_engine.ml.evaluate import evaluate_model
from risk_engine.ml.predict import (
    predict_hazard,
    load_ml_pipeline,
    is_model_available,
    compute_local_explainability,
)
from risk_engine.data.generate_demo_data import generate_flood_dataset

def test_demo_dataset_generation():
    """Verify synthetic dataset generator produces valid, correctly bounded data."""
    df = generate_flood_dataset(n_samples=200, random_seed=99)
    assert len(df) == 200
    assert TARGET_COLUMN in df.columns
    for feat in RAW_NUMERIC_FEATURES:
        assert feat in df.columns
        assert not df[feat].isnull().any()
    
    # Target should be binary 0 or 1
    assert set(df[TARGET_COLUMN].unique()).issubset({0, 1})

def test_preprocessing_and_feature_engineering():
    """Verify feature engineering produces expected interaction ratios without NaNs."""
    df_raw = pd.DataFrame([{
        "rainfall_72h_mm": 180.0,
        "rainfall_threshold_mm": 90.0,
        "soil_saturation_ratio": 0.80,
        "terrain_slope_degrees": 2.5,
        "drainage_capacity_mm_day": 30.0,
        "elevation_meters": 50.0,
        "river_distance_meters": 400.0,
        "past_recurrence_count": 3,
        "vulnerability_svi": 75.0,
        "flood_hazard_occurred": 1,
    }])

    df_eng = engineer_features(df_raw)
    assert "rainfall_to_threshold_ratio" in df_eng.columns
    assert "drainage_deficit_ratio" in df_eng.columns
    assert df_eng["rainfall_to_threshold_ratio"].iloc[0] == pytest.approx(2.0, 0.01)
    # Daily rain = 60, drainage = 30 -> ratio = 2.0
    assert df_eng["drainage_deficit_ratio"].iloc[0] == pytest.approx(2.0, 0.01)

def test_data_splitting():
    """Verify stratified splitting maintains class proportions without leakage."""
    df = generate_flood_dataset(n_samples=300, random_seed=42)
    X_train, X_val, X_test, y_train, y_val, y_test = prepare_data(df, test_size=0.15, val_size=0.15)
    
    assert len(X_train) + len(X_val) + len(X_test) == len(df)
    assert len(X_train.columns) == len(ALL_MODEL_FEATURES)
    assert len(y_train) == len(X_train)

def test_model_training_and_evaluation():
    """Verify model can be fitted and produces valid metric outputs."""
    df = generate_flood_dataset(n_samples=250, random_seed=42)
    X_train, X_val, X_test, y_train, y_val, y_test = prepare_data(df, test_size=0.2, val_size=0.2)

    model = create_hazard_model(n_estimators=30, max_depth=5, random_seed=42)
    model.fit(X_train, y_train)

    report = evaluate_model(model, X_test, y_test)
    assert "accuracy" in report
    assert "roc_auc" in report
    assert "precision" in report
    assert "recall" in report
    assert "f1_score" in report
    assert 0.0 <= report["roc_auc"] <= 1.0
    assert 0.0 <= report["accuracy"] <= 1.0

    feat_importances = extract_feature_importances(model)
    assert len(feat_importances) == len(ALL_MODEL_FEATURES)
    assert pytest.approx(sum(feat_importances.values()), 0.05) == 1.0

def test_predict_hazard_extreme_surge():
    """Verify extreme rainfall surge triggers high probability and relevant top factors."""
    payload = {
        "rainfall_72h_mm": 250.0,
        "rainfall_threshold_mm": 70.0,
        "soil_saturation_ratio": 0.95,
        "terrain_slope_degrees": 1.5,
        "drainage_capacity_mm_day": 25.0,
        "river_distance_meters": 150.0,
        "past_recurrence_count": 5,
    }
    result = predict_hazard(payload)
    assert result["status"] in ["active", "fallback_unavailable"]
    if result["status"] == "active":
        assert result["hazard_probability"] >= 0.70
        assert result["risk_level"] in ["high", "critical"]
        assert len(result["top_factors"]) > 0
        assert any("Precipitation Surge" in factor for factor in result["top_factors"])

def test_predict_hazard_dry_benign_conditions():
    """Verify dry/low-rain conditions produce low hazard probability."""
    payload = {
        "rainfall_72h_mm": 5.0,
        "rainfall_threshold_mm": 90.0,
        "soil_saturation_ratio": 0.20,
        "terrain_slope_degrees": 12.0,
        "drainage_capacity_mm_day": 120.0,
        "river_distance_meters": 4000.0,
        "past_recurrence_count": 0,
    }
    result = predict_hazard(payload)
    if result["status"] == "active":
        assert result["hazard_probability"] <= 0.35
        assert result["risk_level"] in ["low", "moderate"]

def test_predict_hazard_missing_features_fallback():
    """Verify missing or None fields are populated with domain defaults without error."""
    sparse_payload = {
        "rainfall_72h_mm": None,
        "terrain_slope_degrees": "invalid",
    }
    result = predict_hazard(sparse_payload)
    assert result is not None
    assert "status" in result
    if result["status"] == "active":
        assert 0.0 <= result["hazard_probability"] <= 1.0

def test_predict_hazard_when_model_missing(monkeypatch):
    """Verify graceful fallback when model artifact is absent."""
    monkeypatch.setenv("HAZARDSHIELD_ML_ARTIFACTS", "d:/non_existent_folder_xyz")
    load_ml_pipeline(force_reload=True)

    result = predict_hazard({"rainfall_72h_mm": 100.0})
    assert result["status"] == "fallback_unavailable"
    assert result["hazard_probability"] is None
    assert result["prediction"] == "unavailable"

    # Restore
    load_ml_pipeline(force_reload=True)
