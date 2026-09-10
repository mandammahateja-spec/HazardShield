'use client';

import React from 'react';
import {
  XMarkIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { HazardZone } from '@/data/hazardZones';
import { calculateAllZonesDrs } from '@/lib/engine/drsCalculator';
import { calculateAllZonesOci, DEFAULT_INFRASTRUCTURE_PARAMS } from '@/lib/engine/ociEngine';
import { calculateEvacuationFlow } from '@/lib/engine/evacuationFlow';
import { rankResettlementSitesTopsis } from '@/lib/engine/topsisEngine';

interface DdmaReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: HazardZone[];
  simulatedRainfallMm: number;
}

export default function DdmaReportModal({
  isOpen,
  onClose,
  zones,
  simulatedRainfallMm,
}: DdmaReportModalProps) {
  if (!isOpen) return null;

  const drsMap = calculateAllZonesDrs(zones, simulatedRainfallMm);
  const ociMap = calculateAllZonesOci(zones, DEFAULT_INFRASTRUCTURE_PARAMS);

  // Compute key metrics
  const totalPop = zones.reduce((acc, z) => acc + z.population, 0);
  const criticalZones = zones.filter((z) => drsMap[z.id]?.drs >= 70);
  const popAtRisk = criticalZones.reduce((acc, z) => acc + z.population, 0);
  const overcapacityCount = Object.values(ociMap).filter((o) => o.isOvercapacity).length;

  const topCriticalZone = [...zones].sort((a, b) => (drsMap[b.id]?.drs || 0) - (drsMap[a.id]?.drs || 0))[0];
  const topEvac = topCriticalZone ? calculateEvacuationFlow(topCriticalZone) : null;
  const topResettlement = topCriticalZone ? rankResettlementSitesTopsis(topCriticalZone) : [];

  const reportRef = `DDMA/EOC/2026/S-042/ALERT-RED-${Math.floor(1000 + Math.random() * 9000)}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] relative z-[10000]">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide">
              Official District Disaster Management Authority (DDMA) Dossier Generator
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <PrinterIcon className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Official Letterhead & Report Content (Formatted for Print) */}
        <div className="p-8 md:p-12 overflow-y-auto font-serif text-gray-900 bg-white space-y-8 print:p-0 print:overflow-visible">
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-gray-900 pb-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-full border-2 border-gray-800 flex items-center justify-center font-bold text-xs bg-slate-50">
                🇮🇳 DDMA
              </div>
            </div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-gray-700">
              GOVERNMENT OF INDIA • DISASTER MANAGEMENT DIVISION
            </h2>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-950 font-sans">
              DISTRICT DISASTER MANAGEMENT AUTHORITY (DDMA)
            </h1>
            <p className="text-xs italic text-gray-600">
              Constituted under Section 25 of the Disaster Management Act, 2005 (Act No. 53 of 2005)
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-between text-xs font-mono text-gray-700 border-t border-gray-300 mt-4">
              <div>
                <strong>DISPATCH REF:</strong> {reportRef}
              </div>
              <div>
                <strong>SIMULATED SCENARIO:</strong> {simulatedRainfallMm}mm Rainfall (72h)
              </div>
              <div>
                <strong>DATE:</strong> {currentDate}
              </div>
            </div>
          </div>

          {/* Alert Level Banner */}
          <div className="p-4 bg-rose-50 border-l-4 border-rose-600 font-sans rounded-r-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                  STATUTORY EMERGENCY DIRECTIVE • CRITICAL RED ALERT
                </span>
                <h3 className="text-lg font-bold text-gray-950 mt-0.5">
                  Comprehensive Vulnerability, Overcapacity & Phased Evacuation Dossier
                </h3>
              </div>
              <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded">
                CONFIDENTIAL / PRIORITY
              </span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-3 font-sans">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b pb-1 font-mono">
              1. EXECUTIVE SUMMARY & CIVIL DEFENSE SYNOPSIS
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed">
              Based on real-time sensory feeds and HazardShield's predictive Multi-Hazard Index under a simulated 72-hour cumulative precipitation of <strong>{simulatedRainfallMm}mm</strong>, significant portions of the monitored municipal wards have breached critical geological and carrying capacity thresholds. A total of <strong>{criticalZones.length} zones</strong> require immediate operational evacuation protocols.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-center">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Total Monitored Pop</span>
                <span className="text-lg font-bold text-gray-900 font-mono">{(totalPop / 1000).toFixed(1)}K</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <span className="text-[10px] text-rose-700 uppercase font-semibold block">Population at High Risk</span>
                <span className="text-lg font-bold text-rose-700 font-mono">{(popAtRisk / 1000).toFixed(1)}K</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-[10px] text-amber-700 uppercase font-semibold block">Critical Red Zones</span>
                <span className="text-lg font-bold text-amber-700 font-mono">{criticalZones.length} / {zones.length}</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-[10px] text-blue-700 uppercase font-semibold block">Overcapacity (OCI &gt; 1.0)</span>
                <span className="text-lg font-bold text-blue-700 font-mono">{overcapacityCount} Zones</span>
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic Risk Score (DRS) & Overcapacity Status */}
          <div className="space-y-3 font-sans">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b pb-1 font-mono">
              2. ZONE HAZARD ESCALATION & INFRASTRUCTURE OVERCAPACITY STATUS
            </h4>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2">Zone Name</th>
                    <th className="px-3 py-2">Hazard Type</th>
                    <th className="px-3 py-2">Population</th>
                    <th className="px-3 py-2">Baseline Urgency</th>
                    <th className="px-3 py-2">Simulated DRS</th>
                    <th className="px-3 py-2">OCI Value</th>
                    <th className="px-3 py-2">Bottleneck Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {zones.map((z) => {
                    const drs = drsMap[z.id];
                    const oci = ociMap[z.id];
                    return (
                      <tr key={z.id} className={drs?.riskLevel === 'critical' ? 'bg-rose-50/60 font-semibold' : ''}>
                        <td className="px-3 py-2 text-gray-900">{z.name}</td>
                        <td className="px-3 py-2 uppercase text-gray-600">{z.hazardType}</td>
                        <td className="px-3 py-2 font-mono text-gray-700">{z.population.toLocaleString('en-US')}</td>
                        <td className="px-3 py-2 font-mono">{z.urgencyScore}/100</td>
                        <td className="px-3 py-2 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            drs?.riskLevel === 'critical' ? 'bg-rose-600 text-white' : drs?.riskLevel === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {drs?.drs.toFixed(1)} ({drs?.percentageChange >= 0 ? `+${drs?.percentageChange}%` : `${drs?.percentageChange}%`})
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono">
                          <span className={oci?.isOvercapacity ? 'text-rose-700 font-bold' : 'text-gray-700'}>
                            {oci?.oci.toFixed(2)} {oci?.isOvercapacity ? '(OVER)' : ''}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 text-[11px]">{oci?.limitingFactorDescription}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Evacuation Bottlenecks */}
          {topEvac && topCriticalZone && (
            <div className="space-y-3 font-sans">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b pb-1 font-mono">
                3. NETWORK FLOW CHOKEPOINTS (PRIORITY ZONE: {topCriticalZone.name.toUpperCase()})
              </h4>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-2">
                <p className="font-semibold text-gray-900">
                  Ford-Fulkerson Max-Flow Calculation: Maximum Egress Rate = {topEvac.maxFlowPeopleHr.toLocaleString('en-US')} people/hour.
                </p>
                <p className="text-gray-700">
                  Settlement Population: {topEvac.settlementPopulation.toLocaleString('en-US')} • Required Evacuation Clearance Time: <strong>{topEvac.safeEvacuationTimeHours} Hours</strong> (Safe Threshold: {topEvac.targetThresholdHours} Hours).
                </p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="font-bold text-rose-700 uppercase block mb-1">Identified Structural Bottlenecks:</span>
                  <ul className="list-disc list-inside space-y-1 text-gray-800">
                    {topEvac.bottleneckEdges.map((b, i) => (
                      <li key={i}>
                        <strong>{b.roadName}:</strong> {b.reason} (Capacity: {b.capacity} p/hr, {b.flowUtilizationPercent}% Saturated)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Recommended TOPSIS Resettlement Sites */}
          {topResettlement.length > 0 && (
            <div className="space-y-3 font-sans">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b pb-1 font-mono">
                4. TOPSIS-RANKED RESETTLEMENT SITE RECOMMENDATIONS
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topResettlement.slice(0, 2).map((r) => (
                  <div key={r.site.id} className="p-3 border border-gray-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>#{r.rank} {r.site.name}</span>
                      <span className="font-mono text-emerald-700">TOPSIS Score: {r.topsisScore.toFixed(2)}</span>
                    </div>
                    <p className="text-gray-600 italic text-[11px]">{r.site.rationale}</p>
                    <div className="text-[11px] text-gray-700 pt-1 border-t border-gray-100 flex justify-between">
                      <span>Slope: {r.site.slopeDegrees}°</span>
                      <span>Hazard Buffer: {r.site.hazardDistanceKm}km</span>
                      <span>Water: {r.site.waterLpcdCapacity} LPCD</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Statutory Signatures Block */}
          <div className="pt-10 border-t-2 border-gray-900 text-xs font-sans">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="space-y-8">
                <div className="h-10 border-b border-gray-400" />
                <div>
                  <p className="font-bold text-gray-900">Executive Engineer (PWD / Irrigation)</p>
                  <p className="text-gray-500 text-[10px]">Technical Validation Officer</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="h-10 border-b border-gray-400" />
                <div>
                  <p className="font-bold text-gray-900">Additional District Magistrate (DM)</p>
                  <p className="text-gray-500 text-[10px]">Chief Incident Commander</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="h-10 border-b border-gray-400" />
                <div>
                  <p className="font-bold text-gray-900">District Magistrate & Collector</p>
                  <p className="text-gray-500 text-[10px]">Chairman, District Disaster Management Authority</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
