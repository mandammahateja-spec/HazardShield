'use client';

import Navbar from '@/components/Navbar';
import SummaryCard from '@/components/SummaryCard';
import ZoneCard from '@/components/ZoneCard';
import { hazardZonesData } from '@/data/hazardZones';
import {
  MapPinIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Dashboard() {
  const totalZones = hazardZonesData.length;
  const highRiskZones = hazardZonesData.filter((z) => z.riskLevel === 'high').length;
  const totalPopulation = hazardZonesData.reduce((sum, z) => sum + z.population, 0);
  const populationAtRisk = hazardZonesData
    .filter((z) => z.riskLevel === 'high' || z.riskLevel === 'medium')
    .reduce((sum, z) => sum + z.population, 0);
  const pendingRelocations = hazardZonesData.filter((z) => z.urgencyScore > 75).length;

  const topRiskZones = [...hazardZonesData].sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-muted via-white to-blue-50 border-b border-border py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
                HazardShield Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                AI-powered geospatial platform for hazard-zone identification and relocation planning
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Zones Monitored"
                value={totalZones}
                icon={<MapPinIcon className="w-8 h-8" />}
                color="blue"
                subtitle="Active monitoring zones"
              />
              <SummaryCard
                title="High-Risk Zones"
                value={highRiskZones}
                icon={<ExclamationTriangleIcon className="w-8 h-8" />}
                color="red"
                trend="up"
                trendValue="Requires immediate attention"
              />
              <SummaryCard
                title="Population at Risk"
                value={`${(populationAtRisk / 1000).toFixed(0)}K`}
                icon={<UsersIcon className="w-8 h-8" />}
                color="yellow"
                subtitle={`${Math.round((populationAtRisk / totalPopulation) * 100)}% of total`}
              />
              <SummaryCard
                title="Pending Relocations"
                value={pendingRelocations}
                icon={<ArrowPathIcon className="w-8 h-8" />}
                color="red"
                trend="up"
                trendValue="High urgency"
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Total Population
              </h3>
              <p className="text-3xl font-bold text-foreground mb-2">
                {(totalPopulation / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-gray-500">Across all monitored zones</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Capacity Status
              </h3>
              <p className="text-3xl font-bold text-risk-medium mb-2">
                {Math.round((populationAtRisk / totalPopulation) * 100)}%
              </p>
              <p className="text-xs text-gray-500">Zones exceeding capacity</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Avg Urgency Score
              </h3>
              <p className="text-3xl font-bold text-risk-high mb-2">
                {(hazardZonesData.reduce((sum, z) => sum + z.urgencyScore, 0) / totalZones).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">Average across all zones</p>
            </div>
          </div>

          {/* Top Risk Zones Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Top Priority Zones</h2>
                <p className="text-gray-600 mt-1">Most urgent zones requiring immediate attention</p>
              </div>
              <Link
                href="/relocation"
                className="px-6 py-2 bg-accent text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topRiskZones.map((zone) => (
                <ZoneCard key={zone.id} zone={zone} showActions={true} />
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-accent to-blue-700 rounded-xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Need to explore more?</h3>
                <p className="text-blue-100">
                  View interactive maps, detailed zone analysis, and generate comprehensive reports.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/map"
                  className="px-6 py-3 bg-white text-accent font-semibold rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                >
                  View Map
                </Link>
                <Link
                  href="/reports"
                  className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                >
                  Generate Report
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
