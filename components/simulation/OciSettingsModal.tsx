'use client';

import React from 'react';
import {
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { HazardZone } from '@/data/hazardZones';
import {
  InfrastructureParameters,
  calculateZoneOci,
  DEFAULT_INFRASTRUCTURE_PARAMS,
} from '@/lib/engine/ociEngine';

interface OciSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: HazardZone[];
  selectedZoneId: string;
  onSelectZoneId: (id: string) => void;
  params: InfrastructureParameters;
  onParamsChange: (params: InfrastructureParameters) => void;
}

export default function OciSettingsModal({
  isOpen,
  onClose,
  zones,
  selectedZoneId,
  onSelectZoneId,
  params,
  onParamsChange,
}: OciSettingsModalProps) {
  if (!isOpen) return null;

  const currentZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const ociResult = calculateZoneOci(currentZone, params);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative z-[10000]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-accent">
              <AdjustmentsHorizontalIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">
                  Overcapacity Index (OCI) Live Calculator
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                  MoHUA Norms
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Formula: OCI = P_actual / ECC, where ECC = min(RCC, C_water, C_sewer, C_power, C_transport, C_evac)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 text-gray-500 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Zone Selector */}
          <div className="flex items-center justify-between gap-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <label className="text-sm font-semibold text-gray-700">Target Assessment Zone:</label>
            <select
              value={selectedZoneId}
              onChange={(e) => onSelectZoneId(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} (Pop: {z.population.toLocaleString('en-US')})
                </option>
              ))}
            </select>
          </div>

          {/* OCI Calculation Output Card */}
          <div className={`p-5 rounded-xl border transition-all ${
            ociResult.isOvercapacity
              ? 'bg-rose-50 border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
              : 'bg-emerald-50 border-emerald-300'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Live Status for {currentZone.name}:
                  </span>
                  {ociResult.isOvercapacity ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                      <ExclamationCircleIcon className="w-4 h-4" /> OVERCAPACITY
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-emerald-600 text-white flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" /> Within Carrying Limits
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-4xl font-black font-mono text-foreground">
                    OCI: {ociResult.oci.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {ociResult.isOvercapacity
                      ? `(${ociResult.percentOvercapacity}% over limit — Deficit: ${ociResult.populationDeficit.toLocaleString('en-US')} people)`
                      : '(Safe Headroom Available)'}
                  </span>
                </div>
              </div>

              {/* Limiting Constraint Badge */}
              <div className="p-3 bg-white/80 rounded-lg border border-current border-opacity-20 text-right">
                <span className="text-xs font-semibold text-gray-500 uppercase block">
                  Limiting Civil Factor (min ECC):
                </span>
                <span className="text-sm font-bold text-rose-700 block">
                  {ociResult.limitingFactorDescription}
                </span>
                <span className="text-xs text-gray-600">
                  Effective ECC: {ociResult.ecc.toLocaleString('en-US')} persons
                </span>
              </div>
            </div>
          </div>

          {/* Sub-Capacity Breakdown Grid */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <span>Multi-Factor Capacity Breakdown</span>
              <span className="text-xs font-normal text-gray-500">(ECC = min of all 6 factors)</span>
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'Physical Land (RCC)', val: ociResult.rcc, unit: 'persons', isLimit: ociResult.limitingFactor === 'RCC' },
                { name: 'Water Supply (C_water)', val: ociResult.cWater, unit: 'persons', isLimit: ociResult.limitingFactor === 'Water' },
                { name: 'Sewage Network (C_sewer)', val: ociResult.cSewer, unit: 'persons', isLimit: ociResult.limitingFactor === 'Sewer' },
                { name: 'Power Substation (C_power)', val: ociResult.cPower, unit: 'persons', isLimit: ociResult.limitingFactor === 'Power' },
                { name: 'Corridor Flow (C_transport)', val: ociResult.cTransport, unit: 'persons', isLimit: ociResult.limitingFactor === 'Transport' },
                { name: 'Evac Capacity (C_evac)', val: ociResult.cEvac, unit: 'persons', isLimit: ociResult.limitingFactor === 'Evacuation' },
              ].map((item) => (
                <div
                  key={item.name}
                  className={`p-3 rounded-lg border transition-all ${
                    item.isLimit
                      ? 'bg-rose-100/60 border-rose-400 ring-2 ring-rose-400/40'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span className="truncate font-medium">{item.name}</span>
                    {item.isLimit && (
                      <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-200 px-1.5 py-0.2 rounded">
                        Lowest
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold text-gray-900 font-mono">
                    {item.val.toLocaleString('en-US')} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Infrastructure Sliders */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                Adjust Infrastructure Parameters
              </h4>
              <button
                onClick={() => onParamsChange(DEFAULT_INFRASTRUCTURE_PARAMS)}
                className="text-xs text-accent hover:underline font-semibold"
              >
                Reset to MoHUA Defaults
              </button>
            </div>

            {/* Slider 1: Water LPCD */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>Water Supply Standard (LPCD):</span>
                <span className="font-mono text-accent font-bold">{params.waterLpcd} Liters/Capita/Day</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={params.waterLpcd}
                onChange={(e) => onParamsChange({ ...params, waterLpcd: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>50 LPCD (Drought/Rationed)</span>
                <span>135 LPCD (Indian Urban Norm)</span>
                <span>200 LPCD (Metro High)</span>
              </div>
            </div>

            {/* Slider 2: Road Width */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>Evacuation Arterial Road Width:</span>
                <span className="font-mono text-accent font-bold">{params.roadWidthMeters.toFixed(1)} Meters</span>
              </div>
              <input
                type="range"
                min="3.5"
                max="14.0"
                step="0.5"
                value={params.roadWidthMeters}
                onChange={(e) => onParamsChange({ ...params, roadWidthMeters: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>3.5m (Single Lane Chokepoint)</span>
                <span>7.0m (Standard 2-Lane)</span>
                <span>14.0m (4-Lane Divided Highway)</span>
              </div>
            </div>

            {/* Slider 3: Target Evacuation Window */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>Allowable Evacuation Time Window:</span>
                <span className="font-mono text-accent font-bold">{params.targetEvacHours.toFixed(1)} Hours</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.5"
                value={params.targetEvacHours}
                onChange={(e) => onParamsChange({ ...params, targetEvacHours: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>2.0 hrs (Urgent Flash Flood Alert)</span>
                <span>4.5 hrs (Standard NDMA Window)</span>
                <span>8.0 hrs (Cyclone Landfall Lead)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <InformationCircleIcon className="w-4 h-4 text-blue-500" />
            <span>Parameters apply in real-time to all monitored hazard zones</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
