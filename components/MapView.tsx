'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { HazardZone } from '@/data/hazardZones';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

interface MapViewProps {
  zones: HazardZone[];
  onZoneClick?: (zone: HazardZone) => void;
  selectedZone?: HazardZone | null;
}

export default function MapView({ zones, onZoneClick, selectedZone }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  };

  const center: LatLngExpression = [19.0760, 72.8777];

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border shadow-card">
      <MapContainer center={center} zoom={11} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {zones.map((zone) => (
          <CircleMarker
            key={zone.id}
            center={zone.coordinates}
            radius={Math.sqrt(zone.population / 100)}
            pathOptions={{
              fillColor: getRiskColor(zone.riskLevel),
              color: getRiskColor(zone.riskLevel),
              weight: selectedZone?.id === zone.id ? 3 : 2,
              opacity: 0.8,
              fillOpacity: selectedZone?.id === zone.id ? 0.9 : 0.7,
            }}
            eventHandlers={{
              click: () => onZoneClick?.(zone),
            }}
          >
            <Popup>
              <div className="w-48">
                <h3 className="font-bold text-foreground mb-2">{zone.name}</h3>
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="font-semibold text-gray-700">Hazard:</span>{' '}
                    <span className="capitalize">{zone.hazardType.replace(/_/g, ' ')}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Risk:</span>{' '}
                    <span className="capitalize">{zone.riskLevel}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Population:</span>{' '}
                    {(zone.population / 1000).toFixed(1)}K
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Capacity:</span>{' '}
                    {(zone.carryingCapacity / 1000).toFixed(1)}K
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Urgency:</span> {zone.urgencyScore}/100
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
