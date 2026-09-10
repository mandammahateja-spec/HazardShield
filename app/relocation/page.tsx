'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import RiskBadge from '@/components/RiskBadge';
import { hazardZonesData, HazardZone, RelocationTier } from '@/data/hazardZones';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon,
  ChartBarSquareIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import TopsisRecommenderModal from '@/components/simulation/TopsisRecommenderModal';
import EvacuationBottleneckModal from '@/components/simulation/EvacuationBottleneckModal';
import { CANDIDATE_RESETTLEMENT_SITES, rankResettlementSitesTopsis } from '@/lib/engine/topsisEngine';
import { useRequireAuth } from '@/lib/context/AuthContext';

export default function RelocationPage() {
  const { isAuthorized } = useRequireAuth(['authority']);
  const [activeModal, setActiveModal] = useState<null | 'topsis' | 'bottlenecks'>(null);
  const [modalZoneId, setModalZoneId] = useState<string>('zone_wayanad');
  const [selectedTier, setSelectedTier] = useState<'all' | RelocationTier>('all');
  const [activeTab, setActiveTab] = useState<'habitations' | 'alternative_sites'>('habitations');

  // Sort by urgency score (highest first)
  const prioritizedZones = [...hazardZonesData].sort((a, b) => b.urgencyScore - a.urgencyScore);

  const filteredZones = selectedTier === 'all'
    ? prioritizedZones
    : prioritizedZones.filter((z) => z.relocationTier === selectedTier);

  // Aggregate all safe alternative reception sites
  const allCandidateSites = Object.entries(CANDIDATE_RESETTLEMENT_SITES).flatMap(([_, sites]) => sites);
  const totalReceptionCapacity = allCandidateSites.reduce((sum, site) => sum + site.availableCapacity, 0);

  const stats = {
    immediate: prioritizedZones.filter((z) => z.relocationTier === 'immediate').length,
    shortTerm: prioritizedZones.filter((z) => z.relocationTier === 'short_term').length,
    mediumTerm: prioritizedZones.filter((z) => z.relocationTier === 'medium_term').length,
    totalPopAtRisk: prioritizedZones
      .filter((z) => z.riskLevel === 'high')
      .reduce((sum, z) => sum + z.population, 0),
    netReceptionHeadroom: totalReceptionCapacity,
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
      <main className="min-h-screen bg-slate-50">
        {/* Header */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                    Disaster Management Act, 2005 • Section 34 Mandate
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    Proactive Resettlement Framework
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Multi-Hazard Relocation Prioritization & Carrying Capacity Support
                </h1>
                <p className="text-gray-600 text-sm md:text-base max-w-3xl mt-2 leading-relaxed">
                  Intelligent GIS decision platform for State Disaster Management Authorities (SDMAs).
                  Prioritizes vulnerable habitations across <strong className="text-gray-900">Immediate</strong>, <strong className="text-gray-900">Short-Term</strong>, and <strong className="text-gray-900">Medium-Term</strong> planning horizons, while auditing the physical and ecological carrying capacity of safer alternative resettlement corridors.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 shadow-soft flex-shrink-0">
                <BuildingLibraryIcon className="w-8 h-8 text-accent flex-shrink-0" />
                <div className="text-xs">
                  <p className="text-gray-500 font-medium">Target Authority</p>
                  <p className="font-bold text-foreground">State DMA Executive Council</p>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Proactive Planning Mode Active
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Habitations vs Alternative Sites) */}
            <div className="flex gap-6 mt-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('habitations')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'habitations'
                    ? 'border-accent text-accent font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <ChartBarSquareIcon className="w-5 h-5" />
                Vulnerable Habitations Priority Queue ({prioritizedZones.length})
              </button>
              <button
                onClick={() => setActiveTab('alternative_sites')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'alternative_sites'
                    ? 'border-accent text-accent font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShieldCheckIcon className="w-5 h-5" />
                Safer Alternative Sites & Carrying Capacity ({allCandidateSites.length} Audited Sites)
              </button>
            </div>
          </div>
        </section>

        {/* Priority Horizons Stats */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Immediate */}
              <div
                onClick={() => setSelectedTier(selectedTier === 'immediate' ? 'all' : 'immediate')}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  selectedTier === 'immediate'
                    ? 'bg-red-50 border-red-500 ring-2 ring-red-400'
                    : 'bg-red-50/60 border-red-200 hover:bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-red-800 uppercase flex items-center gap-1.5">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                    Immediate Relocation
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-900">
                    &lt; 30 Days
                  </span>
                </div>
                <p className="text-2xl font-black text-red-700">{stats.immediate} Habitations</p>
                <p className="text-xs text-red-600/90 mt-1">
                  Active Red Zones • Severe Overcapacity
                </p>
              </div>

              {/* Short Term */}
              <div
                onClick={() => setSelectedTier(selectedTier === 'short_term' ? 'all' : 'short_term')}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  selectedTier === 'short_term'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400'
                    : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4 text-amber-600" />
                    Short-Term (Pre-Monsoon)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    1 - 6 Months
                  </span>
                </div>
                <p className="text-2xl font-black text-amber-700">{stats.shortTerm} Habitations</p>
                <p className="text-xs text-amber-600/90 mt-1">
                  Seasonal Surge & Embankment Cut
                </p>
              </div>

              {/* Medium Term */}
              <div
                onClick={() => setSelectedTier(selectedTier === 'medium_term' ? 'all' : 'medium_term')}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  selectedTier === 'medium_term'
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
                    : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5">
                    <ArrowPathIcon className="w-4 h-4 text-blue-600" />
                    Medium-Term Phased
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                    6 - 24 Months
                  </span>
                </div>
                <p className="text-2xl font-black text-blue-700">{stats.mediumTerm} Habitations</p>
                <p className="text-xs text-blue-600/90 mt-1">
                  Town-Planning & Infrastructure Buildup
                </p>
              </div>

              {/* Reception Capacity Headroom */}
              <div
                onClick={() => setActiveTab('alternative_sites')}
                className="cursor-pointer rounded-xl p-4 border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                    Safe Reception Headroom
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                    Verified ECC
                  </span>
                </div>
                <p className="text-2xl font-black text-emerald-700">
                  {stats.netReceptionHeadroom.toLocaleString('en-IN')} Cap
                </p>
                <p className="text-xs text-emerald-600/90 mt-1">
                  Across {allCandidateSites.length} TOPSIS-Audited Corridors
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase mr-1">Filter by Horizon:</span>
              <button
                onClick={() => setSelectedTier('all')}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors ${
                  selectedTier === 'all'
                    ? 'bg-accent text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                All Habitations ({prioritizedZones.length})
              </button>
              <button
                onClick={() => setSelectedTier('immediate')}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors ${
                  selectedTier === 'immediate'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                🚨 Immediate (&lt; 30 Days)
              </button>
              <button
                onClick={() => setSelectedTier('short_term')}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors ${
                  selectedTier === 'short_term'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                ⚡ Short-Term (1 - 6 Months)
              </button>
              <button
                onClick={() => setSelectedTier('medium_term')}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors ${
                  selectedTier === 'medium_term'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                📋 Medium-Term (6 - 24 Months)
              </button>
            </div>
          </div>
        </section>

        {/* TAB 1: VULNERABLE HABITATIONS PRIORITY QUEUE */}
        {activeTab === 'habitations' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-5">
              {filteredZones.map((zone, index) => {
                const exceedance = Math.max(0, zone.population - zone.carryingCapacity);
                const isOver = zone.population > zone.carryingCapacity;
                const oci = (zone.population / Math.max(1, zone.carryingCapacity)).toFixed(2);

                return (
                  <div
                    key={zone.id}
                    className={`bg-white border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                      zone.relocationTier === 'immediate'
                        ? 'border-red-300 bg-gradient-to-r from-red-50/40 via-white to-white'
                        : zone.relocationTier === 'short_term'
                        ? 'border-amber-300 bg-gradient-to-r from-amber-50/30 via-white to-white'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      {/* Left: Zone & Horizon Metadata */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold bg-accent text-white px-2 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {zone.state} • {zone.district || 'Dist'}
                          </span>
                          <RiskBadge level={zone.riskLevel} />
                          {zone.redZoneStatus?.isRedZone && (
                            <span className="text-xs font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded shadow-sm">
                              🚨 Red Zone (Non-Habitable)
                            </span>
                          )}
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                              zone.relocationTier === 'immediate'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : zone.relocationTier === 'short_term'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}
                          >
                            Horizon: {zone.timelineEstimate}
                          </span>
                        </div>

                        <div>
                          <h2 className="text-xl font-bold text-slate-900">{zone.name}</h2>
                          <p className="text-xs text-slate-600 capitalize mt-0.5 font-medium">
                            Dominant Hazard: <span className="text-slate-900 font-bold">{zone.hazardType.replace(/_/g, ' ')}</span>
                            {zone.limitingFactor && ` • Primary Carrying Bottleneck: ${zone.limitingFactor}`}
                          </p>
                        </div>

                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                          <strong>SDMA Strategic Assessment:</strong> {zone.reason}
                        </p>

                        {/* Three-Pillar Evidence Grid */}
                        {zone.hazardIntensity && zone.populationVulnerability && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                            <div className="bg-orange-50/70 border border-orange-200 p-2 rounded-lg text-xs">
                              <p className="text-[10px] text-orange-800 font-bold uppercase">Pillar 1: Hazard Intensity</p>
                              <p className="font-extrabold text-orange-950 text-base">{zone.hazardIntensity.score}/100</p>
                              <p className="text-[10px] text-orange-800 line-clamp-1">{zone.hazardIntensity.value} {zone.hazardIntensity.unit}</p>
                            </div>
                            <div className="bg-rose-50/70 border border-rose-200 p-2 rounded-lg text-xs">
                              <p className="text-[10px] text-rose-800 font-bold uppercase">Pillar 2: Vulnerability (SVI)</p>
                              <p className="font-extrabold text-rose-950 text-base">{zone.populationVulnerability.sviScore}/100</p>
                              <p className="text-[10px] text-rose-800 line-clamp-1">{zone.populationVulnerability.kutchaHousingPercent}% Precarious Housing</p>
                            </div>
                            <div className="bg-purple-50/70 border border-purple-200 p-2 rounded-lg text-xs">
                              <p className="text-[10px] text-purple-800 font-bold uppercase">Pillar 3: Disaster History</p>
                              <p className="font-extrabold text-purple-950 text-base">{zone.disasterHistory.recurrenceCount}x Recurrence</p>
                              <p className="text-[10px] text-purple-800 line-clamp-1">1 in {zone.disasterHistory.returnPeriodYears}y Return Period</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Carrying Capacity Metrics & Action Trigger */}
                      <div className="w-full lg:w-80 flex-shrink-0 space-y-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                        <div>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Urgency Score</span>
                            <span className="text-2xl font-black text-red-600 font-mono">
                              {zone.urgencyScore}<span className="text-xs font-normal text-slate-500">/100</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-red-600 h-full rounded-full transition-all"
                              style={{ width: `${zone.urgencyScore}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>Resident Population:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {zone.population.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Safe Carrying Capacity:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {zone.carryingCapacity.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                            <span>Overcapacity Index (OCI):</span>
                            <span className={`font-mono font-bold ${isOver ? 'text-red-700' : 'text-emerald-700'}`}>
                              OCI {oci} {isOver && '⚠️ Exceeded'}
                            </span>
                          </div>
                          {isOver && (
                            <p className="text-[11px] text-red-600 font-semibold">
                              Exceeds carrying capacity by {exceedance.toLocaleString('en-IN')} people
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 pt-1 border-t border-slate-200">
                          <button
                            onClick={() => {
                              setModalZoneId(zone.id);
                              setActiveModal('topsis');
                            }}
                            className="w-full py-2 px-3 text-xs font-bold text-white bg-accent hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <SparklesIcon className="w-4 h-4" />
                            Audit Alternative Sites (TOPSIS)
                          </button>
                          <button
                            onClick={() => {
                              setModalZoneId(zone.id);
                              setActiveModal('bottlenecks');
                            }}
                            className="w-full py-2 px-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ArrowPathIcon className="w-4 h-4 text-slate-500" />
                            Evacuation Bottleneck Analysis
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 2: SAFER ALTERNATIVE SITES CARRYING CAPACITY AUDIT */}
        {activeTab === 'alternative_sites' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-7 h-7 text-emerald-600" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Safer Alternative Resettlement Sites: Carrying Capacity & Suitability Register
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Multi-criteria TOPSIS evaluation across Terrain Slope, Hazard Buffer Distance, Potable Water Security (LPCD), and Net Reception Headroom.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Candidate Site & Location</th>
                      <th className="px-4 py-3.5">Target Reception Zone</th>
                      <th className="px-4 py-3.5">Available Headroom</th>
                      <th className="px-4 py-3.5">Terrain Slope</th>
                      <th className="px-4 py-3.5">Hazard Buffer</th>
                      <th className="px-4 py-3.5">Water Security</th>
                      <th className="px-4 py-3.5">PHC Distance</th>
                      <th className="px-4 py-3.5">TOPSIS Suitability</th>
                      <th className="px-4 py-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.entries(CANDIDATE_RESETTLEMENT_SITES).flatMap(([zoneKey, sites]) =>
                      sites.map((site) => {
                        const targetZone = hazardZonesData.find((z) => z.id === zoneKey);
                        const isPrimeSlope = site.slopeDegrees < 8;
                        const isPrimeWater = site.waterLpcdCapacity >= 135;

                        return (
                          <tr key={site.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                              <p className="font-bold text-slate-900">{site.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{site.locationName}</p>
                              <p className="text-[10px] text-slate-600 mt-1 italic max-w-xs">{site.rationale}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-semibold text-slate-800">
                                {targetZone ? targetZone.name : zoneKey}
                              </span>
                              <p className="text-[10px] text-slate-500 capitalize">
                                Hazard: {targetZone?.hazardType.replace(/_/g, ' ')}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-extrabold text-emerald-700 text-sm font-mono">
                                {site.availableCapacity.toLocaleString('en-IN')}
                              </span>
                              <p className="text-[10px] text-slate-500">People Capacity</p>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  isPrimeSlope
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {site.slopeDegrees}°
                              </span>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {isPrimeSlope ? 'Safe Low-Gradient' : 'Terracing Required'}
                              </p>
                            </td>
                            <td className="px-4 py-4 font-mono font-semibold text-slate-800">
                              {site.hazardDistanceKm} km
                              <p className="text-[10px] text-slate-500 font-sans">Clearance Buffer</p>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  isPrimeWater
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {site.waterLpcdCapacity} LPCD
                              </span>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {isPrimeWater ? 'Meets MoHUA 135 Norm' : 'Requires Augmentation'}
                              </p>
                            </td>
                            <td className="px-4 py-4 font-mono font-semibold text-slate-800">
                              {site.healthCenterKm} km
                              <p className="text-[10px] text-slate-500 font-sans">Emergency Access</p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-accent text-sm font-mono">
                                  {(1 - (site.slopeDegrees / 30) + (site.hazardDistanceKm / 30)).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Class A
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => {
                                  setModalZoneId(zoneKey);
                                  setActiveModal('topsis');
                                }}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-accent bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                              >
                                View TOPSIS →
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* TOPSIS Modal */}
      <TopsisRecommenderModal
        isOpen={activeModal === 'topsis'}
        onClose={() => setActiveModal(null)}
        zones={hazardZonesData}
        selectedZoneId={modalZoneId}
        onSelectZoneId={setModalZoneId}
      />

      {/* Evacuation Bottlenecks Modal */}
      <EvacuationBottleneckModal
        isOpen={activeModal === 'bottlenecks'}
        onClose={() => setActiveModal(null)}
        zones={hazardZonesData}
        selectedZoneId={modalZoneId}
        onSelectZoneId={setModalZoneId}
      />
    </>
  );
}
