'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import SummaryCard from '@/components/SummaryCard';
import ZoneCard from '@/components/ZoneCard';
import { hazardZonesData, HazardZone } from '@/data/hazardZones';
import {
  MapPinIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  PaperAirplaneIcon,
  ScaleIcon,
  DocumentArrowDownIcon,
  SpeakerWaveIcon,
  BuildingOffice2Icon,
  BellAlertIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/context/AuthContext';

// Engine & Simulation imports
import { calculateAllZonesDrs } from '@/lib/engine/drsCalculator';
import { calculateAllZonesOci, DEFAULT_INFRASTRUCTURE_PARAMS, InfrastructureParameters } from '@/lib/engine/ociEngine';
import OciSettingsModal from '@/components/simulation/OciSettingsModal';
import EvacuationBottleneckModal from '@/components/simulation/EvacuationBottleneckModal';
import TopsisRecommenderModal from '@/components/simulation/TopsisRecommenderModal';
import DdmaReportModal from '@/components/simulation/DdmaReportModal';
import VoiceAlertModal from '@/components/simulation/VoiceAlertModal';
import JoshimathCaseStudyModal from '@/components/simulation/JoshimathCaseStudyModal';

export default function Dashboard() {
  // Simulation & Modal States
  const [simulatedRainfallMm, setSimulatedRainfallMm] = useState<number>(0);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone_001');
  const [infrastructureParams, setInfrastructureParams] = useState<InfrastructureParameters>(DEFAULT_INFRASTRUCTURE_PARAMS);
  const [activeModal, setActiveModal] = useState<
    null | 'oci' | 'bottlenecks' | 'topsis' | 'ddma' | 'voice' | 'joshimath'
  >(null);

  // Dynamic real-time calculations using core engines
  const drsMap = calculateAllZonesDrs(hazardZonesData, simulatedRainfallMm);
  const ociMap = calculateAllZonesOci(hazardZonesData, infrastructureParams);

  // Re-rank zones in real time based on Dynamic Risk Score (DRS)
  const prioritizedZones = [...hazardZonesData].sort((a, b) => {
    const drsA = drsMap[a.id]?.drs || a.urgencyScore;
    const drsB = drsMap[b.id]?.drs || b.urgencyScore;
    return drsB - drsA;
  });

  const topRiskZones = prioritizedZones.slice(0, 3);

  // Dynamic summary statistics
  const totalZones = hazardZonesData.length;
  const criticalDrsZones = hazardZonesData.filter((z) => (drsMap[z.id]?.drs || z.urgencyScore) >= 70);
  const totalPopulation = hazardZonesData.reduce((sum, z) => sum + z.population, 0);
  const dynamicPopulationAtRisk = hazardZonesData
    .filter((z) => (drsMap[z.id]?.drs || z.urgencyScore) >= 60 || ociMap[z.id]?.isOvercapacity)
    .reduce((sum, z) => sum + z.population, 0);
  const overcapacityCount = Object.values(ociMap).filter((o) => o.isOvercapacity).length;

  const totalBaseline = hazardZonesData.reduce((sum, z) => sum + (drsMap[z.id]?.baselineScore || z.urgencyScore), 0);
  const totalCurrentDrs = hazardZonesData.reduce((sum, z) => sum + (drsMap[z.id]?.drs || z.urgencyScore), 0);
  const avgDrsIncrease = Math.round(((totalCurrentDrs - totalBaseline) / totalBaseline) * 100);

  const selectedZone = hazardZonesData.find((z) => z.id === selectedZoneId) || hazardZonesData[0];

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    National Hazard Governance
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Operational
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-9 h-9 text-accent flex-shrink-0" />
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    HazardShield Platform
                  </h1>
                </div>
                <p className="text-gray-600 mt-2 max-w-2xl text-sm md:text-base">
                  AI-powered geospatial intelligence for real-time hazard identification, carrying capacity (OCI) calculation, and resettlement planning.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveModal('ddma')}
                  className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg border border-gray-300 shadow-soft transition-colors flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 text-gray-500" />
                  Generate DDMA Report
                </button>
                <button
                  onClick={() => setActiveModal('voice')}
                  className="px-4 py-2.5 bg-accent hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-soft transition-colors flex items-center gap-2"
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                  Voice/SMS Alert
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Summary Cards */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Monitored Zones"
                value={totalZones}
                icon={<MapPinIcon className="w-8 h-8" />}
                color="blue"
                subtitle="Active sensory streams"
              />
              <SummaryCard
                title="Critical Alert Zones"
                value={criticalDrsZones.length}
                icon={<ExclamationTriangleIcon className="w-8 h-8" />}
                color="red"
                trend={simulatedRainfallMm > 0 ? 'up' : undefined}
                trendValue={simulatedRainfallMm > 0 ? `+${simulatedRainfallMm}mm Rainfall Surge` : 'Baseline Risk'}
              />
              <SummaryCard
                title="Population at Risk"
                value={`${(dynamicPopulationAtRisk / 1000).toFixed(1)}K`}
                icon={<UsersIcon className="w-8 h-8" />}
                color="yellow"
                subtitle={`${Math.round((dynamicPopulationAtRisk / totalPopulation) * 100)}% of monitored total`}
              />
              <SummaryCard
                title="Overcapacity (OCI > 1.0)"
                value={`${overcapacityCount} Zones`}
                icon={<ArrowPathIcon className="w-8 h-8" />}
                color="red"
                subtitle="ECC limits exceeded"
              />
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Specialized Innovation Action Hub */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BellAlertIcon className="w-5 h-5 text-accent" />
                  Advanced Decision-Support Modules
                </h3>
                <p className="text-xs text-gray-500">
                  Direct answers to why existing national tools (Bhuvan, BHUKOSH) fall short — interactive mathematical decision engines
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                onClick={() => setActiveModal('oci')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-left transition-all flex flex-col justify-between group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block leading-tight">OCI Calculator</span>
                  <span className="text-[10px] text-gray-500">Tune LPCD & Road limits</span>
                </div>
              </button>

              <button
                onClick={() => setActiveModal('bottlenecks')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all flex flex-col justify-between group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <PaperAirplaneIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block leading-tight">Max-Flow Routes</span>
                  <span className="text-[10px] text-gray-500">Egress chokepoint graph</span>
                </div>
              </button>

              <button
                onClick={() => setActiveModal('topsis')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 text-left transition-all flex flex-col justify-between group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <ScaleIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block leading-tight">TOPSIS Ranking</span>
                  <span className="text-[10px] text-gray-500">Multi-criteria relocation</span>
                </div>
              </button>

              <button
                onClick={() => setActiveModal('ddma')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 text-left transition-all flex flex-col justify-between group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <DocumentArrowDownIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block leading-tight">DDMA Dossier</span>
                  <span className="text-[10px] text-gray-500">1-Click official PDF</span>
                </div>
              </button>

              <button
                onClick={() => setActiveModal('voice')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/50 text-left transition-all flex flex-col justify-between group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <SpeakerWaveIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block leading-tight">Voice/SMS Alert</span>
                  <span className="text-[10px] text-gray-500">Bilingual speech audio</span>
                </div>
              </button>

              <button
                onClick={() => setActiveModal('joshimath')}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-left transition-all flex flex-col justify-between group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BuildingOffice2Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block leading-tight">Joshimath 2023</span>
                  <span className="text-[10px] text-gray-500">42-Day early lead test</span>
                </div>
              </button>
            </div>
          </div>

          {/* Top Priority Zones Section (Re-ranks live with DRS) */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Live Dynamic Priority Ranking
                  </h2>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-900">
                    Rainfall: {simulatedRainfallMm}mm
                  </span>
                </div>
                <p className="text-gray-600 mt-1 text-sm">
                  Ranked live using DRS = MHI × [1 + α((R_cum - R_thresh)/R_thresh)]. Zones dynamically shift priority as rainfall escalates.
                </p>
              </div>
              <Link
                href="/relocation"
                className="px-5 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <span>Full Relocation Registry</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {/* Zone Cards with DRS & OCI integration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topRiskZones.map((zone, idx) => {
                const drs = drsMap[zone.id];
                const oci = ociMap[zone.id];

                return (
                  <div
                    key={zone.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:shadow-hover transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header with Live DRS Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {oci?.isOvercapacity && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white animate-pulse">
                              OCI: {oci.oci.toFixed(2)} OVER
                            </span>
                          )}
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase text-white"
                            style={{ backgroundColor: drs?.riskColor || '#DC2626' }}
                          >
                            DRS: {drs?.drs.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-foreground mb-1">{zone.name}</h3>
                      <p className="text-xs text-gray-500 capitalize mb-4">
                        Hazard: {zone.hazardType.replace(/_/g, ' ')} • Population: {(zone.population / 1000).toFixed(1)}K
                      </p>

                      {/* Mathematical DRS & OCI Telemetry */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Baseline Urgency:</span>
                          <span className="font-semibold text-gray-800">{zone.urgencyScore} / 100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Simulated DRS:</span>
                          <span className="font-bold" style={{ color: drs?.riskColor }}>
                            {drs?.drs.toFixed(1)} ({drs?.percentageChange >= 0 ? `+${drs?.percentageChange}%` : `${drs?.percentageChange}%`})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Carrying Limit (ECC):</span>
                          <span className="font-semibold text-gray-800">{oci?.ecc.toLocaleString('en-US')} persons</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bottleneck Factor:</span>
                          <span className="text-rose-700 font-semibold truncate max-w-[130px]">{oci?.limitingFactor}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 italic mb-4">
                        "{zone.reason}"
                      </p>
                    </div>

                    {/* Quick Action Links to Innovation Modules */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedZoneId(zone.id);
                          setActiveModal('bottlenecks');
                        }}
                        className="flex-1 py-2 px-2.5 text-center text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors truncate"
                      >
                        Evac Bottlenecks
                      </button>
                      <button
                        onClick={() => {
                          setSelectedZoneId(zone.id);
                          setActiveModal('topsis');
                        }}
                        className="flex-1 py-2 px-2.5 text-center text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors truncate"
                      >
                        TOPSIS Sites
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Simulated 72h Precipitation
              </h3>
              <p className="text-3xl font-black text-amber-500 font-mono mb-1">
                {simulatedRainfallMm} mm
              </p>
              <p className="text-xs text-gray-500">
                {simulatedRainfallMm === 0 ? 'Baseline static dry status' : `${avgDrsIncrease}% average vulnerability surge`}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Overcapacity Flagged Zones
              </h3>
              <p className={`text-3xl font-black font-mono mb-1 ${overcapacityCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {overcapacityCount} / {totalZones}
              </p>
              <p className="text-xs text-gray-500">Settlements exceeding physical/civil ECC</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Mean Dynamic Risk Score
              </h3>
              <p className="text-3xl font-black text-foreground font-mono mb-1">
                {(totalCurrentDrs / totalZones).toFixed(1)} / 100
              </p>
              <p className="text-xs text-gray-500">Average across all 8 monitored sectors</p>
            </div>
          </div>

          {/* Call to Action Banner */}
          <div className="bg-gradient-to-r from-accent to-blue-800 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to explore geographic distributions?</h3>
                <p className="text-blue-100 text-sm max-w-xl">
                  Inspect color-shifting markers on the interactive Leaflet map, visualize min-cut road bottlenecks in red, and export ready-to-sign official DDMA reports.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/map"
                  className="px-6 py-3 bg-white text-accent font-bold text-sm rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap shadow-md"
                >
                  Open Interactive Map →
                </Link>
                <button
                  onClick={() => setActiveModal('ddma')}
                  className="px-6 py-3 border-2 border-white text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  Generate Dossier
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Interactive Innovation Modals */}
      <OciSettingsModal
        isOpen={activeModal === 'oci'}
        onClose={() => setActiveModal(null)}
        zones={hazardZonesData}
        selectedZoneId={selectedZoneId}
        onSelectZoneId={setSelectedZoneId}
        params={infrastructureParams}
        onParamsChange={setInfrastructureParams}
      />

      <EvacuationBottleneckModal
        isOpen={activeModal === 'bottlenecks'}
        onClose={() => setActiveModal(null)}
        zones={hazardZonesData}
        selectedZoneId={selectedZoneId}
        onSelectZoneId={setSelectedZoneId}
      />

      <TopsisRecommenderModal
        isOpen={activeModal === 'topsis'}
        onClose={() => setActiveModal(null)}
        zones={hazardZonesData}
        selectedZoneId={selectedZoneId}
        onSelectZoneId={setSelectedZoneId}
      />

      <DdmaReportModal
        isOpen={activeModal === 'ddma'}
        onClose={() => setActiveModal(null)}
        zones={hazardZonesData}
        simulatedRainfallMm={simulatedRainfallMm}
      />

      <VoiceAlertModal
        isOpen={activeModal === 'voice'}
        onClose={() => setActiveModal(null)}
        zones={hazardZonesData}
        selectedZoneId={selectedZoneId}
        onSelectZoneId={setSelectedZoneId}
      />

      <JoshimathCaseStudyModal
        isOpen={activeModal === 'joshimath'}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}

