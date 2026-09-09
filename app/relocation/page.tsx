'use client';

import Navbar from '@/components/Navbar';
import RiskBadge from '@/components/RiskBadge';
import { hazardZonesData } from '@/data/hazardZones';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function RelocationPage() {
  // Sort by urgency score (highest first)
  const prioritizedZones = [...hazardZonesData].sort((a, b) => b.urgencyScore - a.urgencyScore);

  const stats = {
    critical: prioritizedZones.filter((z) => z.urgencyScore >= 80).length,
    high: prioritizedZones.filter((z) => z.urgencyScore >= 60 && z.urgencyScore < 80).length,
    medium: prioritizedZones.filter((z) => z.urgencyScore < 60).length,
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-3">
              <ArrowPathIcon className="w-8 h-8 text-accent" />
              <h1 className="text-4xl font-bold text-foreground">Relocation Priority Dashboard</h1>
            </div>
            <p className="text-gray-600 max-w-2xl">
              Ranked list of zones requiring relocation, prioritized by urgency score. Focus resources on critical
              zones to reduce population at risk.
            </p>
          </div>
        </section>

        {/* Priority Stats */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Critical Priority</span>
                  <ExclamationTriangleIcon className="w-5 h-5 text-risk-high" />
                </div>
                <p className="text-2xl font-bold text-risk-high">{stats.critical} zones</p>
                <p className="text-xs text-gray-600 mt-1">Urgency Score 80+</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">High Priority</span>
                  <ArrowPathIcon className="w-5 h-5 text-risk-medium" />
                </div>
                <p className="text-2xl font-bold text-risk-medium">{stats.high} zones</p>
                <p className="text-xs text-gray-600 mt-1">Urgency Score 60-79</p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Medium Priority</span>
                  <CheckCircleIcon className="w-5 h-5 text-risk-low" />
                </div>
                <p className="text-2xl font-bold text-risk-low">{stats.medium} zones</p>
                <p className="text-xs text-gray-600 mt-1">Urgency Score &lt;60</p>
              </div>
            </div>
          </div>
        </section>

        {/* Relocation List */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            {prioritizedZones.map((zone, index) => {
              const exceedance = Math.max(0, zone.population - zone.carryingCapacity);
              const priorityLevel =
                zone.urgencyScore >= 80 ? 'critical' : zone.urgencyScore >= 60 ? 'high' : 'medium';

              return (
                <div
                  key={zone.id}
                  className={`bg-white border rounded-xl p-6 hover:shadow-hover transition-all ${
                    priorityLevel === 'critical'
                      ? 'border-red-200 bg-red-50'
                      : priorityLevel === 'high'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Rank */}
                    <div className="md:col-span-1">
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            priorityLevel === 'critical'
                              ? 'bg-risk-high'
                              : priorityLevel === 'high'
                                ? 'bg-risk-medium'
                                : 'bg-gray-400'
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Zone Info */}
                    <div className="md:col-span-4">
                      <h3 className="text-lg font-bold text-foreground mb-2">{zone.name}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-semibold">Hazard Type:</span>{' '}
                          <span className="capitalize">{zone.hazardType.replace(/_/g, ' ')}</span>
                        </p>
                        <p className="text-gray-600">
                          <span className="font-semibold">Risk Level:</span>{' '}
                          <RiskBadge level={zone.riskLevel} showLabel={true} />
                        </p>
                      </div>
                    </div>

                    {/* Urgency & Population */}
                    <div className="md:col-span-3">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Urgency Score</p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-risk-high">{zone.urgencyScore}</span>
                            <span className="text-xs text-gray-500">/100</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Population</p>
                          <p className="text-lg font-bold text-foreground">
                            {(zone.population / 1000).toFixed(1)}K
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Status */}
                    <div className="md:col-span-2">
                      <div className="bg-white bg-opacity-60 p-3 rounded-lg border border-current border-opacity-20">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Capacity Status</p>
                        {exceedance > 0 ? (
                          <div>
                            <p className="text-sm font-bold text-risk-high">Over by {exceedance.toLocaleString()}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {Math.round((zone.population / zone.carryingCapacity) * 100)}% capacity
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-bold text-risk-low">Within Capacity</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {Math.round((zone.population / zone.carryingCapacity) * 100)}% capacity
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="md:col-span-2">
                      <div className="bg-white bg-opacity-60 p-3 rounded-lg border border-current border-opacity-20 h-full flex flex-col justify-center">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Reason</p>
                        <p className="text-sm text-gray-700">{zone.reason}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-1 flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-accent text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Summary Box */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-gradient-to-r from-accent to-blue-700 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">Relocation Planning Recommendations</h3>
            <ul className="space-y-2 text-blue-100">
              <li>• Focus immediate resources on the {stats.critical} critical priority zones</li>
              <li>• Establish temporary shelter facilities in adjacent safe zones for population relocation</li>
              <li>• Coordinate with local authorities for evacuation planning and emergency services</li>
              <li>• Monitor weather conditions and hazard forecasts for critical zones</li>
              <li>• Establish feedback mechanisms with relocated communities</li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
