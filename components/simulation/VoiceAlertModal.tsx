'use client';

import React, { useState } from 'react';
import {
  XMarkIcon,
  SpeakerWaveIcon,
  StopIcon,
  DevicePhoneMobileIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { HazardZone } from '@/data/hazardZones';
import {
  generateEmergencyAlert,
  speakAlertMessage,
} from '@/lib/engine/voiceAlertService';
import { useAuth } from '@/lib/context/AuthContext';

interface VoiceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: HazardZone[];
  selectedZoneId: string;
  onSelectZoneId: (id: string) => void;
}

export default function VoiceAlertModal({
  isOpen,
  onClose,
  zones,
  selectedZoneId,
  onSelectZoneId,
}: VoiceAlertModalProps) {
  const { user, token } = useAuth();
  const [selectedLang, setSelectedLang] = useState<'hi' | 'en' | 'mr'>('hi');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const alerts = generateEmergencyAlert(
    currentZone.name,
    currentZone.hazardType,
    currentZone.urgencyScore,
    'Designated Multi-Purpose Relief Shelter'
  );
  const activeAlert = alerts[selectedLang];

  const handlePlayAudio = async () => {
    setIsPlayingAudio(true);
    try {
      await speakAlertMessage(activeAlert.voiceScript, selectedLang, true);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const handleDispatchBroadcast = async () => {
    setIsDispatching(true);
    setDispatchSuccess(null);
    try {
      if (token) {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          await fetch(`${API_BASE}/api/authority/alerts/dispatch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              zoneId: currentZone.id,
              title: activeAlert.headline,
              message: activeAlert.smsBody,
              severity: currentZone.urgencyScore >= 70 ? 'critical' : 'warning',
            }),
          });
        } catch (apiErr) {
          console.warn('Backend alert dispatch fallback to simulated broadcast:', apiErr);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 900));
      setDispatchSuccess(
        `Emergency Alert successfully dispatched to ${currentZone.population.toLocaleString('en-IN')} residents across SMS Broadcast, Public Siren, and Community Portal.`
      );
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative z-[10000]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <SpeakerWaveIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Multilingual Voice & SMS Alert Simulator
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">
                  Web Speech API
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Simulates real-time NDMA/CDAC Cell Broadcast alerts with synthetic voice audio speech
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleStopAudio();
              onClose();
            }}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700">Trigger Zone:</label>
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

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setSelectedLang('hi')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedLang === 'hi'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => setSelectedLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedLang === 'en'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLang('mr')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedLang === 'mr'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                मराठी (Marathi)
              </button>
            </div>
          </div>

          {/* Smartphone Mockup */}
          <div className="max-w-md mx-auto bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl border-4 border-slate-700">
            {/* Phone Screen */}
            <div className="bg-slate-950 rounded-[2rem] p-5 text-white space-y-4 border border-slate-800 min-h-[380px] flex flex-col justify-between">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
                <span>{activeAlert.dispatchedAt}</span>
                <div className="flex items-center gap-1.5">
                  <SignalIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] uppercase text-emerald-400 font-bold">5G • CELL BROADCAST</span>
                </div>
              </div>

              {/* Emergency Alert Bubble */}
              <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-4 shadow-[0_0_20px_rgba(244,63,94,0.3)] space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <ExclamationTriangleIcon className="w-5 h-5 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {activeAlert.senderId}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">
                  {activeAlert.headline}
                </h4>

                <p className="text-xs text-rose-100 bg-black/40 p-3 rounded-xl font-mono leading-relaxed border border-rose-800/50">
                  {activeAlert.smsBody}
                </p>

                <div className="flex items-center justify-between text-[10px] text-rose-300 font-mono pt-1">
                  <span>DISPATCH: AUTOMATIC (DRS &gt; 70%)</span>
                  <span>HELPLINE: 1077</span>
                </div>
              </div>

              {/* Action Buttons Inside Phone Frame */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handlePlayAudio}
                  disabled={isPlayingAudio}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isPlayingAudio
                      ? 'bg-amber-600 text-white animate-pulse'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                  {isPlayingAudio ? 'BROADCASTING SPEECH SYNTHESIS...' : '▶ PLAY VOICE ALERT ALOUD (TTS)'}
                </button>

                {isPlayingAudio && (
                  <button
                    onClick={handleStopAudio}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <StopIcon className="w-3.5 h-3.5" /> Stop Audio Playback
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Multi-Channel Broadcast Action & Telemetry */}
          <div className="space-y-3">
            {dispatchSuccess ? (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-900 flex items-start gap-2.5 animate-fadeIn">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Broadcast Dispatch Complete</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">{dispatchSuccess}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDispatchBroadcast}
                disabled={isDispatching}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition-all disabled:opacity-50 border border-slate-700"
              >
                {isDispatching ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Dispatching via Twilio SMS & CDAC Gateway...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4 text-emerald-400" />
                    <span>Dispatch Multi-Channel Emergency Broadcast to {currentZone.name}</span>
                  </>
                )}
              </button>
            )}

            {/* Telecom Dispatch Telemetry Badge */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Cell Broadcast Gateway:</span>
                <strong className="font-mono">{currentZone.population.toLocaleString('en-IN')} Residents Targeted</strong>
              </div>
              <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                CDAC Gateway Active
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            *Uses browser-native Web Speech API. No third-party audio tokens or fees required.
          </p>
          <button
            onClick={() => {
              handleStopAudio();
              onClose();
            }}
            className="px-5 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
