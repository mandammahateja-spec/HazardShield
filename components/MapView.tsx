'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { HazardZone } from '@/data/hazardZones';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { calculateAllZonesDrs } from '@/lib/engine/drsCalculator';
import { calculateAllZonesOci, DEFAULT_INFRASTRUCTURE_PARAMS } from '@/lib/engine/ociEngine';
import { EVACUATION_GRAPHS } from '@/lib/engine/evacuationFlow';

interface MapViewProps {
  zones: HazardZone[];
  onZoneClick?: (zone: HazardZone) => void;
  selectedZone?: HazardZone | null;
  simulatedRainfallMm?: number;
  showEvacuationRoutes?: boolean;
  onOpenBottlenecks?: (zone: HazardZone) => void;
  onOpenResettlement?: (zone: HazardZone) => void;
}
export default function MapView({
  zones,
  onZoneClick,
  selectedZone,
  simulatedRainfallMm = 0,
  showEvacuationRoutes = true,
  onOpenBottlenecks,
  onOpenResettlement,
}: MapViewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Compute live DRS and OCI for all zones
  const drsMap = calculateAllZonesDrs(zones, simulatedRainfallMm);
  const ociMap = calculateAllZonesOci(zones, DEFAULT_INFRASTRUCTURE_PARAMS);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  const center: LatLngExpression = [19.0760, 72.8777];

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border shadow-card relative isolate z-0">
      {/* Simulation Overlay Pill */}
      {simulatedRainfallMm > 0 && (
        <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 text-white text-xs font-mono px-3 py-1.5 rounded-full border border-amber-400/50 shadow-lg flex items-center gap-2 backdrop-blur-sm pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>DRS Simulated Rain: <strong>{simulatedRainfallMm}mm</strong></span>
        </div>
      )}

      <MapContainer center={center} zoom={11} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Evacuation Route Polylines & Bottleneck Highlights */}
        {showEvacuationRoutes && Object.values(EVACUATION_GRAPHS).map((graph) => (
          <div key={graph.zoneId}>
            {graph.edges.map((edge) => {
              const isChokepoint = !!edge.bottleneckReason;
              return (
                <Polyline
                  key={edge.id}
                  positions={edge.pathCoordinates}
                  pathOptions={{
                    color: isChokepoint ? '#DC2626' : '#2563EB',
                    weight: isChokepoint ? 4 : 2.5,
                    dashArray: isChokepoint ? '6, 6' : undefined,
                    opacity: isChokepoint ? 0.95 : 0.6,
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs">
                      <strong>{edge.roadName}</strong>
                      <p className="text-[10px] text-gray-600">Capacity: {edge.capacityPeopleHr.toLocaleString()} p/hr</p>
                      {isChokepoint && (
                        <p className="text-[10px] text-red-600 font-bold">⚠️ Bottleneck: {edge.bottleneckReason}</p>
                      )}
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })}
          </div>
        ))}

        {/* Zone Markers */}
        {zones.map((zone) => {
          const drs = drsMap[zone.id];
          const oci = ociMap[zone.id];
          const markerColor = drs?.riskColor || '#DC2626';
          const isSelected = selectedZone?.id === zone.id;
          const isOver = oci?.isOvercapacity;

          return (
            <div key={zone.id}>
              {/* Pulsing Outer Ring for Overcapacity (OCI > 1.0) */}
              {isOver && (
                <CircleMarker
                  center={zone.coordinates}
                  radius={Math.sqrt(zone.population / 100) + 8}
                  pathOptions={{
                    color: '#DC2626',
                    fillColor: '#EF4444',
                    weight: 2,
                    dashArray: '3, 4',
                    opacity: 0.8,
                    fillOpacity: 0.15,
                  }}
                />
              )}

              {/* Main Zone Risk Marker */}
              <CircleMarker
                center={zone.coordinates}
                radius={Math.sqrt(zone.population / 100)}
                pathOptions={{
                  fillColor: markerColor,
                  color: isSelected ? '#1E3A8A' : markerColor,
                  weight: isSelected ? 4 : 2,
                  opacity: 0.9,
                  fillOpacity: isSelected ? 0.95 : 0.75,
                }}
                eventHandlers={{
                  click: () => onZoneClick?.(zone),
                }}
              >
                <Popup>
                  <div className="w-56 p-1">
                    <div className="flex items-center justify-between border-b pb-1 mb-2">
                      <h3 className="font-bold text-gray-900 text-sm">{zone.name}</h3>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-black uppercase text-white"
                        style={{ backgroundColor: markerColor }}
                      >
                        {drs?.riskLevel || zone.riskLevel}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-700">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Simulated DRS:</span>
                        <span className="font-mono font-bold" style={{ color: markerColor }}>
                          {drs?.drs.toFixed(1)} / 100 ({drs?.percentageChange >= 0 ? `+${drs?.percentageChange}%` : `${drs?.percentageChange}%`})
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-600">Overcapacity Index:</span>
                        <span className={`font-mono font-bold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
                          OCI: {oci?.oci.toFixed(2)} {isOver && '⚠️'}
                        </span>
                      </div>

                      {isOver && (
                        <div className="text-[10px] text-red-600 font-semibold bg-red-50 p-1 rounded">
                          Bottleneck: {oci?.limitingFactorDescription}
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Population:</span>
                        <span className="font-mono">{(zone.population / 1000).toFixed(1)}K</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Carrying Limit:</span>
                        <span className="font-mono">{(oci?.ecc / 1000).toFixed(1)}K ECC</span>
                      </div>
                    </div>

                    {/* Action Links */}
                    <div className="mt-3 pt-2 border-t flex flex-col gap-1 text-[11px]">
                      {onOpenBottlenecks && (
                        <button
                          onClick={() => onOpenBottlenecks(zone)}
                          className="w-full py-1 text-center font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors"
                        >
                          Inspect Evacuation Bottlenecks →
                        </button>
                      )}
                      {onOpenResettlement && (
                        <button
                          onClick={() => onOpenResettlement(zone)}
                          className="w-full py-1 text-center font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                        >
                          TOPSIS Resettlement Sites →
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}

