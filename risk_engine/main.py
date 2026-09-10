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
    drs_score: float
    ecc_capacity: int
    oci_score: float
    classification: str
    is_overcapacity: bool = Field(alias="is_overcapacity")
    limiting_factor: str
    rpi_urgency_score: float
    recommended_action: str
    capacities_breakdown: dict

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HazardShield Risk Engine Microservice",
        "framework": "FastAPI",
        "version": "1.0.0"
    }

@app.post("/score-zone")
def score_zone(input_data: ZoneScoreInput):
    """
    Computes DRS, ECC, and OCI using the formalized mathematical models:
    - DRS = MHI * [ 1 + alpha * ((R_cum - R_thresh) / R_thresh) ]
    - ECC = min(RCC, C_water, C_sewer, C_power, C_transport, C_evac)
    - OCI = P_actual / ECC
    """
    try:
        # 1. Dynamic Risk Score (DRS) Calculation
        mhi = input_data.mhi_baseline or 50.0
        r_cum = input_data.rainfall_mm or 0.0
        r_thresh = input_data.rainfall_thresh or 85.0
        alpha = input_data.alpha or 1.0

        if r_cum <= 0.0:
            drs = mhi
        elif r_cum <= r_thresh:
            sub_factor = (r_cum / r_thresh) * 0.12 * alpha
            drs = mhi * (1.0 + sub_factor)
        else:
            surge_ratio = (r_cum - r_thresh) / r_thresh
            drs = mhi * (1.0 + alpha * surge_ratio)

        # Citizen verification escalation: verified on-ground reports increase empirical severity
        if input_data.verified_hazard_reports_count > 0:
            verification_boost = min(0.20, input_data.verified_hazard_reports_count * 0.05)
            drs *= (1.0 + verification_boost)

        drs = min(100.0, max(5.0, round(drs, 1)))

        # 2. Environmental Carrying Capacity (ECC) Multi-Factor Minimization
        p_actual = input_data.population
        rcc = input_data.rcc or 8000
        lpcd = max(20.0, input_data.water_lpcd or 135.0)

        # C_water = (MLD * 10^6) / LPCD
        c_water = int((input_data.water_supply_mld * 1000000) / lpcd)
        # C_sewer = (MLD * 10^6) / (0.8 * LPCD)
        c_sewer = int((input_data.sewer_treatment_mld * 1000000) / max(15.0, 0.8 * lpcd))
        # C_power = (MW * 1000 kW) / 0.35 kW per capita
        c_power = int((input_data.power_mw * 1000) / 0.35)
        # C_transport = (Lanes * 1250 p/hr) * target_evac_hours
        c_transport = int((input_data.lane_count * 1250) * input_data.target_evac_hours)
        # C_evac = evac_flow_rate * target_evac_hours
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

        # 4. Zone Classification
        if drs >= 70.0 or (drs >= 60.0 and is_overcapacity):
            classification = "red"
        elif drs >= 45.0:
            classification = "yellow"
        else:
            classification = "green"

        # 5. Relocation Priority Index (RPI Urgency Score 0-100)
        oci_factor = min(100.0, oci * 50.0)
        rpi = round(0.6 * drs + 0.4 * oci_factor, 1)
        rpi = min(100.0, max(0.0, rpi))

        if classification == "red" and is_overcapacity:
            recommended_action = "Mandatory Phased Relocation Protocol Required (Section 34, DM Act 2005)"
        elif classification == "red":
            recommended_action = "Pre-emptive Evacuation Standby & Route Marshalling"
        elif classification == "yellow":
            recommended_action = "Active Ward Monitoring & Drainage Inspection"
        else:
            recommended_action = "Routine Environmental Observation"

        return {
            "zone_id": input_data.zone_id,
            "zone_name": input_data.zone_name,
            "hazard_type": input_data.hazard_type,
            "population": p_actual,
            "mhi_baseline": mhi,
            "drs_score": drs,
            "ecc_capacity": ecc,
            "oci_score": oci,
            "classification": classification,
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
