'use client';

import { HazardZone } from '@/data/hazardZones';
import RiskBadge from './RiskBadge';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ZonesTableProps {
  zones: HazardZone[];
  onRowClick?: (zone: HazardZone) => void;
}

export default function ZonesTable({ zones, onRowClick }: ZonesTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'population' | 'urgency'>('urgency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedZones = [...zones].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    switch (sortBy) {
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'risk':
        const riskOrder = { high: 3, medium: 2, low: 1 };
        aVal = riskOrder[a.riskLevel];
        bVal = riskOrder[b.riskLevel];
        break;
      case 'population':
        aVal = a.population;
        bVal = b.population;
        break;
      case 'urgency':
        aVal = a.urgencyScore;
        bVal = b.urgencyScore;
        break;
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }

    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (column: 'name' | 'risk' | 'population' | 'urgency') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left py-4 px-6">
                <button
                  onClick={() => handleSort('name')}
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-foreground transition-colors flex items-center gap-2"
                >
                  Zone Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-left py-4 px-6">
                <button
                  onClick={() => handleSort('risk')}
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-foreground transition-colors flex items-center gap-2"
                >
                  Hazard Type {sortBy === 'risk' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-left py-4 px-6">
                <button
                  onClick={() => handleSort('risk')}
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-foreground transition-colors"
                >
                  Risk Level {sortBy === 'risk' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-left py-4 px-6">
                <button
                  onClick={() => handleSort('population')}
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-foreground transition-colors"
                >
                  Population {sortBy === 'population' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-left py-4 px-6">
                <button
                  onClick={() => handleSort('urgency')}
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-foreground transition-colors"
                >
                  Urgency {sortBy === 'urgency' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-center py-4 px-6">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedZones.map((zone, idx) => {
              const capacityStatus = zone.population > zone.carryingCapacity;
              return (
                <tr
                  key={zone.id}
                  onClick={() => onRowClick?.(zone)}
                  className={`border-b border-border hover:bg-muted transition-colors cursor-pointer ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {zone.state || 'India'}
                      </span>
                      {zone.redZoneStatus?.isRedZone && (
                        <span className="text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">
                          Red Zone
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-foreground">{zone.name}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-600 capitalize">{zone.hazardType.replace(/_/g, ' ')}</p>
                  </td>
                  <td className="py-4 px-6">
                    <RiskBadge level={zone.riskLevel} />
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-foreground">{(zone.population / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-gray-500">Cap: {(zone.carryingCapacity / 1000).toFixed(1)}K</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-bold text-risk-high">{zone.urgencyScore}</p>
                      <p className={`text-xs ${capacityStatus ? 'text-risk-high' : 'text-risk-low'}`}>
                        {capacityStatus ? 'Over capacity' : 'Within capacity'}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button className="p-2 hover:bg-white rounded-lg transition-colors">
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
