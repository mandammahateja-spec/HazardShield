"""
HazardShield - Synthetic Flood Hazard Development Dataset Generator
===================================================================
NOTICE: This script generates a physically grounded SYNTHETIC DEMO DATASET
for training, validating, and benchmarking the HazardShield ML Risk Engine.
It is explicitly labeled as synthetic demo data to facilitate local development
until historical Central Water Commission (CWC) / IMD gauge records are imported.

Target:
- flood_hazard_occurred (Binary: 1 = dangerous inundation/threshold breach within 72h, 0 = safe)
"""

import os
import argparse
import numpy as np
import pandas as pd

def generate_flood_dataset(n_samples: int = 3000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates realistic hydrological and terrain observations for geographical zones.
    """
    np.random.seed(random_seed)

    # 1. Geographic and Topographic Parameters
    elevation_meters = np.random.uniform(5.0, 1200.0, n_samples)
    
    # Slopes: floodplains tend to be flat (<5 deg), hill slopes higher
    n_floodplain = int(n_samples * 0.65)
    n_terraced = n_samples - n_floodplain
    terrain_slope_degrees = np.concatenate([
        np.random.uniform(0.5, 6.0, n_floodplain),
        np.random.uniform(6.0, 25.0, n_terraced)
    ])
    np.random.shuffle(terrain_slope_degrees)

    # River / Drainage Proximity (meters)
    river_distance_meters = np.random.exponential(scale=1200.0, size=n_samples) + 50.0
    river_distance_meters = np.clip(river_distance_meters, 50.0, 8000.0)

    # 2. Meteorological and Hydrological Parameters
    # 72h Rainfall (mm): Mixture of dry, seasonal, and extreme monsoon surges
    n_regular = int(n_samples * 0.60)
    n_heavy = int(n_samples * 0.25)
    n_extreme = n_samples - (n_regular + n_heavy)
    rainfall_72h_mm = np.concatenate([
        np.random.gamma(shape=2.5, scale=18.0, size=n_regular),
        np.random.uniform(90.0, 180.0, size=n_heavy),
        np.random.uniform(180.0, 360.0, size=n_extreme)
    ])
    np.random.shuffle(rainfall_72h_mm)
    rainfall_72h_mm = np.clip(rainfall_72h_mm, 2.0, 420.0)

    # Zone threshold (mm of 72h rain before drainage saturates)
    rainfall_threshold_mm = np.random.uniform(55.0, 110.0, n_samples)

    # Antecedent Soil Saturation Ratio (0.0 = dry, 1.0 = fully saturated pore volume)
    soil_saturation_ratio = np.random.beta(a=3.5, b=2.0, size=n_samples)
    soil_saturation_ratio = np.clip(soil_saturation_ratio, 0.10, 0.98)

    # Drainage Capacity (mm of rain cleared per 24 hours)
    drainage_capacity_mm_day = np.random.uniform(25.0, 160.0, n_samples)

    # 3. Anthropogenic & Historical Parameters
    past_recurrence_count = np.random.poisson(lam=2.2, size=n_samples)
    past_recurrence_count = np.clip(past_recurrence_count, 0, 9)

    vulnerability_svi = np.random.uniform(15.0, 95.0, n_samples)

    # 4. Physically Grounded Flood Risk Probability Formulation (Logit formulation with noise)
    # Hydrological factors:
    # a. Rainfall surge ratio
    rainfall_surge = np.maximum(0.0, (rainfall_72h_mm - rainfall_threshold_mm) / rainfall_threshold_mm)
    
    # b. Drainage deficit (incoming daily rate vs clearance capacity)
    daily_rain_rate = rainfall_72h_mm / 3.0
    drainage_deficit = np.maximum(0.0, (daily_rain_rate - drainage_capacity_mm_day) / (drainage_capacity_mm_day + 1e-5))

    # c. Pooling factor: low slope (<4 deg) + high soil saturation + river proximity
    slope_pooling_factor = np.exp(-terrain_slope_degrees / 4.0)
    river_proximity_factor = np.exp(-river_distance_meters / 1500.0)
    saturation_inundation_factor = soil_saturation_ratio ** 1.8

    # Composite latent risk score
    latent_score = (
        2.8 * rainfall_surge
        + 2.2 * drainage_deficit
        + 1.8 * (slope_pooling_factor * saturation_inundation_factor)
        + 1.2 * river_proximity_factor
        + 0.4 * (past_recurrence_count / 3.0)
        - 1.8  # baseline offset to balance classes
    )

    # Add realistic measurement noise
    noise = np.random.normal(loc=0.0, scale=0.35, size=n_samples)
    probabilities = 1.0 / (1.0 + np.exp(-(latent_score + noise)))

    # Binary label: 1 if dangerous inundation occurred, 0 otherwise
    hazard_occurred = (probabilities >= 0.50).astype(int)

    # Realistic occasional sensor / reporting anomaly (3% label noise)
    flip_mask = np.random.rand(n_samples) < 0.03
    hazard_occurred[flip_mask] = 1 - hazard_occurred[flip_mask]

    df = pd.DataFrame({
        "rainfall_72h_mm": np.round(rainfall_72h_mm, 1),
        "rainfall_threshold_mm": np.round(rainfall_threshold_mm, 1),
        "soil_saturation_ratio": np.round(soil_saturation_ratio, 3),
        "terrain_slope_degrees": np.round(terrain_slope_degrees, 1),
        "drainage_capacity_mm_day": np.round(drainage_capacity_mm_day, 1),
        "elevation_meters": np.round(elevation_meters, 1),
        "river_distance_meters": np.round(river_distance_meters, 1),
        "past_recurrence_count": past_recurrence_count.astype(int),
        "vulnerability_svi": np.round(vulnerability_svi, 1),
        "flood_hazard_occurred": hazard_occurred,
    })

    return df

def main():
    parser = argparse.ArgumentParser(description="Generate synthetic flood hazard demo dataset for HazardShield ML.")
    parser.add_argument("--samples", type=int, default=3000, help="Number of records to generate (default: 3000)")
    parser.add_argument("--output", type=str, default=None, help="Output CSV path")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    data_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = args.output or os.path.join(data_dir, "demo_flood_hazard_data.csv")

    print(f"[INFO] Generating {args.samples} synthetic flood observation cycles (seed={args.seed})...")
    df = generate_flood_dataset(n_samples=args.samples, random_seed=args.seed)

    # Save to CSV
    df.to_csv(output_path, index=False)
    
    pos_count = int(df["flood_hazard_occurred"].sum())
    neg_count = len(df) - pos_count
    pos_pct = (pos_count / len(df)) * 100.0

    print(f"[SUCCESS] Demo dataset successfully saved to: {output_path}")
    print(f"   Total Samples: {len(df)}")
    print(f"   Class Distribution: {neg_count} Safe (0), {pos_count} Flood Breached (1) [{pos_pct:.1f}% positive]")
    print(f"   Features: {list(df.columns[:-1])}")

if __name__ == "__main__":
    main()
