'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { hazardZonesData, mockReports, MockReport } from '@/data/hazardZones';
import { DocumentArrowDownIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import DdmaReportModal from '@/components/simulation/DdmaReportModal';
import { useRequireAuth } from '@/lib/context/AuthContext';

export default function ReportsPage() {
  const { isAuthorized } = useRequireAuth(['authority']);
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'relocation' | 'ddma'>('ddma');
  const [includeMap, setIncludeMap] = useState(true);
  const [includCharts, setIncludeCharts] = useState(true);
  const [showDdmaModal, setShowDdmaModal] = useState(false);

  const highRiskZones = hazardZonesData.filter((z) => z.riskLevel === 'high');
  const totalPopulation = hazardZonesData.reduce((sum, z) => sum + z.population, 0);
  const populationAtRisk = hazardZonesData
    .filter((z) => z.riskLevel === 'high' || z.riskLevel === 'medium')
    .reduce((sum, z) => sum + z.population, 0);

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

  const handleGenerateReport = () => {
    setShowDdmaModal(true);
  };

  const handleDownloadCSV = () => {
    // Mock CSV generation
    let csv = 'Zone Name,Hazard Type,Risk Level,Population,Carrying Capacity,Urgency Score,Last Updated\n';
    hazardZonesData.forEach((zone) => {
      csv += `"${zone.name}","${zone.hazardType}","${zone.riskLevel}",${zone.population},${zone.carryingCapacity},${zone.urgencyScore},"${zone.lastUpdated}"\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `hazardshield_zones_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-3">
              <DocumentArrowDownIcon className="w-8 h-8 text-accent" />
              <h1 className="text-4xl font-bold text-foreground">Reports & Export</h1>
            </div>
            <p className="text-gray-600 max-w-2xl">
              Generate comprehensive reports and export data about current risk zones, relocation priorities, and
              hazard assessments in PDF or CSV format.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Report Generator */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-border p-8 shadow-card">
                <h2 className="text-2xl font-bold text-foreground mb-6">Generate Report</h2>

                {/* Report Type Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-4">Report Type</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border-2 border-emerald-500 bg-emerald-50/50 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors">
                      <input
                        type="radio"
                        name="reportType"
                        value="ddma"
                        checked={reportType === 'ddma'}
                        onChange={(e) => setReportType(e.target.value as 'ddma')}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <div>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          <span>Official DDMA District Dossier</span>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-emerald-600 text-white">
                            DM Act 2005
                          </span>
                        </p>
                        <p className="text-xs text-gray-600">Official government letterhead, OCI analysis, max-flow bottlenecks & TOPSIS sites</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                      <input
                        type="radio"
                        name="reportType"
                        value="summary"
                        checked={reportType === 'summary'}
                        onChange={(e) => setReportType(e.target.value as 'summary')}
                        className="w-4 h-4 text-accent"
                      />
                      <div>
                        <p className="font-medium text-foreground">Summary Report</p>
                        <p className="text-xs text-gray-600">Quick overview of key metrics and high-risk zones</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                      <input
                        type="radio"
                        name="reportType"
                        value="detailed"
                        checked={reportType === 'detailed'}
                        onChange={(e) => setReportType(e.target.value as 'detailed')}
                        className="w-4 h-4 text-accent"
                      />
                      <div>
                        <p className="font-medium text-foreground">Detailed Report</p>
                        <p className="text-xs text-gray-600">Comprehensive analysis of all zones with full data</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                      <input
                        type="radio"
                        name="reportType"
                        value="relocation"
                        checked={reportType === 'relocation'}
                        onChange={(e) => setReportType(e.target.value as 'relocation')}
                        className="w-4 h-4 text-accent"
                      />
                      <div>
                        <p className="font-medium text-foreground">Relocation Plan</p>
                        <p className="text-xs text-gray-600">Prioritized relocation strategy and recommendations</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Options */}
                <div className="mb-8 p-4 bg-muted rounded-lg border border-border">
                  <label className="block text-sm font-semibold text-gray-700 mb-4">Report Options</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeMap}
                        onChange={(e) => setIncludeMap(e.target.checked)}
                        className="w-4 h-4 text-accent rounded"
                      />
                      <span className="text-sm text-gray-700">Include interactive map</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includCharts}
                        onChange={(e) => setIncludeCharts(e.target.checked)}
                        className="w-4 h-4 text-accent rounded"
                      />
                      <span className="text-sm text-gray-700">Include data visualizations</span>
                    </label>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateReport}
                  className="w-full px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Generate PDF Report
                </button>

                {/* CSV Export */}
                <button
                  onClick={handleDownloadCSV}
                  className="w-full mt-4 px-6 py-3 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Export as CSV
                </button>
              </div>

              {/* Report Preview */}
              <div className="mt-8 bg-white rounded-xl border border-border p-8 shadow-card">
                <h3 className="text-xl font-bold text-foreground mb-6">Report Preview</h3>

                <div className="space-y-6">
                  {/* Title Page Preview */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                    <h4 className="text-2xl font-bold text-foreground mb-2">HazardShield Report</h4>
                    <p className="text-sm text-gray-600 mb-4">{reportType.charAt(0).toUpperCase() + reportType.slice(1)}</p>
                    <p className="text-xs text-gray-500" suppressHydrationWarning>
                      Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Key Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-gray-600">Total Zones</p>
                        <p className="text-2xl font-bold text-foreground">{hazardZonesData.length}</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs text-gray-600">High-Risk</p>
                        <p className="text-2xl font-bold text-risk-high">{highRiskZones.length}</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <p className="text-xs text-gray-600">Total Population</p>
                        <p className="text-2xl font-bold text-risk-medium">{(totalPopulation / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <p className="text-xs text-gray-600">At Risk</p>
                        <p className="text-2xl font-bold text-orange-600">{(populationAtRisk / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                  </div>

                  {reportType !== 'summary' && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Zone Details</h4>
                      <p className="text-sm text-gray-600">Complete data for all monitored zones including hazard types, risk assessments, and carrying capacity analysis.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Reports */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Previous Reports</h3>
                <div className="space-y-3">
                  {mockReports.map((report: MockReport) => (
                    <div key={report.id} className="p-4 bg-muted rounded-lg border border-border hover:border-gray-300 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <DocumentArrowDownIcon className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{report.title}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1" suppressHydrationWarning>
                            <CalendarIcon className="w-3 h-3" />
                            {new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {report.zones} zones • {report.highRiskZones} high-risk
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-accent to-blue-700 rounded-xl p-6 text-white shadow-card">
                <h3 className="text-lg font-semibold mb-4">Current Dashboard Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Total Zones:</span>
                    <span className="font-bold">{hazardZonesData.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>High Risk:</span>
                    <span className="font-bold">{highRiskZones.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Population:</span>
                    <span className="font-bold">{(totalPopulation / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>At Risk:</span>
                    <span className="font-bold">{(populationAtRisk / 1000).toFixed(0)}K</span>
                  </div>
                </div>

                <Link
                  href="/"
                  className="mt-6 block w-full text-center px-4 py-2 bg-white text-accent font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>

              {/* Help Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-foreground mb-3">Report Tips</h4>
                <ul className="text-xs text-gray-700 space-y-2 list-disc list-inside">
                  <li>Summary reports are best for executive overviews</li>
                  <li>Detailed reports include all zone data</li>
                  <li>Use CSV for data analysis in spreadsheets</li>
                  <li>PDF reports are print-ready</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <DdmaReportModal
        isOpen={showDdmaModal}
        onClose={() => setShowDdmaModal(false)}
        zones={hazardZonesData}
        simulatedRainfallMm={85}
      />
    </>
  );
}
