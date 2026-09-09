'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import MapView from '@/components/MapView';
import ZoneDetailPanel from '@/components/ZoneDetailPanel';
import { hazardZonesData, HazardZone } from '@/data/hazardZones';
import { MapIcon } from '@heroicons/react/24/outline';

export default function MapViewPage() {
  const [selectedZone, setSelectedZone] = useState<HazardZone | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const handleZoneClick = (zone: HazardZone) => {
    setSelectedZone(zone);
    setShowPanel(true);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-3">
              <MapIcon className="w-8 h-8 text-accent" />
              <h1 className="text-4xl font-bold text-foreground">Interactive Hazard Map</h1>
            </div>
            <p className="text-gray-600 max-w-2xl">
              Visualize all monitored hazard zones on an interactive map. Click on any marker to view detailed
              information about the zone, population at risk, and relocation recommendations.
            </p>
          </div>
        </section>

        {/* Map Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Container */}
            <div className="lg:col-span-2">
              <div className="h-[600px] lg:h-[700px]">
                <MapView zones={hazardZonesData} onZoneClick={handleZoneClick} selectedZone={selectedZone} />
              </div>
            </div>

            {/* Legend and Info */}
            <div className="space-y-6">
              {/* Legend */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Map Legend</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-risk-high"></div>
                    <span className="text-sm text-gray-700">High Risk Zone</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-risk-medium"></div>
                    <span className="text-sm text-gray-700">Medium Risk Zone</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-risk-low"></div>
                    <span className="text-sm text-gray-700">Low Risk Zone</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>Marker Size:</strong> Represents population density. Larger markers indicate higher
                    population.
                  </p>
                </div>
              </div>

              {/* Zone Details Panel */}
              {showPanel && selectedZone ? (
                <ZoneDetailPanel
                  zone={selectedZone}
                  onClose={() => {
                    setShowPanel(false);
                    setSelectedZone(null);
                  }}
                />
              ) : (
                <div className="bg-gradient-to-br from-muted to-white rounded-xl border border-border p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Select a Zone</h3>
                  <p className="text-sm text-gray-600">
                    Click on any marker on the map to view detailed information about that hazard zone, including
                    risk assessment, population data, and relocation recommendations.
                  </p>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <p className="text-xs text-gray-700">
                      💡 <strong>Tip:</strong> Zones with higher urgency scores should be prioritized for relocation
                      planning.
                    </p>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-sm text-gray-600">Total Zones</span>
                    <span className="font-bold text-foreground">{hazardZonesData.length}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-sm text-gray-600">High Risk</span>
                    <span className="font-bold text-risk-high">
                      {hazardZonesData.filter((z) => z.riskLevel === 'high').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-sm text-gray-600">Total Population</span>
                    <span className="font-bold text-foreground">
                      {(hazardZonesData.reduce((sum, z) => sum + z.population, 0) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Urgency</span>
                    <span className="font-bold text-risk-medium">
                      {(
                        hazardZonesData.reduce((sum, z) => sum + z.urgencyScore, 0) / hazardZonesData.length
                      ).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
