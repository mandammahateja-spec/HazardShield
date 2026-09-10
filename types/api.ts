import { HazardZone } from '@/data/hazardZones';

export interface DashboardStatistics {
  totalZones: number;
  highRiskZones: number;
  populationAtRisk: number;
  overCapacityZones: number;
  averageUrgencyScore: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  timestamp?: string;
}
