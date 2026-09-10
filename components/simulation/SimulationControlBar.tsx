'use client';

import React, { useState, useEffect } from 'react';
import {
  CloudArrowDownIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface SimulationControlBarProps {
  rainfallMm: number;
  onRainfallChange: (val: number) => void;
  criticalZonesCount: number;
  avgDrsIncreasePercent: number;
}

export default function SimulationControlBar({
  rainfallMm,
  onRainfallChange,
  criticalZonesCount,
  avgDrsIncreasePercent,
}: SimulationControlBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  // Auto-play simulation loop (progresses from 0 to 300mm for live simulations)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        if (rainfallMm >= 300) {
          setIsPlaying(false);
        } else {
          onRainfallChange(Math.min(300, rainfallMm + 5));
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, rainfallMm, onRainfallChange]);

  const presets = [
    { label: 'Baseline (0mm)', value: 0 },
    { label: 'Moderate (65mm)', value: 65 },
    { label: 'Monsoon Surge (140mm)', value: 140 },
    { label: 'Cloudburst Warning (260mm)', value: 260 },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-2xl border border-indigo-500/30 mb-8 transition-all">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-indigo-800/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <CloudArrowDownIcon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Live Disaster Simulation
              </h3>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Proactive Engine
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-0.5">
              Dynamically model real-time risk escalation before an event occurs — unlike static portals (Bhuvan, BHUKOSH)
            </p>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-indigo-950/80 border border-indigo-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <BoltIcon className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300">Avg Risk Delta:</span>
            <span className={`text-sm font-bold ${avgDrsIncreasePercent > 0 ? 'text-amber-300' : 'text-slate-300'}`}>
              +{avgDrsIncreasePercent}%
            </span>
          </div>

          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${
            criticalZonesCount > 0 
              ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse' 
              : 'bg-indigo-950/80 border-indigo-700/50 text-slate-300'
          }`}>
            <ExclamationTriangleIcon className="w-4 h-4 text-rose-400" />
            <span className="text-xs">Critical Alert Zones:</span>
            <span className="text-sm font-black text-white">{criticalZonesCount}</span>
          </div>

          <button
            onClick={() => setShowFormula(!showFormula)}
            className="p-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/40 text-indigo-300 transition-colors"
            title="View mathematical formulation"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Formula Explanation Drawer */}
      {showFormula && (
        <div className="mb-5 p-4 rounded-xl bg-indigo-950/90 border border-indigo-500/40 text-xs text-slate-200 animate-fadeIn">
          <div className="flex items-center justify-between font-semibold text-indigo-200 mb-2">
            <span>Dynamic Risk Score (DRS) Formulation:</span>
            <span className="font-mono text-amber-300">DRS = MHI × [ 1 + α × ((R_cum - R_thresh) / R_thresh) ]</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-300">
            <div><strong className="text-white">MHI:</strong> Multi-Hazard Baseline Index</div>
            <div><strong className="text-white">R_cum:</strong> 72-Hour Cumulative Rainfall (Slider)</div>
            <div><strong className="text-white">R_thresh:</strong> Zone Geological Threshold (75–180mm)</div>
            <div><strong className="text-white">α:</strong> Terrain Soil Saturation Sensitivity (0.7–1.3)</div>
          </div>
        </div>
      )}

      {/* Interactive Slider Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Slider Input */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              Simulate 72-hour rainfall accumulation:
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                {rainfallMm}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase">mm</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded font-medium bg-indigo-900/60 text-indigo-200 border border-indigo-700/50">
                {rainfallMm < 50 ? 'Dry / Low' : rainfallMm < 120 ? 'Moderate Inundation' : rainfallMm < 200 ? 'Severe Flash Flood' : 'Extreme Catastrophic'}
              </span>
            </div>
          </div>

          <div className="relative pt-1">
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={rainfallMm}
              onChange={(e) => onRainfallChange(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 transition-all focus:outline-none"
              style={{
                background: `linear-gradient(to right, #10B981 0%, #F59E0B ${(120 / 300) * 100}%, #DC2626 ${(220 / 300) * 100}%, #7F1D1D 100%)`,
              }}
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>0mm (Dry)</span>
              <span>75mm (Threshold)</span>
              <span>150mm (Severe)</span>
              <span>225mm (Dangerous)</span>
              <span>300mm (Cloudburst)</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Presets */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setIsPlaying(false);
                  onRainfallChange(p.value);
                }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all truncate ${
                  rainfallMm === p.value
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                    : 'bg-indigo-950/40 border-indigo-800/40 text-slate-300 hover:bg-indigo-900/50 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Play / Reset Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              {isPlaying ? (
                <>
                  <PauseIcon className="w-4 h-4" />
                  Pause Simulation
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  Auto-Play Simulation
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                onRainfallChange(0);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Reset Simulation to 0mm"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
