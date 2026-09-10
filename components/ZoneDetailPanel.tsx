import { HazardZone } from '@/data/hazardZones';
import RiskBadge from './RiskBadge';
import { XMarkIcon, ExclamationTriangleIcon, CpuChipIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ZoneDetailPanelProps {
  zone: HazardZone;
  onClose: () => void;
  onOpenMlPredictor?: (zone: HazardZone) => void;
}

export default function ZoneDetailPanel({ zone, onClose, onOpenMlPredictor }: ZoneDetailPanelProps) {
  const capacityPercentage = ((zone.population / zone.carryingCapacity) * 100).toFixed(0);
  const exceedance = Math.max(0, zone.population - zone.carryingCapacity);

  const hazardDescriptions: Record<string, string> = {
    landslide: 'High-slope shear instability and debris flow risk on steep ghat terrain',
    flood: 'Fluvial riverbed overtopping or severe drainage inundation during monsoon',
    coastal_erosion: 'Severe shoreline scour, wave overwash, and coastal embankment loss',
    cloudburst: 'Extreme sudden convective orographic downpour causing high-velocity ravine flash floods',
    earthquake: 'High seismic ground acceleration with building collapse vulnerability',
    cyclone: 'Tropical cyclone storm surge and gale-force wind inundation',
  };

  return (
    <div className="bg-white rounded-xl shadow-hover border border-gray-200 overflow-hidden animate-slide-up flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-50 text-foreground p-6 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-semibold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {zone.state || 'India'}
              </span>
              {zone.redZoneStatus?.isRedZone && (
                <span className="text-[11px] font-bold uppercase bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded">
                  Unsuitable For Habitation
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{zone.name}</h2>
            <div className="flex items-center gap-2">
              <RiskBadge level={zone.riskLevel} />
              {zone.relocationTier && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  zone.relocationTier === 'immediate'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : zone.relocationTier === 'short_term'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {zone.relocationTier === 'immediate' ? '🚨 Immediate (<30D)' : zone.relocationTier === 'short_term' ? '⚡ Short-Term (1-6M)' : '📋 Medium-Term (6-24M)'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Red Zone Status Card if declared */}
        {zone.redZoneStatus?.isRedZone && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>OFFICIAL RED ZONE DESIGNATION</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              Area formally classified as <strong>unfit for permanent human settlement</strong> under Section 34 of the Disaster Management Act, 2005.
            </p>
            {zone.redZoneStatus.gazetteRef && (
              <div className="text-[11px] font-mono text-red-900 bg-red-100/70 px-2 py-1 rounded">
                Gazette Ref: {zone.redZoneStatus.gazetteRef} (Declared: {zone.redZoneStatus.declaredDate})
              </div>
            )}
          </div>
        )}

        {/* Hazard Info */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Multi-Hazard Threat Profile
          </h3>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-slate-900 capitalize">
                {zone.hazardType.replace(/_/g, ' ')} Threat
              </p>
              <span className="text-xs font-semibold text-accent uppercase">
                {zone.hazardType}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {hazardDescriptions[zone.hazardType] || 'Severe environmental hazard threat'}
            </p>
          </div>
        </div>

        {/* THREE-PILLAR EVIDENCE MODEL */}
        {zone.hazardIntensity && zone.populationVulnerability && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Three-Pillar Evidence Integration
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-lg">
                <p className="text-[10px] font-semibold text-orange-700 uppercase">Hazard Intensity</p>
                <p className="text-lg font-extrabold text-orange-900 mt-0.5">{zone.hazardIntensity.score}<span className="text-xs font-normal">/100</span></p>
                <p className="text-[10px] text-orange-800 line-clamp-1 mt-1 font-mono">{zone.hazardIntensity.value} {zone.hazardIntensity.unit}</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                <p className="text-[10px] font-semibold text-rose-700 uppercase">Vulnerability SVI</p>
                <p className="text-lg font-extrabold text-rose-900 mt-0.5">{zone.populationVulnerability.sviScore}<span className="text-xs font-normal">/100</span></p>
                <p className="text-[10px] text-rose-800 line-clamp-1 mt-1 font-mono">{zone.populationVulnerability.kutchaHousingPercent}% Kutcha</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-lg">
                <p className="text-[10px] font-semibold text-purple-700 uppercase">Disaster History</p>
                <p className="text-lg font-extrabold text-purple-900 mt-0.5">{zone.disasterHistory.recurrenceCount}x<span className="text-xs font-normal"> Recurr</span></p>
                <p className="text-[10px] text-purple-800 line-clamp-1 mt-1 font-mono">1 in {zone.disasterHistory.returnPeriodYears}y Return</p>
              </div>
            </div>
            {zone.disasterHistory.pastEvents?.length > 0 && (
              <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                <strong>Historical Disaster Benchmarks:</strong> {zone.disasterHistory.pastEvents.join(' • ')}
              </div>
            )}
          </div>
        )}

        {/* 72H ML PREDICTION & EXPLAINABILITY CARD */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CpuChipIcon className="w-4 h-4 text-indigo-700" />
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                72h ML Hazard Prediction
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 border border-indigo-300">
              ROC-AUC 0.94
            </span>
          </div>
          <p className="text-xs text-indigo-900 leading-relaxed">
            FastAPI Random Forest classifier forecasts 72-hour hazard breach probability with Explainable AI (XAI) feature attribution.
          </p>
          {onOpenMlPredictor && (
            <button
              onClick={() => onOpenMlPredictor(zone)}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <SparklesIcon className="w-4 h-4 text-amber-300" />
              <span>Simulate Live ML Prediction (72h Forecast) →</span>
            </button>
          )}
        </div>

        {/* Urgency & Reason */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Urgency & Assessment
          </h3>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-yellow-800 uppercase">Urgency Score</span>
              <span className="text-lg font-black text-risk-high">{zone.urgencyScore}/100</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{zone.reason}</p>
          </div>
        </div>

        {/* Population & Capacity */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Population & Capacity
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Population</p>
                <p className="text-2xl font-bold text-foreground">
                  {(zone.population / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Carrying Capacity</p>
                <p className="text-2xl font-bold text-foreground">
                  {(zone.carryingCapacity / 1000).toFixed(1)}K
                </p>
              </div>
            </div>

            {/* Capacity Status */}
            <div className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Capacity Status</span>
                <span className={`text-sm font-bold ${exceedance > 0 ? 'text-risk-high' : 'text-risk-low'}`}>
                  {capacityPercentage}%
                </span>
              </div>
              <div className="w-full bg-yellow-100 rounded-full h-3 overflow-hidden mb-2">
                <div
                  className={`h-full transition-all ${exceedance > 0 ? 'bg-risk-high' : 'bg-risk-low'}`}
                  style={{ width: `${Math.min(Number(capacityPercentage), 100)}%` }}
                ></div>
              </div>
              {exceedance > 0 && (
                <p className="text-sm text-risk-high font-semibold">
                  ⚠️ Exceeds capacity by {exceedance.toLocaleString()} people
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 p-3 bg-muted rounded-lg" suppressHydrationWarning>
          <p>Last updated: {new Date(zone.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4 bg-muted flex gap-3">
        <button className="flex-1 px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">
          View on Map
        </button>
        <button className="flex-1 px-4 py-2 bg-risk-high text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm">
          Priority Relocation
        </button>
      </div>
    </div>
  );
}
