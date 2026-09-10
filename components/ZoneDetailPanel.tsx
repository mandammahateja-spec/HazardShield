import { HazardZone } from '@/data/hazardZones';
import RiskBadge from './RiskBadge';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ZoneDetailPanelProps {
  zone: HazardZone;
  onClose: () => void;
}

export default function ZoneDetailPanel({ zone, onClose }: ZoneDetailPanelProps) {
  const capacityPercentage = ((zone.population / zone.carryingCapacity) * 100).toFixed(0);
  const exceedance = Math.max(0, zone.population - zone.carryingCapacity);

  const hazardDescriptions = {
    earthquake: 'Seismic activity risk with potential for structural damage',
    flood: 'Riverine or coastal flooding risk during monsoon or storm surge',
    landslide: 'Slope instability and debris flow risk on steep terrain',
    cyclone: 'Tropical cyclone and severe wind risk',
  };

  return (
    <div className="bg-white rounded-xl shadow-hover border border-gray-200 overflow-hidden animate-slide-up flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-muted to-white p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{zone.name}</h2>
            <RiskBadge level={zone.riskLevel} />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Hazard Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Hazard Information
          </h3>
          <div className="bg-muted p-4 rounded-lg border border-border">
            <p className="text-sm font-semibold text-foreground capitalize mb-2">
              {zone.hazardType.replace(/_/g, ' ')} Risk
            </p>
            <p className="text-sm text-gray-600">{hazardDescriptions[zone.hazardType]}</p>
          </div>
        </div>

        {/* Risk Score */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Urgency & Assessment
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Urgency Score</span>
              <span className="text-2xl font-bold text-risk-high">{zone.urgencyScore}/100</span>
            </div>
            <div className="text-sm text-gray-600 p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1 text-foreground">Reason for Urgency:</p>
              <p>{zone.reason}</p>
            </div>
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
