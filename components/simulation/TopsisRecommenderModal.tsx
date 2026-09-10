'use client';

import React from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  CheckBadgeIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import { HazardZone } from '@/data/hazardZones';
import { rankResettlementSitesTopsis } from '@/lib/engine/topsisEngine';

interface TopsisRecommenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: HazardZone[];
  selectedZoneId: string;
  onSelectZoneId: (id: string) => void;
  onSelectCandidateSite?: (zoneId: string, siteName: string) => void;
}

export default function TopsisRecommenderModal({
  isOpen,
  onClose,
  zones,
  selectedZoneId,
  onSelectZoneId,
  onSelectCandidateSite,
}: TopsisRecommenderModalProps) {
  if (!isOpen) return null;

  const currentZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const rankedSites = rankResettlementSitesTopsis(currentZone);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative z-[10000]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <ScaleIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-white">
                  TOPSIS Resettlement Site Decision Support
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                  MCDM Optimization
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Technique for Order Preference by Similarity to Ideal Solution: evaluates slope, hazard clearance, road proximity & water LPCD
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
          {/* Target Zone Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-amber-50/70 rounded-xl border border-amber-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Relocation Source Zone:
              </span>
              <h4 className="text-lg font-bold text-gray-900">{currentZone.name}</h4>
              <p className="text-xs text-gray-600">
                Pop at Risk: {currentZone.population.toLocaleString('en-US')} • Hazard: {currentZone.hazardType.toUpperCase()} • Urgency: {currentZone.urgencyScore}/100
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700">Switch Zone:</label>
              <select
                value={selectedZoneId}
                onChange={(e) => onSelectZoneId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 shadow-sm focus:ring-2 focus:ring-accent"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Decision Support Explainer Banner */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <SparklesIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Why this solves the missing decision layer:</strong>
              Most disaster portals stop at showing red dots. HazardShield actively ranks safe resettlement parcels using Euclidean distance to an Ideal Best (slope &lt;15°, hazard clearance, water availability), providing civil officials with scientifically backed relocation sites in seconds.
            </div>
          </div>

          {/* Ranked Candidate Site Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rankedSites.map((item) => {
              const isTop = item.rank === 1;
              const { site } = item;

              return (
                <div
                  key={site.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                    isTop
                      ? 'bg-gradient-to-b from-emerald-50 to-white border-2 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                      : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                  }`}
                >
                  <div>
                    {/* Rank Badge & Score */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                            isTop ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          #{item.rank}
                        </span>
                        {isTop && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckBadgeIcon className="w-3 h-3 text-emerald-600" /> Optimal Choice
                          </span>
                        )}
                      </div>

                      {/* TOPSIS Score Badge */}
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold block">TOPSIS Score</span>
                        <span className="text-xl font-black font-mono text-foreground">
                          {item.topsisScore.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-900 text-base mb-0.5">{site.name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                      <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                      {site.locationName}
                    </p>

                    {/* Rationale */}
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-4 italic">
                      "{site.rationale}"
                    </p>

                    {/* Criteria Breakdown */}
                    <div className="space-y-2 mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                        Criteria Evaluation:
                      </span>
                      {item.criteriaBreakdown.map((c) => (
                        <div key={c.name} className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-600 truncate max-w-[130px]">{c.name}:</span>
                            <span className={`font-mono font-semibold ${c.isFavorable ? 'text-emerald-700' : 'text-gray-700'}`}>
                              {c.value}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                c.scorePercent >= 75 ? 'bg-emerald-500' : c.scorePercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${c.scorePercent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Key Pros / Cons */}
                    <div className="space-y-1.5 text-[11px] mb-4">
                      {item.keyAdvantages.map((adv, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-emerald-800">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{adv}</span>
                        </div>
                      ))}
                      {item.keyChallenges.map((ch, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-amber-800">
                          <span className="text-amber-600 font-bold">!</span>
                          <span>{ch}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      if (onSelectCandidateSite) {
                        onSelectCandidateSite(currentZone.id, site.name);
                      }
                      alert(`Resettlement Site Selected: ${site.name} (Score: ${item.topsisScore}). Formally assigned to ${currentZone.name} evacuation dossier.`);
                    }}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      isTop
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    Assign to DDMA Dossier →
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            *Evaluated against National Building Code (NBC-2016) and NDMA Hill Area Development Guidelines.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
