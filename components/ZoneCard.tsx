import { HazardZone } from '@/data/hazardZones';
import RiskBadge from './RiskBadge';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ZoneCardProps {
  zone: HazardZone;
  onClick?: () => void;
  showActions?: boolean;
}

export default function ZoneCard({ zone, onClick, showActions = true }: ZoneCardProps) {
  const capacityStatus = zone.population > zone.carryingCapacity ? 'Over Capacity' : 'Within Capacity';
  const capacityPercentage = ((zone.population / zone.carryingCapacity) * 100).toFixed(0);
  const exceedance = Math.max(0, zone.population - zone.carryingCapacity);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-border rounded-xl p-5 hover:shadow-hover transition-all duration-300 hover:border-gray-300 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-risk-high transition-colors">
            {zone.name}
          </h3>
          <p className="text-xs text-gray-500 capitalize">{zone.hazardType.replace(/_/g, ' ')}</p>
        </div>
        <RiskBadge level={zone.riskLevel} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-gray-600 text-xs mb-1">Population</p>
          <p className="font-semibold text-foreground">{(zone.population / 1000).toFixed(1)}K</p>
        </div>
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-gray-600 text-xs mb-1">Capacity</p>
          <p className="font-semibold text-foreground">{(zone.carryingCapacity / 1000).toFixed(1)}K</p>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-600">Capacity Status</span>
          <span className={`text-xs font-bold ${exceedance > 0 ? 'text-risk-high' : 'text-risk-low'}`}>
            {capacityPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${exceedance > 0 ? 'bg-risk-high' : 'bg-risk-low'}`}
            style={{ width: `${Math.min(Number(capacityPercentage), 100)}%` }}
          ></div>
        </div>
        {exceedance > 0 && (
          <p className="text-xs text-risk-high font-semibold mt-1">
            Exceeds by {exceedance.toLocaleString()} people
          </p>
        )}
      </div>

      {/* Urgency Score */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-600">Urgency Score</span>
          <span className="text-lg font-bold text-risk-high">{zone.urgencyScore}</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">{zone.reason}</p>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-3 border-t border-border">
          <button className="flex-1 px-3 py-2 text-sm font-medium text-accent hover:bg-blue-50 rounded-lg transition-colors">
            View Details
          </button>
          <button className="flex-1 px-3 py-2 text-sm font-medium text-risk-high hover:bg-red-50 rounded-lg transition-colors">
            Flag for Relocation
          </button>
        </div>
      )}
    </div>
  );
}
