export interface Zone {
  id: string;
  name: string;
  hazardType: 'flood' | 'landslide' | 'earthquake' | 'cyclone' | 'drought';
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number;
  population: number;
  latitude: number;
  longitude: number;
  carryingCapacity: number;
  currentPopulation: number;
  capacityStatus: 'overcrowded' | 'at-limit' | 'available';
  lastUpdated: string;
  urgencyScore: number;
  suggestedShelter?: string;
}

export const zones: Zone[] = [
  {
    id: '1',
    name: 'Rohini Sector 15',
    hazardType: 'flood',
    riskLevel: 'high',
    riskScore: 87,
    population: 45000,
    latitude: 28.7406,
    longitude: 77.0683,
    carryingCapacity: 35000,
    currentPopulation: 45000,
    capacityStatus: 'overcrowded',
    lastUpdated: '2024-01-15T10:30:00Z',
    urgencyScore: 94,
    suggestedShelter: 'Rohini Community Center'
  },
  {
    id: '2',
    name: 'Yamuna Bank Colony',
    hazardType: 'flood',
    riskLevel: 'high',
    riskScore: 92,
    population: 32000,
    latitude: 28.6139,
    longitude: 77.2680,
    carryingCapacity: 25000,
    currentPopulation: 32000,
    capacityStatus: 'overcrowded',
    lastUpdated: '2024-01-15T09:45:00Z',
    urgencyScore: 98,
    suggestedShelter: 'Geeta Colony Relief Camp'
  },
  {
    id: '3',
    name: 'Majnu Ka Tilla',
    hazardType: 'landslide',
    riskLevel: 'medium',
    riskScore: 58,
    population: 18000,
    latitude: 28.7041,
    longitude: 77.2127,
    carryingCapacity: 22000,
    currentPopulation: 18000,
    capacityStatus: 'available',
    lastUpdated: '2024-01-14T16:20:00Z',
    urgencyScore: 45
  },
  {
    id: '4',
    name: 'Burari Village',
    hazardType: 'flood',
    riskLevel: 'medium',
    riskScore: 62,
    population: 28000,
    latitude: 28.7523,
    longitude: 77.2010,
    carryingCapacity: 30000,
    currentPopulation: 28000,
    capacityStatus: 'at-limit',
    lastUpdated: '2024-01-15T08:00:00Z',
    urgencyScore: 52
  },
  {
    id: '5',
    name: 'Wazirpur Industrial',
    hazardType: 'earthquake',
    riskLevel: 'low',
    riskScore: 28,
    population: 15000,
    latitude: 28.6995,
    longitude: 77.1622,
    carryingCapacity: 25000,
    currentPopulation: 15000,
    capacityStatus: 'available',
    lastUpdated: '2024-01-13T12:00:00Z',
    urgencyScore: 15
  },
  {
    id: '6',
    name: 'Narela Zone',
    hazardType: 'cyclone',
    riskLevel: 'high',
    riskScore: 78,
    population: 52000,
    latitude: 28.8456,
    longitude: 77.0973,
    carryingCapacity: 40000,
    currentPopulation: 52000,
    capacityStatus: 'overcrowded',
    lastUpdated: '2024-01-15T07:30:00Z',
    urgencyScore: 85,
    suggestedShelter: 'Narela Sports Complex'
  },
  {
    id: '7',
    name: 'Bawana Industrial',
    hazardType: 'flood',
    riskLevel: 'medium',
    riskScore: 55,
    population: 22000,
    latitude: 28.7950,
    longitude: 77.0520,
    carryingCapacity: 28000,
    currentPopulation: 22000,
    capacityStatus: 'available',
    lastUpdated: '2024-01-14T18:45:00Z',
    urgencyScore: 38
  },
  {
    id: '8',
    name: 'Najafgarh Basin',
    hazardType: 'drought',
    riskLevel: 'medium',
    riskScore: 48,
    population: 35000,
    latitude: 28.6100,
    longitude: 76.9800,
    carryingCapacity: 35000,
    currentPopulation: 35000,
    capacityStatus: 'at-limit',
    lastUpdated: '2024-01-14T14:30:00Z',
    urgencyScore: 42
  },
  {
    id: '9',
    name: 'Alipur Rural',
    hazardType: 'flood',
    riskLevel: 'low',
    riskScore: 32,
    population: 12000,
    latitude: 28.8000,
    longitude: 77.1500,
    carryingCapacity: 20000,
    currentPopulation: 12000,
    capacityStatus: 'available',
    lastUpdated: '2024-01-13T20:00:00Z',
    urgencyScore: 18
  },
  {
    id: '10',
    name: 'Sultanpuri Extension',
    hazardType: 'earthquake',
    riskLevel: 'low',
    riskScore: 22,
    population: 19000,
    latitude: 28.6825,
    longitude: 77.0715,
    carryingCapacity: 25000,
    currentPopulation: 19000,
    capacityStatus: 'available',
    lastUpdated: '2024-01-12T11:00:00Z',
    urgencyScore: 12
  },
  {
    id: '11',
    name: 'Pooth Khurd',
    hazardType: 'landslide',
    riskLevel: 'high',
    riskScore: 75,
    population: 24000,
    latitude: 28.7200,
    longitude: 77.0800,
    carryingCapacity: 20000,
    currentPopulation: 24000,
    capacityStatus: 'overcrowded',
    lastUpdated: '2024-01-15T06:00:00Z',
    urgencyScore: 82,
    suggestedShelter: 'Bawana Community Hall'
  },
  {
    id: '12',
    name: 'Karawal Nagar',
    hazardType: 'flood',
    riskLevel: 'medium',
    riskScore: 60,
    population: 38000,
    latitude: 28.7150,
    longitude: 77.2750,
    carryingCapacity: 40000,
    currentPopulation: 38000,
    capacityStatus: 'at-limit',
    lastUpdated: '2024-01-14T22:15:00Z',
    urgencyScore: 48
  }
];

export const hazardTypes = [
  { value: 'flood', label: 'Flood', icon: '💧' },
  { value: 'landslide', label: 'Landslide', icon: '🏔️' },
  { value: 'earthquake', label: 'Earthquake', icon: '🌍' },
  { value: 'cyclone', label: 'Cyclone', icon: '🌀' },
  { value: 'drought', label: 'Drought', icon: '☀️' },
];

export const riskLevels = [
  { value: 'high', label: 'High Risk', color: '#DC2626' },
  { value: 'medium', label: 'Medium Risk', color: '#F59E0B' },
  { value: 'low', label: 'Low Risk', color: '#10B981' },
];
