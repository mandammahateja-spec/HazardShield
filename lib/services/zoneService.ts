import { hazardZonesData, HazardZone } from '@/data/hazardZones';
import { DashboardStatistics } from '@/types/api';

/**
 * Service abstraction for Hazard Zone data access and business logic.
 * 
 * Future database integration:
 * When connecting to PostgreSQL/PostGIS (e.g., via Prisma or raw SQL),
 * replace the in-memory array operations within this service class.
 * Route handlers and consumers will remain untouched.
 */
class ZoneService {
  /**
   * Retrieve all hazard zones.
   */
  async getAllZones(): Promise<HazardZone[]> {
    return [...hazardZonesData];
  }

  /**
   * Retrieve a single hazard zone by its unique identifier.
   */
  async getZoneById(id: string): Promise<HazardZone | null> {
    const zone = hazardZonesData.find((z) => z.id === id);
    return zone ? { ...zone } : null;
  }

  /**
   * Calculate aggregated dashboard statistics from monitored hazard zones.
   */
  async getStatistics(): Promise<DashboardStatistics> {
    const totalZones = hazardZonesData.length;
    
    // High-risk zones
    const highRiskZones = hazardZonesData.filter((z) => z.riskLevel === 'high').length;
    
    // Total population living in High or Medium risk zones
    const populationAtRisk = hazardZonesData
      .filter((z) => z.riskLevel === 'high' || z.riskLevel === 'medium')
      .reduce((sum, z) => sum + z.population, 0);
      
    // Zones where current population exceeds carrying capacity
    const overCapacityZones = hazardZonesData.filter(
      (z) => z.population > z.carryingCapacity
    ).length;
    
    // Mean urgency score across all zones, rounded to two decimal places
    const totalUrgency = hazardZonesData.reduce((sum, z) => sum + z.urgencyScore, 0);
    const averageUrgencyScore =
      totalZones > 0 ? Math.round((totalUrgency / totalZones) * 100) / 100 : 0;

    return {
      totalZones,
      highRiskZones,
      populationAtRisk,
      overCapacityZones,
      averageUrgencyScore,
    };
  }
}

export const zoneService = new ZoneService();
