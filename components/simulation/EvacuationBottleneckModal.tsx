'use client';

import React from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  UsersIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { HazardZone } from '@/data/hazardZones';
import { calculateEvacuationFlow } from '@/lib/engine/evacuationFlow';

interface EvacuationBottleneckModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: HazardZone[];
  selectedZoneId: string;
  onSelectZoneId: (id: string) => void;
  onViewOnMap?: (zone: HazardZone) => void;
}

export default function EvacuationBottleneckModal({
  isOpen,
  onClose,
  zones,
  selectedZoneId,
  onSelectZoneId,
  onViewOnMap,
}: EvacuationBottleneckModalProps) {
  if (!isOpen) return null;

  const currentZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const evacResult = calculateEvacuationFlow(currentZone, 4.5);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative z-[10000]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <ExclamationTriangleIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Evacuation Network Bottleneck Engine
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">
                  Ford-Fulkerson Max-Flow
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Models road topology as a directed graph to calculate maximum egress throughput (C_evac) and min-cut chokepoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Zone Selector */}
          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="text-sm font-semibold text-gray-700">Settlement Network:</label>
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

          {/* Primary Key Stat Card (Exact prompt requirement) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-indigo-500/30">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-2">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Network Flow Verification ({currentZone.name})</span>
            </div>

            <div className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed">
              "This settlement can safely evacuate{' '}
              <span className="text-amber-300 font-black font-mono text-2xl">
                {evacResult.maxFlowPeopleHr.toLocaleString('en-US')}
              </span>{' '}
              people/hour — population is{' '}
              <span className="text-white font-black font-mono text-2xl">
                {evacResult.settlementPopulation.toLocaleString('en-US')}
              </span>{' '}
              — safe evacuation time is{' '}
              <span className={`font-black font-mono text-2xl ${
                evacResult.isDelayed ? 'text-rose-400 underline decoration-wavy' : 'text-emerald-400'
              }`}>
                {evacResult.safeEvacuationTimeHours} hours
              </span>
              "
            </div>

            {/* Threshold comparison badge */}
            <div className="mt-4 pt-3 border-t border-indigo-700/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-slate-300" />
                <span className="text-slate-300">Target Civil Evacuation Window:</span>
                <span className="font-bold text-white font-mono">{evacResult.targetThresholdHours} Hours</span>
              </div>

              {evacResult.isDelayed ? (
                <span className="px-3 py-1 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold flex items-center gap-1.5 animate-pulse">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                  CRITICAL DEFICIT: Egress exceeds safety window by +{(evacResult.safeEvacuationTimeHours - evacResult.targetThresholdHours).toFixed(1)}h
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  SAFE: Clearance within target window
                </span>
              )}
            </div>
          </div>

          {/* Bottleneck Segments List */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>Saturated Min-Cut Bottleneck Chokepoints ({evacResult.bottleneckEdges.length} detected)</span>
            </h4>

            <div className="space-y-3">
              {evacResult.bottleneckEdges.map((b) => (
                <div
                  key={b.edgeId}
                  className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 hover:border-rose-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-rose-600 text-white">
                        BOTTLENECK
                      </span>
                      <h5 className="font-bold text-gray-900 text-base">{b.roadName}</h5>
                    </div>
                    <p className="text-xs text-rose-800 font-medium">
                      ⚠️ Limitation: {b.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div className="bg-white px-3 py-2 rounded-lg border border-rose-200">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">Max Capacity</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">
                        {b.capacity.toLocaleString('en-US')} people/hr
                      </span>
                    </div>

                    <div className="bg-white px-3 py-2 rounded-lg border border-rose-200">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">Saturation</span>
                      <span className="text-sm font-black text-rose-600 font-mono">
                        {b.flowUtilizationPercent}% Saturated
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Road Network Topology Flow Details */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
              Full Network Segments & Flow Balance
            </h4>

            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                <thead className="bg-gray-100 text-gray-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Corridor Name</th>
                    <th className="px-4 py-3">Lanes / Width</th>
                    <th className="px-4 py-3">Capacity (p/hr)</th>
                    <th className="px-4 py-3">Assigned Flow (p/hr)</th>
                    <th className="px-4 py-3">Utilization</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {evacResult.allEdgesWithFlow.map(({ edge, flow, utilizationPercent, isBottleneck }) => (
                    <tr key={edge.id} className={isBottleneck ? 'bg-rose-50/50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-900">{edge.roadName}</td>
                      <td className="px-4 py-3 text-gray-600">{edge.lanes} lanes ({edge.widthMeters}m)</td>
                      <td className="px-4 py-3 font-mono text-gray-700">{edge.capacityPeopleHr.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">{flow.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                utilizationPercent >= 95 ? 'bg-rose-600' : utilizationPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${utilizationPercent}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px]">{utilizationPercent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isBottleneck ? (
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-rose-100 text-rose-700">
                            Min-Cut Chokepoint
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-medium text-[10px] uppercase bg-emerald-100 text-emerald-700">
                            Fluid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            *Red segments highlight structural bottlenecks (single-lane bridges, narrow bazaar passes) requiring immediate widening or traffic marshalling.
          </p>
          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <button
                onClick={() => {
                  onClose();
                  onViewOnMap(currentZone);
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Highlight on Interactive Map →
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
