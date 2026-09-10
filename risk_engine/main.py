import math
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="HazardShield Risk Engine",
    description="Mathematical computation service for Dynamic Risk Score (DRS), Carrying Capacity (ECC), and Overcapacity Index (OCI)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ZoneScoreInput(BaseModel):
    zone_id: str
    zone_name: Optional[str] = "Monitored Zone"
    hazard_type: Optional[str] = "flood"
    population: int = Field(..., gt=0, description="Actual population count (P_actual)")
    mhi_baseline: Optional[float] = Field(50.0, ge=0.0, le=100.0, description="Multi-Hazard Index baseline")
    hazard_intensity_score: Optional[float] = Field(50.0, ge=0.0, le=100.0, description="Peak hazard intensity (rainfall, slope shear, wave height, cloudburst rate)")
    vulnerability_score: Optional[float] = Field(50.0, ge=0.0, le=100.0, description="Social & infrastructure vulnerability index (0-100)")
    disaster_history_score: Optional[float] = Field(50.0, ge=0.0, le=100.0, description="Historical recurrence frequency and cumulative disaster damage (0-100)")
    rainfall_mm: Optional[float] = Field(0.0, ge=0.0, description="72-hour simulated or actual cumulative rainfall (R_cum)")
    rainfall_thresh: Optional[float] = Field(85.0, gt=0.0, description="Zone rainfall threshold (R_thresh)")
    alpha: Optional[float] = Field(1.0, gt=0.0, description="Terrain soil saturation sensitivity coefficient")
    rcc: Optional[int] = Field(8000, gt=0, description="Resource/Land carrying capacity")
    water_supply_mld: Optional[float] = Field(1.4, gt=0.0, description="Water supply available in MLD")
    water_lpcd: Optional[float] = Field(135.0, gt=0.0, description="Water standard in LPCD")
    sewer_treatment_mld: Optional[float] = Field(1.1, gt=0.0, description="Sewage treatment in MLD")
    power_mw: Optional[float] = Field(4.0, gt=0.0, description="Power substation capacity in MW")
    lane_count: Optional[float] = Field(2.0, gt=0.0, description="Effective road lanes")
    evac_flow_rate: Optional[int] = Field(1800, gt=0, description="Hourly evacuation flow in people/hr")
    target_evac_hours: Optional[float] = Field(4.5, gt=0.0, description="Allowable safe evacuation hours")
    verified_hazard_reports_count: Optional[int] = Field(0, ge=0, description="Number of citizen reports verified by authority")

class ZoneScoreOutput(BaseModel):
    zone_id: str
    zone_name: str
    hazard_type: str
    population: int
    mhi_baseline: float
    hazard_intensity_score: float
    vulnerability_score: float
    disaster_history_score: float
    drs_score: float
    ecc_capacity: int
    oci_score: float
    classification: str
    is_red_zone: bool
    relocation_tier: str
    is_overcapacity: bool = Field(alias="is_overcapacity")
    limiting_factor: str
    rpi_urgency_score: float
    recommended_action: str
    capacities_breakdown: dict

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HazardShield Multi-Hazard & Carrying Capacity Risk Engine",
        "framework": "FastAPI",
        "version": "1.1.0",
        "supported_hazards": ["landslide", "flood", "coastal_erosion", "cloudburst", "earthquake", "cyclone"]
    }

@app.post("/score-zone")
def score_zone(input_data: ZoneScoreInput):
    """
    Computes DRS, ECC, OCI, Red Zone designation, and 3-tier relocation prioritization using:
    - 3-Pillar Evidence: Hazard Intensity (40%), Vulnerability (35%), Disaster History (25%)
    - Dynamic Risk Score: DRS = Pillar_Baseline * [ 1 + alpha * ((R_cum - R_thresh) / R_thresh) ]
    - Multi-factor Carrying Capacity: ECC = min(RCC, C_water, C_sewer, C_power, C_transport, C_evac)
    - Relocation Horizon: Immediate (<30 days), Short-Term (1-6 months), Medium-Term (6-24 months)
    """
    try:
        # 1. Three-Pillar Baseline Integration
        h_score = input_data.hazard_intensity_score if input_data.hazard_intensity_score is not None else 50.0
        v_score = input_data.vulnerability_score if input_data.vulnerability_score is not None else 50.0
        d_score = input_data.disaster_history_score if input_data.disaster_history_score is not None else 50.0

        # Weighted composite baseline
        pillar_baseline = (0.40 * h_score) + (0.35 * v_score) + (0.25 * d_score)
        base_mhi = input_data.mhi_baseline if (input_data.mhi_baseline and input_data.mhi_baseline != 50.0) else pillar_baseline

        r_cum = input_data.rainfall_mm or 0.0
        r_thresh = input_data.rainfall_thresh or 85.0
        alpha = input_data.alpha or 1.0

        if r_cum <= 0.0:
            drs = base_mhi
        elif r_cum <= r_thresh:
            sub_factor = (r_cum / r_thresh) * 0.12 * alpha
            drs = base_mhi * (1.0 + sub_factor)
        else:
            surge_ratio = (r_cum - r_thresh) / r_thresh
            drs = base_mhi * (1.0 + alpha * surge_ratio)

        # Citizen verification escalation: verified on-ground reports increase empirical severity
        if input_data.verified_hazard_reports_count > 0:
            verification_boost = min(0.20, input_data.verified_hazard_reports_count * 0.05)
            drs *= (1.0 + verification_boost)

        drs = min(100.0, max(5.0, round(drs, 1)))

        # 2. Environmental Carrying Capacity (ECC) Multi-Factor Minimization
        p_actual = input_data.population
        rcc = input_data.rcc or 8000
        lpcd = max(20.0, input_data.water_lpcd or 135.0)

        c_water = int((input_data.water_supply_mld * 1000000) / lpcd)
        c_sewer = int((input_data.sewer_treatment_mld * 1000000) / max(15.0, 0.8 * lpcd))
        c_power = int((input_data.power_mw * 1000) / 0.35)
        c_transport = int((input_data.lane_count * 1250) * input_data.target_evac_hours)
        c_evac = int(input_data.evac_flow_rate * input_data.target_evac_hours)

        capacities = [
            ("Physical Land (RCC)", rcc),
            ("Water Supply Deficit", c_water),
            ("Sewage Treatment Saturation", c_sewer),
            ("Power Substation Limit", c_power),
            ("Corridor Road Throughput", c_transport),
            ("Evacuation Route Chokepoints", c_evac),
        ]

        capacities.sort(key=lambda x: x[1])
        limiting_name, ecc = capacities[0]

        # 3. Overcapacity Index (OCI) = P_actual / ECC
        raw_oci = p_actual / max(1, ecc)
        oci = round(raw_oci, 2)
        is_overcapacity = oci > 1.0

        # 4. Zone Classification & Red Zone Status (Unsuitable for Habitation)
        is_red_zone = drs >= 70.0 or (drs >= 60.0 and is_overcapacity)
        if is_red_zone:
            classification = "red"
        elif drs >= 45.0:
            classification = "yellow"
        else:
            classification = "green"

        # 5. Relocation Priority Index (RPI Urgency Score 0-100)
        oci_factor = min(100.0, oci * 50.0)
        rpi = round(0.6 * drs + 0.4 * oci_factor, 1)
        rpi = min(100.0, max(0.0, rpi))

        # 6. Relocation Horizon Categorization (Immediate / Short-Term / Medium-Term)
        if rpi >= 75.0 or (classification == "red" and oci >= 1.3):
            relocation_tier = "immediate"
            recommended_action = "Immediate Relocation Directive (<30 Days): Critical Red Zone breach. Marshall transitional shelters & trigger Section 34 DM Act evacuation."
        elif rpi >= 60.0 or classification == "red":
            relocation_tier = "short_term"
            recommended_action = "Short-Term Pre-Monsoon Relocation (1-6 Months): High risk of recurrence. Activate priority resettlement corridors."
        elif rpi >= 40.0:
            relocation_tier = "medium_term"
            recommended_action = "Medium-Term Phased Resettlement (6-24 Months): Vulnerable habitation buffer. Schedule infrastructure expansion at alternative sites."
        else:
            relocation_tier = "monitoring"
            recommended_action = "Active Geological & Telemetry Monitoring: Habitation remains within tolerable carrying capacity limits."

        return {
            "zone_id": input_data.zone_id,
            "zone_name": input_data.zone_name,
            "hazard_type": input_data.hazard_type or "flood",
            "population": p_actual,
            "mhi_baseline": round(base_mhi, 1),
            "hazard_intensity_score": round(h_score, 1),
            "vulnerability_score": round(v_score, 1),
            "disaster_history_score": round(d_score, 1),
            "drs_score": drs,
            "ecc_capacity": ecc,
            "oci_score": oci,
            "classification": classification,
            "is_red_zone": is_red_zone,
            "relocation_tier": relocation_tier,
            "is_overcapacity": is_overcapacity,
            "limiting_factor": limiting_name,
            "rpi_urgency_score": rpi,
            "recommended_action": recommended_action,
            "capacities_breakdown": {
                "rcc": rcc,
                "c_water": c_water,
                "c_sewer": c_sewer,
                "c_power": c_power,
                "c_transport": c_transport,
                "c_evac": c_evac,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring calculation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
