'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import ZonesTable from '@/components/ZonesTable';
import FilterBar from '@/components/FilterBar';
import { hazardZonesData, HazardZone } from '@/data/hazardZones';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import { useRequireAuth } from '@/lib/context/AuthContext';

export default function ZonesPage() {
  const { isAuthorized } = useRequireAuth(['authority']);
  const [selectedHazard, setSelectedHazard] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedZone, setSelectedZone] = useState<HazardZone | null>(null);

  const filteredZones = useMemo(() => {
    return hazardZonesData.filter((zone) => {
      const hazardMatch = selectedHazard === 'all' || zone.hazardType === selectedHazard;
      const riskMatch = selectedRisk === 'all' || zone.riskLevel === selectedRisk;
      return hazardMatch && riskMatch;
    });
  }, [selectedHazard, selectedRisk]);

  const stats = {
    total: filteredZones.length,
    highRisk: filteredZones.filter((z) => z.riskLevel === 'high').length,
    population: filteredZones.reduce((sum, z) => sum + z.population, 0),
    overCapacity: filteredZones.filter((z) => z.population > z.carryingCapacity).length,
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 font-medium text-sm">
          <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Verifying Authority Command Authorization...
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-3">
              <TableCellsIcon className="w-8 h-8 text-accent" />
              <h1 className="text-4xl font-bold text-foreground">Risk Zones</h1>
            </div>
            <p className="text-gray-600 max-w-2xl">
              Comprehensive list of all monitored hazard zones with detailed risk assessment, population data, and
              capacity status. Sort and filter to identify high-priority relocation targets.
            </p>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Total Zones</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">High Risk</p>
                <p className="text-2xl font-bold text-risk-high">{stats.highRisk}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Population</p>
                <p className="text-2xl font-bold text-foreground">{(stats.population / 1000).toFixed(0)}K</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Over Capacity</p>
                <p className="text-2xl font-bold text-risk-medium">{stats.overCapacity}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="mb-8">
            <FilterBar onHazardTypeChange={setSelectedHazard} onRiskLevelChange={setSelectedRisk} />
          </div>

          {/* Table */}
          {filteredZones.length > 0 ? (
            <ZonesTable zones={filteredZones} onRowClick={setSelectedZone} />
          ) : (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <p className="text-gray-600 mb-2">No zones match your filter criteria.</p>
              <p className="text-sm text-gray-500">Try adjusting the filters to see more results.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
