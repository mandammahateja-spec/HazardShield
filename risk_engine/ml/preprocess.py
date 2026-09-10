"""
HazardShield - ML Data Preprocessing & Feature Engineering Pipeline
"""

from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

# Standard feature registry
RAW_NUMERIC_FEATURES: List[str] = [
    "rainfall_72h_mm",
    "rainfall_threshold_mm",
    "soil_saturation_ratio",
    "terrain_slope_degrees",
    "drainage_capacity_mm_day",
    "elevation_meters",
    "river_distance_meters",
    "past_recurrence_count",
    "vulnerability_svi",
]

ENGINEERED_FEATURES: List[str] = [
    "rainfall_to_threshold_ratio",
    "drainage_deficit_ratio",
]

ALL_MODEL_FEATURES: List[str] = RAW_NUMERIC_FEATURES + ENGINEERED_FEATURES
TARGET_COLUMN: str = "flood_hazard_occurred"

# Feature default baselines for inference fallback
DEFAULT_FEATURE_VALUES: Dict[str, float] = {
    "rainfall_72h_mm": 50.0,
    "rainfall_threshold_mm": 85.0,
    "soil_saturation_ratio": 0.50,
    "terrain_slope_degrees": 4.5,
    "drainage_capacity_mm_day": 65.0,
    "elevation_meters": 120.0,
    "river_distance_meters": 1500.0,
    "past_recurrence_count": 1.0,
    "vulnerability_svi": 50.0,
}

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes domain-specific hydrological and hazard interaction ratios.
    Does not introduce data leakage as operations are strictly row-wise.
    """
    df_out = df.copy()

    # Fill any missing base features with defaults
    for col, default_val in DEFAULT_FEATURE_VALUES.items():
        if col not in df_out.columns:
            df_out[col] = default_val
        else:
            df_out[col] = df_out[col].fillna(default_val)

    # 1. Ratio of actual rainfall to terrain absorption threshold
    rf = df_out["rainfall_72h_mm"].clip(lower=0.0)
    thresh = df_out["rainfall_threshold_mm"].clip(lower=1.0)
    df_out["rainfall_to_threshold_ratio"] = np.round(rf / thresh, 3)

    # 2. Daily precipitation vs daily drainage capacity (Deficit index)
    daily_rain = rf / 3.0
    drainage = df_out["drainage_capacity_mm_day"].clip(lower=1.0)
    df_out["drainage_deficit_ratio"] = np.round(daily_rain / drainage, 3)

    return df_out

def build_preprocessor_pipeline() -> Pipeline:
    """
    Constructs an sklearn Pipeline with median imputation and standard scaling.
    """
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

def prepare_data(
    df: pd.DataFrame,
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_seed: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
    """
    Validates, feature-engineers, and splits dataset into Train, Validation, and Test sets
    using stratified splitting on the target variable.
    """
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' missing from DataFrame.")

    # Apply row-wise feature engineering
    df_engineered = engineer_features(df)

    X = df_engineered[ALL_MODEL_FEATURES]
    y = df_engineered[TARGET_COLUMN].astype(int)

    # First split: train+val vs test
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_seed,
        stratify=y
    )

    # Second split: train vs val
    val_relative_size = val_size / (1.0 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val,
        test_size=val_relative_size,
        random_state=random_seed,
        stratify=y_train_val
    )

    return X_train, X_val, X_test, y_train, y_val, y_test

def validate_input_dict(input_dict: Dict[str, Any]) -> Dict[str, float]:
    """
    Validates and standardizes a single zone telemetry dictionary for real-time inference.
    """
    clean_dict: Dict[str, float] = {}
    for feat in RAW_NUMERIC_FEATURES:
        val = input_dict.get(feat)
        if val is None or not isinstance(val, (int, float)) or np.isnan(val):
            clean_dict[feat] = DEFAULT_FEATURE_VALUES[feat]
        else:
            clean_dict[feat] = float(val)
            
    return clean_dict
