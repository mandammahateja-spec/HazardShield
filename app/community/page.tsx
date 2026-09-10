'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth, useRequireAuth } from '@/lib/context/AuthContext';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  BellAlertIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  PhotoIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  PhoneIcon,
  XMarkIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CommunityPage() {
  const { user, token, isAuthorized } = useRequireAuth(['community']);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [relocationData, setRelocationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportHazardType, setReportHazardType] = useState('flood');
  const [reportSeverity, setReportSeverity] = useState('high');
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);

  // Fetch Community Data
  const fetchData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);

      // 1. Dashboard
      const dashRes = await fetch(`${API_BASE}/api/community/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (dashRes.ok) {
        const d = await dashRes.json();
        setDashboardData(d.data);
      }

      // 2. Alerts
      const alertsRes = await fetch(`${API_BASE}/api/community/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (alertsRes.ok) {
        const a = await alertsRes.json();
        if (a.data?.alerts && a.data.alerts.length > 0) {
          setAlerts(a.data.alerts);
        } else {
          setAlerts([
            {
              title: 'Orange Alert: Heavy Inflow Warning',
              message: 'Hathnikund barrage outflow increased to 1.8 lakh cusecs. Floodplain low-lying settlements advised to maintain emergency preparedness.',
              createdAt: new Date().toISOString(),
              dispatchedByName: 'DDMA Central Control Room',
              channels: ['SMS Broadcast', 'Public Siren'],
            },
          ]);
        }
      } else {
        setAlerts([
          {
            title: 'Orange Alert: Heavy Inflow Warning',
            message: 'Hathnikund barrage outflow increased to 1.8 lakh cusecs. Floodplain low-lying settlements advised to maintain emergency preparedness.',
            createdAt: new Date().toISOString(),
            dispatchedByName: 'DDMA Central Control Room',
            channels: ['SMS Broadcast', 'Public Siren'],
          },
        ]);
      }

      // 3. Relocation Status
      const relocRes = await fetch(`${API_BASE}/api/community/relocation-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (relocRes.ok) {
        const r = await relocRes.json();
        setRelocationData(r.data);
      }
    } catch (err) {
      console.error('Error fetching community dashboard:', err);
      setAlerts([
        {
          title: 'Orange Alert: Heavy Inflow Warning',
          message: 'Hathnikund barrage outflow increased to 1.8 lakh cusecs. Floodplain low-lying settlements advised to maintain emergency preparedness.',
          createdAt: new Date().toISOString(),
          dispatchedByName: 'DDMA Central Control Room',
          channels: ['SMS Broadcast', 'Public Siren'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Handle Hazard Report Submission
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setIsSubmittingReport(true);
      const res = await fetch(`${API_BASE}/api/community/report-hazard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: reportTitle,
          description: reportDescription,
          hazardType: reportHazardType,
          severity: reportSeverity,
          photoUrl: photoFile || '',
          location: {
            latitude: 28.615,
            longitude: 77.265,
            address: user?.assignedZoneId || 'Yamuna Bank Colony, Ward 4',
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReportSuccessMessage('Report successfully submitted to District Disaster Management Authority (DDMA) for on-ground verification.');
        setReportTitle('');
        setReportDescription('');
        setPhotoFile(null);
        setTimeout(() => {
          setIsReportModalOpen(false);
          setReportSuccessMessage(null);
        }, 2500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 font-medium">
          <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading Community Portal...
        </div>
      </div>
    );
  }

  const zone = dashboardData?.zone;
  const weather = dashboardData?.weather;
  const riskLevel = zone?.riskLevel || 'yellow';

  const riskBadgeStyles = {
    red: 'bg-red-100 text-red-800 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        
        {/* Community Header */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    Community Safety Portal
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Active Citizen Feed
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-8 h-8 text-accent flex-shrink-0" />
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Welcome, {user?.name || 'Resident Citizen'}
                  </h1>
                </div>
                <p className="text-gray-600 mt-1 text-sm">
                  Assigned Sector: <strong className="text-foreground">{zone?.zoneName || 'Yamuna Bank Colony'}</strong> • Connected to District Emergency Operations
                </p>
              </div>

              {/* Action Button: Report Hazard */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-soft transition-colors flex items-center gap-2"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  Report Local Hazard / Concern
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Top Row: Zone Status & Weather Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Zone Risk Status (Read-Only) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    Current Geological & Flood Risk Status
                  </span>
                  <h2 className="text-2xl font-bold text-foreground">{zone?.zoneName || 'Monitored Settlement'}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${riskBadgeStyles[riskLevel as keyof typeof riskBadgeStyles]}`}>
                  {riskLevel === 'red' ? 'Critical Red Alert' : riskLevel === 'yellow' ? 'Moderate Warning' : 'Safe Baseline'}
                </span>
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 mb-6">
                <div>
                  <span className="text-xs text-gray-500 block">Dynamic Risk Score</span>
                  <span className="text-2xl font-black text-foreground">{zone?.drsScore || zone?.riskScore || 88}/100</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Population Capacity</span>
                  <span className="text-2xl font-bold text-foreground">{zone?.population?.toLocaleString() || '32,000'}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-xs text-gray-500 block">Limiting Infrastructure Factor</span>
                  <span className="text-sm font-semibold text-rose-700">{zone?.limitingFactor || 'Drainage Discharge Capacity'}</span>
                </div>
              </div>

              {/* Advisory Box */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <strong className="block font-bold mb-0.5">Civil Safety Advisory:</strong>
                  {riskLevel === 'red'
                    ? 'Dynamic Risk Score exceeds safety limit. Embankment overflows likely under continued rainfall. Maintain communication devices charged and monitor designated transit pickup points.'
                    : 'Normal community operations in effect. Routine drainage and slope telemetry active.'}
                </div>
              </div>
            </div>

            {/* Weather & Satellite Feed */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  <CloudIcon className="w-4 h-4 text-accent" />
                  Meteorological Telemetry
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-foreground">{weather?.rainfallMm || 185.4}</span>
                  <span className="text-gray-500 text-sm font-bold">mm / 72h</span>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Condition: <strong>{weather?.condition || 'Heavy Monsoon Precipitation'}</strong> • Source: OpenWeatherMap / Hydrological telemetry
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Emergency Support Numbers
                </span>
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span className="flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5 text-accent" /> Emergency: 112</span>
                  <span className="flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5 text-accent" /> DDMA: 1077</span>
                  <span className="flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5 text-accent" /> State: 1070</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Row: Emergency Alerts Inbox & Relocation Assistance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Live Authority Alerts Inbox */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BellAlertIcon className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-bold text-foreground">Emergency Alerts Inbox</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-accent">
                  {alerts.length} Dispatched
                </span>
              </div>

              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  No active emergency broadcasts for your sector.
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((a, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-red-50/70 border border-red-200">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-red-900">{a.title}</span>
                        <span className="text-[10px] font-semibold text-red-700 bg-red-200/60 px-1.5 py-0.5 rounded">
                          {new Date(a.createdAt || a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-red-800 leading-relaxed mb-2">{a.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-red-100">
                        <span>Dispatched by: {a.dispatchedByName || 'District Incident Commander'}</span>
                        <span className="capitalize">Channels: {Array.isArray(a.channels) ? a.channels.join(', ') : 'SMS, Email'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Relocation Assistance & Safe Shelters */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowPathIcon className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-bold text-foreground">Evacuation Assistance & Shelters</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {relocationData?.activeRelocationPlan ? 'Plan Active' : 'Standby'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <span className="font-bold text-gray-800 block mb-0.5">Status:</span>
                  <p className="text-gray-600">
                    {relocationData?.activeRelocationPlan?.reason || 'Evacuation transit corridors pre-identified by State Disaster Management Authority.'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">
                    Designated Safe High-Ground Shelters:
                  </span>
                  <div className="space-y-2">
                    {(relocationData?.designatedShelters || [
                      { siteName: 'Dwarka Relocation Transit Complex', safeCapacityAvailable: 4500, distanceKm: 18.2 },
                      { siteName: 'Greater Noida Eco Township Hub', safeCapacityAvailable: 12000, distanceKm: 28.5 },
                    ]).map((site: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-white hover:border-accent transition-colors flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-gray-900 block">{site.siteName}</span>
                          <span className="text-gray-500 text-[11px]">{site.distanceKm} km away • Safe high-ground zone</span>
                        </div>
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded text-[11px]">
                          {site.safeCapacityAvailable?.toLocaleString()} beds available
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Hazard Reporting Modal */}
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden relative z-[10000]">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-6 h-6 text-rose-600" />
                  <h3 className="text-lg font-bold text-foreground">Report Local Hazard Concern</h3>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleReportSubmit} className="p-6 space-y-4 text-xs">
                {reportSuccessMessage ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                    <CheckCircleIcon className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold text-sm">Submission Received</p>
                    <p>{reportSuccessMessage}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-500 text-[11px]">
                      Your report will be automatically transmitted to District Disaster Management Officers for immediate verification and AI risk engine recalibration.
                    </p>

                    <div>
                      <label className="font-bold text-gray-800 block mb-1">Hazard Concern Title</label>
                      <input
                        type="text"
                        required
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="e.g. Drainage overflow near Sector 4 culvert"
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-800 block mb-1">Hazard Type</label>
                        <select
                          value={reportHazardType}
                          onChange={(e) => setReportHazardType(e.target.value)}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white"
                        >
                          <option value="flood">Flood / Waterlogging</option>
                          <option value="landslide">Landslide / Slope Crack</option>
                          <option value="cyclone">Cyclone / Severe Wind</option>
                          <option value="earthquake">Structural Subsidence</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-gray-800 block mb-1">Observed Severity</label>
                        <select
                          value={reportSeverity}
                          onChange={(e) => setReportSeverity(e.target.value)}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white"
                        >
                          <option value="low">Low (Minor pooling)</option>
                          <option value="medium">Medium (Road block)</option>
                          <option value="high">High (Entering homes)</option>
                          <option value="critical">Critical (Imminent breach)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-gray-800 block mb-1">Detailed Description</label>
                      <textarea
                        required
                        rows={3}
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Describe the hazard location, visible signs of damage, and immediate risk to human life..."
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-800 block mb-1">Photo Evidence (Optional)</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <PhotoIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <span className="text-[11px] text-gray-600 block">Click to attach photo or camera capture</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="hazard-photo-upload"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setPhotoFile(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                        />
                        <label htmlFor="hazard-photo-upload" className="text-accent hover:underline font-bold text-[11px] cursor-pointer">
                          {photoFile ? 'Photo attached ✓' : 'Browse image'}
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReport}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors shadow-soft"
                      >
                        {isSubmittingReport ? 'Submitting...' : 'Submit to District DMA'}
                      </button>
                    </div>
                  </>
                )}
              </form>

            </div>
          </div>
        )}

      </main>
    </>
  );
}
