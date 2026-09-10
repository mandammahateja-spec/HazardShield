/**
 * Risk Engine Client
 * Dispatches HTTP scoring requests to the isolated Python FastAPI Risk Engine microservice.
 * Includes a zero-failure resilient fallback with identical mathematical formulation.
 */

const RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || 'http://localhost:8000';

/**
 * Embedded mathematical fallback in case FastAPI microservice is booting or offline.
 */
function computeFallbackScore(payload) {
  const mhi = payload.mhi_baseline || 50;
  const r_cum = payload.rainfall_mm || 0;
  const r_thresh = payload.rainfall_thresh || 85;
  const alpha = payload.alpha || 1.0;

  let drs = mhi;
  if (r_cum <= 0) {
    drs = mhi;
  } else if (r_cum <= r_thresh) {
    drs = mhi * (1.0 + (r_cum / r_thresh) * 0.12 * alpha);
  } else {
    drs = mhi * (1.0 + alpha * ((r_cum - r_thresh) / r_thresh));
  }

  if (payload.verified_hazard_reports_count > 0) {
    const boost = Math.min(0.20, payload.verified_hazard_reports_count * 0.05);
    drs *= (1.0 + boost);
  }

  drs = Math.min(100, Math.max(5, Math.round(drs * 10) / 10));

  const p_actual = payload.population || 10000;
  const rcc = payload.rcc || 8000;
  const lpcd = Math.max(20, payload.water_lpcd || 135);

  const c_water = Math.floor(((payload.water_supply_mld || 1.4) * 1000000) / lpcd);
  const c_sewer = Math.floor(((payload.sewer_treatment_mld || 1.1) * 1000000) / Math.max(15, 0.8 * lpcd));
  const c_power = Math.floor(((payload.power_mw || 4.0) * 1000) / 0.35);
  const c_transport = Math.floor(((payload.lane_count || 2.0) * 1250) * (payload.target_evac_hours || 4.5));
  const c_evac = Math.floor((payload.evac_flow_rate || 1800) * (payload.target_evac_hours || 4.5));

  const capacities = [
    { name: 'Physical Land (RCC)', val: rcc },
    { name: 'Water Supply Deficit', val: c_water },
    { name: 'Sewage Treatment Saturation', val: c_sewer },
    { name: 'Power Substation Limit', val: c_power },
    { name: 'Corridor Road Throughput', val: c_transport },
    { name: 'Evacuation Route Chokepoints', val: c_evac },
  ];

  capacities.sort((a, b) => a.val - b.val);
  const limiting = capacities[0];
  const ecc = limiting.val;

  const oci = Math.round((p_actual / Math.max(1, ecc)) * 100) / 100;
  const is_overcapacity = oci > 1.0;

  let classification = 'green';
  if (drs >= 70 || (drs >= 60 && is_overcapacity)) {
    classification = 'red';
  } else if (drs >= 45) {
    classification = 'yellow';
  }

  const oci_factor = Math.min(100, oci * 50);
  const rpi = Math.min(100, Math.max(0, Math.round((0.6 * drs + 0.4 * oci_factor) * 10) / 10));

  return {
    zone_id: payload.zone_id,
    zone_name: payload.zone_name,
    hazard_type: payload.hazard_type,
    population: p_actual,
    mhi_baseline: mhi,
    drs_score: drs,
    ecc_capacity: ecc,
    oci_score: oci,
    classification,
    is_overcapacity,
    limiting_factor: limiting.name,
    rpi_urgency_score: rpi,
    recommended_action: is_overcapacity && classification === 'red'
      ? 'Mandatory Phased Relocation Protocol Required (Section 34, DM Act 2005)'
      : 'Active Ward Monitoring & Drainage Inspection',
    capacities_breakdown: { rcc, c_water, c_sewer, c_power, c_transport, c_evac },
    engine_source: 'embedded_resilient_fallback',
  };
}

/**
 * Scores a zone by invoking the Python FastAPI Risk Engine.
 */
async function scoreZone(payload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${RISK_ENGINE_URL}/score-zone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      data.engine_source = 'fastapi_microservice';
      return data;
    } else {
      console.warn(`[RiskEngineClient] FastAPI returned status ${res.status}. Falling back to internal engine.`);
      return computeFallbackScore(payload);
    }
  } catch (err) {
    console.log(`[RiskEngineClient] Python microservice unavailable (${err.message}). Using resilient embedded computation.`);
    return computeFallbackScore(payload);
  }
}

/**
 * Invokes the ML hazard prediction endpoint (/predict-hazard) on the FastAPI service.
 */
async function predictHazard(payload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${RISK_ENGINE_URL}/predict-hazard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[RiskEngineClient] /predict-hazard unavailable (${err.message}). Returning fallback status.`);
  }

  return {
    hazard_probability: null,
    prediction: 'unavailable',
    risk_level: 'unknown',
    top_factors: ['ML prediction microservice offline; using deterministic baseline.'],
    model_version: null,
    status: 'fallback_unavailable',
    prediction_window_hours: 72,
    hazard_type: 'flood',
  };
}

module.exports = { scoreZone, computeFallbackScore, predictHazard };
