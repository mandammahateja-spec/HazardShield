'use client';

import { useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface FilterBarProps {
  onHazardTypeChange?: (type: string) => void;
  onRiskLevelChange?: (level: string) => void;
}

export default function FilterBar({ onHazardTypeChange, onRiskLevelChange }: FilterBarProps) {
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');

  const hazardTypes = [
    { value: 'all', label: 'All Hazards' },
    { value: 'earthquake', label: 'Earthquake' },
    { value: 'flood', label: 'Flood' },
    { value: 'landslide', label: 'Landslide' },
    { value: 'cyclone', label: 'Cyclone' },
  ];

  const riskLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'high', label: 'High Risk' },
    { value: 'medium', label: 'Medium Risk' },
    { value: 'low', label: 'Low Risk' },
  ];

  const handleHazardChange = (value: string) => {
    setSelectedHazard(value);
    onHazardTypeChange?.(value);
  };

  const handleRiskChange = (value: string) => {
    setSelectedRisk(value);
    onRiskLevelChange?.(value);
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-card">
      <div className="flex items-center gap-2 mb-6">
        <FunnelIcon className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold text-foreground">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hazard Type Filter */}
        <div>
          <label htmlFor="hazard" className="block text-sm font-medium text-gray-700 mb-3">
            Hazard Type
          </label>
          <select
            id="hazard"
            value={selectedHazard}
            onChange={(e) => handleHazardChange(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          >
            {hazardTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div>
          <label htmlFor="risk" className="block text-sm font-medium text-gray-700 mb-3">
            Risk Level
          </label>
          <select
            id="risk"
            value={selectedRisk}
            onChange={(e) => handleRiskChange(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          >
            {riskLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedHazard !== 'all' || selectedRisk !== 'all') && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {selectedHazard !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-accent rounded-full text-xs font-medium">
                {hazardTypes.find((t) => t.value === selectedHazard)?.label}
              </span>
            )}
            {selectedRisk !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-risk-medium rounded-full text-xs font-medium">
                {riskLevels.find((r) => r.value === selectedRisk)?.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
