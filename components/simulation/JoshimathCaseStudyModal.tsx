'use client';

import React, { useState } from 'react';
import {
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { JOSHIMATH_CASE_STUDY } from '@/lib/engine/joshimathBenchmark';

interface JoshimathCaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoshimathCaseStudyModal({
  isOpen,
  onClose,
}: JoshimathCaseStudyModalProps) {
  const [activeStep, setActiveStep] = useState<number>(1); // Default to critical milestone

  if (!isOpen) return null;

  const data = JOSHIMATH_CASE_STUDY;
  const currentMilestone = data.timeline[activeStep];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative z-[10000]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <BuildingOffice2Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Historical Case Study: 2023 Joshimath Subsidence
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                  Illustrative Backtest
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Proving practical relevance: How HazardShield's DRS + OCI model would have generated early warning 42 days prior
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
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <p>
              <strong>Disaster Context:</strong> {data.eventSummary}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-gray-600 font-mono text-[11px]">
              <span>Location: {data.location}</span>
              <span>Affected Pop: {data.totalPopulationAffected.toLocaleString('en-US')}</span>
              <span>Damaged Structures: {data.structuresDamaged}</span>
            </div>
          </div>

          {/* Benchmark Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.benchmarkMetrics.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block mb-1">
                    {m.metric}
                  </span>
                  <div className="text-xs text-gray-500 line-through mb-1">
                    Manual: {m.traditional}
                  </div>
                  <div className="text-xs font-bold text-gray-900 mb-2">
                    HazardShield: {m.hazardShield}
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 text-center">
                  {m.delta}
                </span>
              </div>
            ))}
          </div>

          {/* Interactive Timeline Stepper */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4 text-accent" />
                <span>Timeline Comparison Stepper</span>
              </h4>
              <span className="text-xs text-gray-500">Select milestone to inspect backtest:</span>
            </div>

            {/* Step Selector Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {data.timeline.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeStep === idx
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/30'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[10px] font-bold font-mono opacity-80 block">{step.date}</span>
                  <span className="text-xs font-bold truncate block">{step.stageTitle}</span>
                </button>
              ))}
            </div>

            {/* Active Milestone Detailed Side-by-Side Comparison */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-xs font-bold text-indigo-600 font-mono">
                    MILESTONE: {currentMilestone.date}
                  </span>
                  <h4 className="text-lg font-bold text-gray-950">{currentMilestone.stageTitle}</h4>
                </div>
                {currentMilestone.leadTimeGainedDays > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    +{currentMilestone.leadTimeGainedDays} Days Earlier Warning
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Traditional Response */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                    Traditional / Manual Administrative Protocol:
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {currentMilestone.traditionalMethod.action}
                  </p>
                  <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100 italic">
                    ⚠️ {currentMilestone.traditionalMethod.delayNotice}
                  </div>
                </div>

                {/* HazardShield AI Protocol */}
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                      HazardShield Automated Intelligence:
                    </span>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold">
                      <span className="text-rose-700">DRS: {currentMilestone.hazardShieldSystem.drsScore}</span>
                      <span className="text-amber-700">OCI: {currentMilestone.hazardShieldSystem.ociValue}</span>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    {currentMilestone.hazardShieldSystem.action}
                  </p>
                  {currentMilestone.hazardShieldSystem.bottleneckFlagged && (
                    <div className="text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded border border-amber-200 font-semibold">
                      🛣️ Evacuation Chokepoint Flagged: {currentMilestone.hazardShieldSystem.bottleneckFlagged}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Strategic Takeaways */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
              Key Strategic Capabilities & Governance Advantages:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {data.keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            *Historical dates and timelines are illustrative benchmarks modeled after NDMA/CBRI published reports.
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
