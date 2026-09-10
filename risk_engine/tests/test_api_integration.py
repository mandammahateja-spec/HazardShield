"""
HazardShield - FastAPI Risk & ML Engine Integration Tests
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if WORKSPACE_DIR not in sys.path:
    sys.path.insert(0, WORKSPACE_DIR)

from risk_engine.main import app

client = TestClient(app)

def test_health_check_endpoint():
    """Verify health check returns service and ML engine status."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "ml_engine" in data
    assert data["ml_engine"]["primary_hazard"] == "flood"

def test_predict_hazard_endpoint_valid():
    """Verify POST /predict-hazard endpoint executes and returns valid structure."""
    payload = {
        "zone_id": "test_flood_zone_01",
        "zone_name": "Yamuna Riverfront Ward",
        "rainfall_72h_mm": 150.0,
        "rainfall_threshold_mm": 80.0,
        "soil_saturation_ratio": 0.85,
        "terrain_slope_degrees": 2.0,
        "drainage_capacity_mm_day": 40.0,
        "river_distance_meters": 200.0,
        "past_recurrence_count": 3,
        "vulnerability_svi": 70.0,
    }
    res = client.post("/predict-hazard", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "hazard_probability" in data
    assert "prediction" in data
    assert "risk_level" in data
    assert "top_factors" in data
    assert isinstance(data["top_factors"], list)
    assert data["prediction_window_hours"] == 72
    assert data["hazard_type"] == "flood"

def test_predict_hazard_endpoint_empty_payload():
    """Verify POST /predict-hazard functions with all-default parameters."""
    res = client.post("/predict-hazard", json={})
    assert res.status_code == 200
    data = res.json()
    assert "hazard_probability" in data
    assert "risk_level" in data

def test_score_zone_with_ml_integration():
    """Verify POST /score-zone incorporates ML predictions into DRS without breaking structure."""
    payload = {
        "zone_id": "zone_wayanad_test",
        "zone_name": "Wayanad Slope Sector",
        "hazard_type": "flood",
        "population": 14000,
        "mhi_baseline": 65.0,
        "hazard_intensity_score": 75.0,
        "vulnerability_score": 60.0,
        "disaster_history_score": 70.0,
        "rainfall_mm": 130.0,
        "rainfall_thresh": 85.0,
        "alpha": 1.2,
        "rcc": 7000,
        "water_supply_mld": 1.2,
        "sewer_treatment_mld": 0.9,
        "power_mw": 3.5,
        "lane_count": 2.0,
        "evac_flow_rate": 1500,
        "target_evac_hours": 4.0,
        "verified_hazard_reports_count": 2,
        "soil_saturation": 0.88,
        "slope_degrees": 3.0,
        "drainage_capacity_mm_day": 35.0,
        "enable_ml_integration": True,
    }
    res = client.post("/score-zone", json=payload)
    assert res.status_code == 200
    data = res.json()
    
    # Verify core deterministic outputs
    assert "drs_score" in data
    assert "ecc_capacity" in data
    assert "oci_score" in data
    assert "classification" in data
    assert "relocation_tier" in data
    assert "is_red_zone" in data
    assert "limiting_factor" in data
    assert "capacities_breakdown" in data
    
    # Verify ML transparent fields
    assert "ml_hazard_probability" in data
    assert "ml_risk_level" in data
    assert "ml_top_factors" in data
    assert data["ml_status"] in ["active", "fallback_unavailable"]

def test_score_zone_legacy_compatibility():
    """Verify POST /score-zone remains 100% backward-compatible with legacy payload."""
    legacy_payload = {
        "zone_id": "legacy_zone_123",
        "population": 10000,
    }
    res = client.post("/score-zone", json=legacy_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["zone_id"] == "legacy_zone_123"
    assert data["drs_score"] > 0
    assert data["ecc_capacity"] > 0
    assert data["classification"] in ["red", "yellow", "green"]
