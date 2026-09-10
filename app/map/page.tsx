'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import ZoneDetailPanel from '@/components/ZoneDetailPanel';
import { hazardZonesData, HazardZone } from '@/data/hazardZones';
import EvacuationBottleneckModal from '@/components/simulation/EvacuationBottleneckModal';
import TopsisRecommenderModal from '@/components/simulation/TopsisRecommenderModal';
import { useRequireAuth } from '@/lib/context/AuthContext';
import { MapIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
      <p className="text-gray-600 font-medium">Loading interactive map...</p>
    </div>
  ),
});

export default function MapViewPage() {
  const [selectedZone, setSelectedZone] = useState<HazardZone | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [simulatedRainfallMm, setSimulatedRainfallMm] = useState<number>(0);
  const [activeModal, setActiveModal] = useState<null | 'bottlenecks' | 'topsis'>(null);
  const [modalZoneId, setModalZoneId] = useState<string>('zone_001');

  const handleZoneClick = (zone: HazardZone) => {
    setSelectedZone(zone);
    setModalZoneId(zone.id);
    setShowPanel(true);
  };

  const handleOpenBottlenecks = (zone: HazardZone) => {
    setModalZoneId(zone.id);
    setActiveModal('bottlenecks');
  };

  const handleOpenResettlement = (zone: HazardZone) => {
    setModalZoneId(zone.id);
    setActiveModal('topsis');
  };

  const { isAuthorized } = useRequireAuth(['authority']);

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <MapIcon className="w-8 h-8 text-accent" />
                  <h1 className="text-3xl font-bold text-foreground">Interactive Hazard Map</h1>
                </div>
                <p className="text-gray-600 text-sm max-w-2xl">
                  Real-time geospatial intelligence: markers dynamically shift color (Green→Yellow→Red) as rainfall threshold is breached. Red dashed lines denote evacuation bottlenecks.
                </p>
              </div>

              {/* In-Map Rainfall Scrubber */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-indigo-500/30 flex items-center gap-3 shadow-md">
                <CloudArrowDownIcon className="w-6 h-6 text-amber-400 flex-shrink-0 animate-pulse" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-3">
                    <span className="text-slate-300 font-medium">Rainfall Simulation:</span>
                    <span className="font-mono font-bold text-amber-400">{simulatedRainfallMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="10"
                    value={simulatedRainfallMm}
                    onChange={(e) => setSimulatedRainfallMm(Number(e.target.value))}
                    className="w-40 h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
                {simulatedRainfallMm > 0 && (
                  <button
                    onClick={() => setSimulatedRainfallMm(0)}
                    className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Container */}
            <div className="lg:col-span-2">
              <div className="h-[600px] lg:h-[720px]">
                <MapView
                  zones={hazardZonesData}
                  onZoneClick={handleZoneClick}
                  selectedZone={selectedZone}
                  simulatedRainfallMm={simulatedRainfallMm}
                  showEvacuationRoutes={true}
                  onOpenBottlenecks={handleOpenBottlenecks}
                  onOpenResettlement={handleOpenResettlement}
                />
              </div>
            </div>

            {/* Legend and Info */}
            <div className="space-y-6">
              {/* Legend */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Map Legend & Indicators</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-700"></div>
                    <span className="text-gray-700">Critical / Severe Risk (DRS &ge; 85)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-600"></div>
                    <span className="text-gray-700">High Risk Zone (DRS 70 - 84)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500"></div>
                    <span className="text-gray-700">Medium Risk (DRS 45 - 69)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-700">Low Risk Baseline (DRS &lt; 45)</span>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <div className="w-5 h-5 rounded-full border-2 border-dashed border-red-600 bg-red-100"></div>
                    <span className="text-rose-700 font-bold">Pulsing Ring: OCI &gt; 1.0 (Overcapacity)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-1 border-t-2 border-dashed border-red-600"></div>
                    <span className="text-rose-700 font-bold">Red Dashed Line: Evac Chokepoint Bridge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-1 bg-blue-600"></div>
                    <span className="text-blue-700">Blue Line: Safe Evacuation Corridor</span>
                  </div>
                </div>
              </div>

              {/* Zone Details Panel */}
              {showPanel && selectedZone ? (
                <div className="space-y-4">
                  <ZoneDetailPanel
                    zone={selectedZone}
                    onClose={() => {
                      setShowPanel(false);
                      setSelectedZone(null);
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenBottlenecks(selectedZone)}
                      className="py-2 px-3 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-center transition-colors shadow-sm"
                    >
                      Route Chokepoints →
                    </button>
                    <button
                      onClick={() => handleOpenResettlement(selectedZone)}
                      className="py-2 px-3 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-center transition-colors shadow-sm"
                    >
                      TOPSIS Sites →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-muted to-white rounded-xl border border-border p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Select a Zone</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Click on any marker on the map to view detailed information about that hazard zone, including
                    risk assessment, population data, OCI status, and one-click evacuation routing.
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Hydrological Stress Analysis:</strong> Adjust the rainfall scrubber in the top bar to observe dynamic risk recalibration in real time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <EvacuationBottleneckModal
        isOpen={activeModal === 'bottlenecks'}
        onClose={() => setActiveModal(null)}
        zones={hazardZonesData}
        selectedZoneId={modalZoneId}
        onSelectZoneId={setModalZoneId}
      />

      <TopsisRecommenderModal
        isOpen={activeModal === 'topsis'}
        onClose={() => setActiveModal(null)}
        zones={hazardZonesData}
        selectedZoneId={modalZoneId}
        onSelectZoneId={setModalZoneId}
      />
    </>
  );
}

